import {
  DEFAULT_SLOTS_BY_KIND,
  extrasForKind,
  type DailyItemKind,
} from "@/lib/daily/extra-items";
import type { DailyEntry, HabitWithCheckIn } from "@/lib/types/database";
import { slotDoneColumn, slotTextColumn } from "@/lib/types/database";

const TASK_KINDS: DailyItemKind[] = ["must_do", "should_do", "quick_win"];

/**
 * True when the section has at least one filled item (checked or not).
 */
export function isSectionFilled(
  entry: DailyEntry,
  kind: DailyItemKind,
): boolean {
  const filledSlots = DEFAULT_SLOTS_BY_KIND[kind].filter((slot) =>
    Boolean(String(entry[slotTextColumn(slot)] ?? "").trim()),
  );
  const filledExtras = extrasForKind(entry, kind).filter((item) =>
    Boolean(item.text.trim()),
  );
  return filledSlots.length + filledExtras.length > 0;
}

/**
 * True when the section has at least one filled item and every filled
 * item (default slots + extras) is checked off.
 */
export function isSectionComplete(
  entry: DailyEntry,
  kind: DailyItemKind,
): boolean {
  const filledSlots = DEFAULT_SLOTS_BY_KIND[kind]
    .map((slot) => ({
      text: String(entry[slotTextColumn(slot)] ?? "").trim(),
      done: Boolean(entry[slotDoneColumn(slot)]),
    }))
    .filter((row) => row.text.length > 0);

  const filledExtras = extrasForKind(entry, kind).filter((item) =>
    Boolean(item.text.trim()),
  );

  if (filledSlots.length + filledExtras.length === 0) return false;

  return (
    filledSlots.every((row) => row.done) &&
    filledExtras.every((item) => item.done)
  );
}

/**
 * True when there is at least one habit and every habit is checked off.
 */
export function isHabitsComplete(habits: HabitWithCheckIn[]): boolean {
  return habits.length > 0 && habits.every((habit) => habit.done_today);
}

/**
 * True when every filled task section is checked off, and habits (if any)
 * are all done. Empty sections do not block. Needs at least one filled
 * task or habit on the sheet.
 */
export function isSheetComplete(
  entry: DailyEntry,
  habits: { count: number; complete: boolean },
): boolean {
  let hasWork = habits.count > 0;

  for (const kind of TASK_KINDS) {
    if (!isSectionFilled(entry, kind)) continue;
    hasWork = true;
    if (!isSectionComplete(entry, kind)) return false;
  }

  if (!hasWork) return false;
  if (habits.count > 0 && !habits.complete) return false;
  return true;
}
