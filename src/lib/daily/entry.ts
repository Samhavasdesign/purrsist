import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ensurePastDaysLocked } from "@/lib/daily/archive";
import { applyCarryoverFromYesterday, dateKey } from "@/lib/daily/carryover";
import { normalizeDailyEntry } from "@/lib/daily/extra-items";
import { markSectionFilledOnceIfNeeded } from "@/lib/daily/section-hints";
import type { DailyEntry, DailySlot } from "@/lib/types/database";
import { DAILY_SLOTS, slotTextColumn } from "@/lib/types/database";

function dbError(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message ?? fallback);
}

/**
 * Auto-create/load today's Daily Entry and apply yesterday's carryover (PRD §7).
 *
 * Wrapped in React `cache()` so the app layout and the dashboard page share one
 * execution per request rather than running this whole sequence twice.
 */
export const getOrCreateTodayEntry = cache(async function getOrCreateTodayEntry(
  userId: string,
): Promise<DailyEntry> {
  const supabase = await createClient();
  const date = dateKey(new Date());

  // Same-day-only editing: anything before today becomes locked (PRD §8).
  // Best-effort — a failure here must not take down the whole page.
  try {
    await ensurePastDaysLocked(userId);
  } catch (error) {
    console.error("ensurePastDaysLocked:", error);
  }

  const { data: existing, error: selectError } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (selectError) throw dbError(selectError, "Failed to load today's entry");

  let today: DailyEntry;

  if (existing) {
    today = normalizeDailyEntry(existing as DailyEntry);
  } else {
    // Layout + page can race on first open — unique (user_id, date) is expected.
    const { data: created, error: insertError } = await supabase
      .from("daily_entries")
      .insert({ user_id: userId, date })
      .select("*")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: raced, error: raceError } = await supabase
          .from("daily_entries")
          .select("*")
          .eq("user_id", userId)
          .eq("date", date)
          .single();
        if (raceError || !raced) {
          throw dbError(raceError, "Failed to load today's entry after create race");
        }
        today = normalizeDailyEntry(raced as DailyEntry);
      } else {
        throw dbError(insertError, "Failed to create today's entry");
      }
    } else {
      today = normalizeDailyEntry(created as DailyEntry);
    }
  }

  // Carryover is a convenience, not load-bearing — if it fails, still hand back
  // today's entry so the page renders.
  try {
    return await applyCarryoverFromYesterday(userId, today);
  } catch (error) {
    console.error("applyCarryoverFromYesterday:", error);
    return normalizeDailyEntry(today);
  }
});

export function findOpenSlot(
  entry: DailyEntry,
  preferred?: DailySlot,
): DailySlot | null {
  if (preferred) {
    const col = slotTextColumn(preferred);
    if (!entry[col]) return preferred;
  }

  for (const { slot } of DAILY_SLOTS) {
    const col = slotTextColumn(slot);
    if (!entry[col]) return slot;
  }

  return null;
}

export async function writeSlot(
  entryId: string,
  slot: DailySlot,
  text: string,
): Promise<void> {
  const supabase = await createClient();
  const col = slotTextColumn(slot);
  const { data, error } = await supabase
    .from("daily_entries")
    .update({ [col]: text })
    .eq("id", entryId)
    .select("*")
    .single();

  if (error) throw dbError(error, "Failed to write slot");

  if (text.trim() && data) {
    const entry = normalizeDailyEntry(data as DailyEntry);
    await markSectionFilledOnceIfNeeded(supabase, entry.user_id, entry, slot);
  }
}

export async function clearSlot(
  entryId: string,
  slot: DailySlot,
): Promise<void> {
  const supabase = await createClient();
  const col = slotTextColumn(slot);
  const doneCol = col.replace("_text", "_done");
  const countCol = col.replace("_text", "_carryover_count");
  const { error } = await supabase
    .from("daily_entries")
    .update({ [col]: null, [doneCol]: false, [countCol]: 0 })
    .eq("id", entryId);

  if (error) throw dbError(error, "Failed to clear slot");
}
