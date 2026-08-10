import type { DailyEntry, DailyItemKind, DailySlot } from "@/lib/types/database";
import { slotTextColumn } from "@/lib/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SectionHintFlags = {
  hasFilledMustDoOnce: boolean;
  hasFilledShouldDosOnce: boolean;
  hasFilledQuickWinsOnce: boolean;
};

export const DEFAULT_SECTION_HINT_FLAGS: SectionHintFlags = {
  hasFilledMustDoOnce: false,
  hasFilledShouldDosOnce: false,
  hasFilledQuickWinsOnce: false,
};

const SECTION_SLOTS: Record<DailyItemKind, DailySlot[]> = {
  must_do: ["must_do"],
  should_do: ["should_do_1", "should_do_2"],
  quick_win: ["quick_win_1", "quick_win_2", "quick_win_3"],
};

const FLAG_COLUMN: Record<
  DailyItemKind,
  keyof SectionHintFlags
> = {
  must_do: "hasFilledMustDoOnce",
  should_do: "hasFilledShouldDosOnce",
  quick_win: "hasFilledQuickWinsOnce",
};

const DB_COLUMN: Record<DailyItemKind, string> = {
  must_do: "has_filled_must_do_once",
  should_do: "has_filled_should_dos_once",
  quick_win: "has_filled_quick_wins_once",
};

export function kindForSlot(slot: DailySlot): DailyItemKind {
  if (slot === "must_do") return "must_do";
  if (slot === "should_do_1" || slot === "should_do_2") return "should_do";
  return "quick_win";
}

export function sectionAtDefaultCapacity(
  entry: DailyEntry,
  kind: DailyItemKind,
): boolean {
  return SECTION_SLOTS[kind].every((slot) =>
    Boolean(String(entry[slotTextColumn(slot)] ?? "").trim()),
  );
}

export function parseSectionHintFlags(row: {
  has_filled_must_do_once?: boolean | null;
  has_filled_should_dos_once?: boolean | null;
  has_filled_quick_wins_once?: boolean | null;
} | null): SectionHintFlags {
  if (!row) return { ...DEFAULT_SECTION_HINT_FLAGS };
  return {
    hasFilledMustDoOnce: Boolean(row.has_filled_must_do_once),
    hasFilledShouldDosOnce: Boolean(row.has_filled_should_dos_once),
    hasFilledQuickWinsOnce: Boolean(row.has_filled_quick_wins_once),
  };
}

const FLAG_SELECT =
  "has_filled_must_do_once, has_filled_should_dos_once, has_filled_quick_wins_once";

function isMissingHintColumns(error: { message?: string; code?: string } | null) {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("has_filled_must_do_once") ||
    msg.includes("has_filled_should_dos_once") ||
    msg.includes("has_filled_quick_wins_once") ||
    msg.includes("schema cache")
  );
}

/**
 * When a default slot is filled, if that section is now at full default
 * capacity for the first time, persist the corresponding profile flag.
 */
export async function markSectionFilledOnceIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  entry: DailyEntry,
  filledSlot: DailySlot,
): Promise<SectionHintFlags | null> {
  const kind = kindForSlot(filledSlot);
  if (!sectionAtDefaultCapacity(entry, kind)) return null;

  const dbCol = DB_COLUMN[kind];

  // Only write when still false (idempotent; no-op once true).
  const { data, error } = await supabase
    .from("profiles")
    .update({ [dbCol]: true })
    .eq("id", userId)
    .eq(dbCol, false)
    .select(FLAG_SELECT)
    .maybeSingle();

  if (isMissingHintColumns(error)) return null;

  if (!error && data) return parseSectionHintFlags(data);

  if (!error && !data) {
    // Flag already true, or profile row missing.
    const { data: current, error: readError } = await supabase
      .from("profiles")
      .select(FLAG_SELECT)
      .eq("id", userId)
      .maybeSingle();
    if (isMissingHintColumns(readError)) return null;
    if (current) return parseSectionHintFlags(current);
  }

  const { data: upserted, error: upsertError } = await supabase
    .from("profiles")
    .upsert({ id: userId, [dbCol]: true })
    .select(FLAG_SELECT)
    .maybeSingle();

  if (isMissingHintColumns(upsertError) || upsertError) return null;
  return parseSectionHintFlags(upserted);
}

export function hintVisibleForKind(
  flags: SectionHintFlags,
  kind: DailyItemKind,
): boolean {
  return !flags[FLAG_COLUMN[kind]];
}
