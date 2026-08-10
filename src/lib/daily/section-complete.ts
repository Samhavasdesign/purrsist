import {
  DEFAULT_SLOTS_BY_KIND,
  extrasForKind,
  type DailyItemKind,
} from "@/lib/daily/extra-items";
import type { DailyEntry } from "@/lib/types/database";
import { slotDoneColumn, slotTextColumn } from "@/lib/types/database";

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
