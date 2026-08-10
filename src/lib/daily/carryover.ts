import { createClient } from "@/lib/supabase/server";
import {
  isMissingExtraItemsColumn,
  newExtraItem,
  normalizeDailyEntry,
  notesPayloadWithExtras,
  readExtraItems,
  type ExtraDailyItem,
} from "@/lib/daily/extra-items";
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
 * When today loads, carry yesterday's unchecked filled slots into today's
 * matching slots (if empty), bump carryover_count, then lock yesterday.
 * Overflow extras append to today's extras of the same kind.
 */
export async function applyCarryoverFromYesterday(
  userId: string,
  today: DailyEntry,
): Promise<DailyEntry> {
  const supabase = await createClient();
  const yesterdayKey = shiftDateKey(today.date, -1);

  const { data: yesterday, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", yesterdayKey)
    .maybeSingle();

  if (error) throw error;
  if (!yesterday || yesterday.locked) return normalizeDailyEntry(today);

  const source = normalizeDailyEntry(yesterday as DailyEntry);
  const unchecked = listUncheckedFilledSlots(source);
  const todayUpdate: Record<string, unknown> = {};
  let changedToday = false;

  for (const item of unchecked) {
    const textCol = slotTextColumn(item.slot);
    const doneCol = slotDoneColumn(item.slot);
    const countCol = slotCarryoverColumn(item.slot);
    const todayText = String(today[textCol] ?? "").trim();

    if (todayText) {
      continue;
    }

    todayUpdate[textCol] = item.text;
    todayUpdate[doneCol] = false;
    todayUpdate[countCol] = item.carryover_count + 1;
    changedToday = true;
  }

  const todayExtras = readExtraItems(today);
  const carriedExtras: ExtraDailyItem[] = readExtraItems(source)
    .filter((item) => item.text.trim() && !item.done)
    .map((item) => ({
      ...newExtraItem(item.kind),
      text: item.text.trim(),
      done: false,
      carryover_count: item.carryover_count + 1,
    }));

  const nextExtras =
    carriedExtras.length > 0 ? [...todayExtras, ...carriedExtras] : null;

  if (nextExtras) {
    todayUpdate.extra_items = nextExtras;
    todayUpdate.notes = notesPayloadWithExtras(today.notes, nextExtras);
    changedToday = true;
  }

  let nextToday = normalizeDailyEntry(today);

  if (changedToday) {
    let updated: DailyEntry | null = null;
    let updateError: { code?: string; message?: string } | null = null;

    {
      const result = await supabase
        .from("daily_entries")
        .update(todayUpdate)
        .eq("id", today.id)
        .eq("user_id", userId)
        .select("*")
        .single();
      updated = result.data as DailyEntry | null;
      updateError = result.error;
    }

    if (updateError && isMissingExtraItemsColumn(updateError) && nextExtras) {
      const { extra_items: _drop, ...withoutColumn } = todayUpdate;
      const result = await supabase
        .from("daily_entries")
        .update({
          ...withoutColumn,
          notes: notesPayloadWithExtras(today.notes, nextExtras),
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

  const { error: lockError } = await supabase
    .from("daily_entries")
    .update({ locked: true })
    .eq("id", source.id)
    .eq("user_id", userId);

  if (lockError) throw lockError;

  return nextToday;
}

export function slotLabel(slot: DailySlot): string {
  return DAILY_SLOTS.find((s) => s.slot === slot)?.label ?? slot;
}
