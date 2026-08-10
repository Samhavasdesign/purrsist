import type { DailyItemKind } from "@/lib/daily/extra-items";
import type { DailyEntry, DailySlot, Significance } from "@/lib/types/database";
import { slotTextColumn } from "@/lib/types/database";
import { extrasForKind } from "@/lib/daily/extra-items";

/** Big deal → Must-Do, Matters → Should-Do, Eventually → Quick Win */
export function kindForSignificance(significance: Significance): DailyItemKind {
  switch (significance) {
    case "red":
      return "must_do";
    case "yellow":
      return "should_do";
    case "green":
      return "quick_win";
  }
}

export function defaultSlotsForSignificance(
  significance: Significance,
): DailySlot[] {
  switch (significance) {
    case "red":
      return ["must_do"];
    case "yellow":
      return ["should_do_1", "should_do_2"];
    case "green":
      return ["quick_win_1", "quick_win_2", "quick_win_3"];
  }
}

export function categoryLabelForSignificance(
  significance: Significance,
): string {
  switch (significance) {
    case "red":
      return "Must-Do";
    case "yellow":
      return "Should-Do";
    case "green":
      return "Quick Win";
  }
}

/** First empty default slot in the significance group, or null if all filled. */
export function findOpenSlotForSignificance(
  entry: DailyEntry,
  significance: Significance,
): DailySlot | null {
  for (const slot of defaultSlotsForSignificance(significance)) {
    if (!String(entry[slotTextColumn(slot)] ?? "").trim()) {
      return slot;
    }
  }
  return null;
}

export function significanceGroupIsFull(
  entry: DailyEntry,
  significance: Significance,
): boolean {
  return findOpenSlotForSignificance(entry, significance) === null;
}

/** Open default slots only within the significance-mapped group. */
export function openSlotsForSignificance(
  entry: DailyEntry,
  significance: Significance,
): DailySlot[] {
  return defaultSlotsForSignificance(significance).filter(
    (slot) => !String(entry[slotTextColumn(slot)] ?? "").trim(),
  );
}

export function countItemsInSignificanceGroup(
  entry: DailyEntry,
  significance: Significance,
): number {
  const kind = kindForSignificance(significance);
  const defaults = defaultSlotsForSignificance(significance).filter((slot) =>
    Boolean(String(entry[slotTextColumn(slot)] ?? "").trim()),
  ).length;
  return defaults + extrasForKind(entry, kind).filter((i) => i.text.trim()).length;
}
