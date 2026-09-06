import { createClient } from "@/lib/supabase/server";
import {
  isMissingExtraItemsColumn,
  newExtraItem,
  normalizeDailyEntry,
  notesPayloadWithExtras,
  readExtraItems,
  type ExtraDailyItem,
} from "@/lib/daily/extra-items";
import { kindForSlot } from "@/lib/daily/section-hints";
import type { DailyEntry, DailySlot } from "@/lib/types/database";
import {
  DAILY_SLOTS,
  listUncheckedFilledSlots,
  slotCarryoverColumn,
  slotDoneColumn,
  slotTextColumn,
} from "@/lib/types/database";

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

/**
 * How far back a single carryover pass will reach for un-swept past days. Wider
 * than the 5-day stagnant window so a stretch of unopened days (or the
 * already-locked backlog from when carryover was broken) still gets pulled
 * forward the first time the dashboard loads.
 */
export const CARRYOVER_LOOKBACK_DAYS = 14;

function normalizedText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export type CarryoverPlan = {
  /** Column patch to apply to today's row (empty when nothing lands in a slot). */
  slotUpdate: Record<string, unknown>;
  /** Full replacement extras array, or null when today's extras are unchanged. */
  extras: ExtraDailyItem[] | null;
  changed: boolean;
};

/**
 * Pure carryover planning: given today and the un-swept past days (oldest
 * first), decide what unresolved tasks move onto today. A task drops into its
 * matching slot when that slot is free, otherwise it rides along as an extra of
 * the same kind — nothing an unchecked day held is ever lost. `carryover_count`
 * carries forward (+1) so the 5-day prompt can still fire. Tasks whose text is
 * already on today (any slot or extra) are skipped, which keeps repeated passes
 * idempotent.
 */
export function planCarryover(
  today: DailyEntry,
  pastEntriesOldestFirst: DailyEntry[],
): CarryoverPlan {
  const seen = new Set<string>();
  const remember = (value: unknown) => {
    const norm = normalizedText(value);
    if (norm) seen.add(norm);
  };

  for (const { slot } of DAILY_SLOTS) remember(today[slotTextColumn(slot)]);
  const todayExtras = readExtraItems(today);
  for (const extra of todayExtras) remember(extra.text);

  const slotUpdate: Record<string, unknown> = {};
  const overflow: ExtraDailyItem[] = [];

  for (const raw of pastEntriesOldestFirst) {
    const source = normalizeDailyEntry(raw);

    for (const item of listUncheckedFilledSlots(source)) {
      const norm = normalizedText(item.text);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);

      const textCol = slotTextColumn(item.slot);
      const slotFree =
        slotUpdate[textCol] === undefined &&
        !String(today[textCol] ?? "").trim();

      if (slotFree) {
        slotUpdate[textCol] = item.text;
        slotUpdate[slotDoneColumn(item.slot)] = false;
        slotUpdate[slotCarryoverColumn(item.slot)] = item.carryover_count + 1;
      } else {
        overflow.push({
          ...newExtraItem(kindForSlot(item.slot)),
          text: item.text,
          done: false,
          carryover_count: item.carryover_count + 1,
        });
      }
    }

    for (const extra of readExtraItems(source)) {
      const text = extra.text.trim();
      const norm = text.toLowerCase();
      if (!text || extra.done || seen.has(norm)) continue;
      seen.add(norm);
      overflow.push({
        ...newExtraItem(extra.kind),
        text,
        done: false,
        carryover_count: extra.carryover_count + 1,
      });
    }
  }

  const extras = overflow.length > 0 ? [...todayExtras, ...overflow] : null;
  const changed = Object.keys(slotUpdate).length > 0 || extras !== null;

  return { slotUpdate, extras, changed };
}

/**
 * On today's load, pull every unresolved task from recent un-swept past days
 * onto today, then mark those days swept + locked so they never carry again.
 *
 * Runs before ensurePastDaysLocked — historically the lock ran first and this
 * always bailed on `yesterday.locked`, so carryover never happened.
 */
export async function applyPendingCarryover(
  userId: string,
  today: DailyEntry,
): Promise<DailyEntry> {
  const supabase = await createClient();
  const earliest = shiftDateKey(today.date, -CARRYOVER_LOOKBACK_DAYS);

  const { data: past, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("carryover_swept", false)
    .gte("date", earliest)
    .lt("date", today.date)
    .order("date", { ascending: true });

  if (error) throw error;
  if (!past || past.length === 0) return normalizeDailyEntry(today);

  const pastEntries = past as DailyEntry[];
  const plan = planCarryover(today, pastEntries);

  let nextToday = normalizeDailyEntry(today);

  if (plan.changed) {
    const update: Record<string, unknown> = { ...plan.slotUpdate };
    if (plan.extras) {
      update.extra_items = plan.extras;
      update.notes = notesPayloadWithExtras(today.notes, plan.extras);
    }

    let updated: DailyEntry | null = null;
    let updateError: { code?: string; message?: string } | null = null;

    {
      const result = await supabase
        .from("daily_entries")
        .update(update)
        .eq("id", today.id)
        .eq("user_id", userId)
        .select("*")
        .single();
      updated = result.data as DailyEntry | null;
      updateError = result.error;
    }

    if (updateError && isMissingExtraItemsColumn(updateError) && plan.extras) {
      const { extra_items: _drop, ...withoutColumn } = update;
      const result = await supabase
        .from("daily_entries")
        .update({
          ...withoutColumn,
          notes: notesPayloadWithExtras(today.notes, plan.extras),
        })
        .eq("id", today.id)
        .eq("user_id", userId)
        .select("*")
        .single();
      updated = result.data as DailyEntry | null;
      updateError = result.error;
    }

    if (updateError) throw updateError;
    nextToday = normalizeDailyEntry(updated as DailyEntry);
  }

  const { error: sweepError } = await supabase
    .from("daily_entries")
    .update({ carryover_swept: true, locked: true })
    .eq("user_id", userId)
    .in(
      "id",
      pastEntries.map((entry) => entry.id),
    );

  if (sweepError) throw sweepError;

  return nextToday;
}

export function slotLabel(slot: DailySlot): string {
  return DAILY_SLOTS.find((s) => s.slot === slot)?.label ?? slot;
}
