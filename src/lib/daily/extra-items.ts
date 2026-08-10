import type {
  DailyEntry,
  DailyItemKind,
  ExtraDailyItem,
} from "@/lib/types/database";
import type { DailySlot } from "@/lib/types/database";

export type { DailyItemKind, ExtraDailyItem };

export const DEFAULT_SLOTS_BY_KIND: Record<DailyItemKind, DailySlot[]> = {
  must_do: ["must_do"],
  should_do: ["should_do_1", "should_do_2"],
  quick_win: ["quick_win_1", "quick_win_2", "quick_win_3"],
};

export const KIND_LABELS: Record<DailyItemKind, string> = {
  must_do: "Must-Do",
  should_do: "Should-Do",
  quick_win: "Quick Win",
};

const NOTES_EXTRAS_KEY = "purrsist_extra_items";
const NOTES_HABIT_CHECKS_KEY = "purrsist_habit_checks";

function isKind(value: unknown): value is DailyItemKind {
  return value === "must_do" || value === "should_do" || value === "quick_win";
}

export function parseExtraItems(value: unknown): ExtraDailyItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    if (typeof item.id !== "string" || !isKind(item.kind)) return [];
    return [
      {
        id: item.id,
        kind: item.kind,
        text: typeof item.text === "string" ? item.text : "",
        done: Boolean(item.done),
        carryover_count: Number(item.carryover_count ?? 0) || 0,
      },
    ];
  });
}

export function parseNotesObject(
  notes: string | null | undefined,
): Record<string, unknown> | null {
  if (!notes?.trim()) return null;
  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function extrasFromNotes(notes: string | null | undefined): ExtraDailyItem[] {
  const parsed = parseNotesObject(notes);
  if (!parsed) return [];
  return parseExtraItems(parsed[NOTES_EXTRAS_KEY]);
}

/** Read extras from dedicated column, or notes fallback when migration isn't applied. */
export function readExtraItems(
  entry: Pick<DailyEntry, "extra_items" | "notes">,
) {
  const fromColumn = parseExtraItems(entry.extra_items);
  if (fromColumn.length > 0) return fromColumn;
  return extrasFromNotes(entry.notes);
}

export function mergeNotesPayload(
  notes: string | null | undefined,
  patch: Record<string, unknown>,
): string {
  const parsed = parseNotesObject(notes);
  const base: Record<string, unknown> = parsed
    ? { ...parsed }
    : notes?.trim()
      ? { text: notes, [NOTES_EXTRAS_KEY]: [], [NOTES_HABIT_CHECKS_KEY]: {} }
      : {
          text: null,
          [NOTES_EXTRAS_KEY]: [],
          [NOTES_HABIT_CHECKS_KEY]: {},
        };

  return JSON.stringify({ ...base, ...patch });
}

export function notesPayloadWithExtras(
  notes: string | null | undefined,
  extras: ExtraDailyItem[],
): string {
  const parsed = parseNotesObject(notes);
  let text: string | null = null;

  if (
    parsed &&
    (NOTES_EXTRAS_KEY in parsed || NOTES_HABIT_CHECKS_KEY in parsed)
  ) {
    text = typeof parsed.text === "string" ? parsed.text : null;
  } else if (notes?.trim()) {
    text = notes;
  }

  return mergeNotesPayload(notes, {
    text,
    [NOTES_EXTRAS_KEY]: extras,
  });
}

export function normalizeDailyEntry(entry: DailyEntry): DailyEntry {
  return {
    ...entry,
    extra_items: readExtraItems(entry),
  };
}

export function extrasForKind(
  entry: DailyEntry,
  kind: DailyItemKind,
): ExtraDailyItem[] {
  return readExtraItems(entry).filter((item) => item.kind === kind);
}

export function newExtraItem(kind: DailyItemKind): ExtraDailyItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `extra-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    kind,
    text: "",
    done: false,
    carryover_count: 0,
  };
}

export function withExtraItems(
  entry: DailyEntry,
  extras: ExtraDailyItem[],
): DailyEntry {
  return { ...entry, extra_items: extras };
}

export function isMissingExtraItemsColumn(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /Could not find the ['"]?extra_items['"]? column/i.test(error.message ?? "") ||
    (/extra_items/i.test(error.message ?? "") &&
      /schema cache|does not exist/i.test(error.message ?? ""))
  );
}
