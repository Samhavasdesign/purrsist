/** User profile row (PRD User) — persistent prefs, not reset daily. */
export type Profile = {
  id: string;
  last_capture_at: string | null;
  created_at: string;
  has_filled_must_do_once: boolean;
  has_filled_should_dos_once: boolean;
  has_filled_quick_wins_once: boolean;
};

export type Significance = "red" | "yellow" | "green";

export type BacklogTag =
  | "task"
  | "errand"
  | "reminder"
  | "shopping"
  | "uncategorized";

export type BacklogStatus = "active" | "done" | "archived";

export type DailySlot =
  | "must_do"
  | "should_do_1"
  | "should_do_2"
  | "quick_win_1"
  | "quick_win_2"
  | "quick_win_3";

export type BacklogItem = {
  id: string;
  user_id: string;
  text: string;
  normalized_text: string;
  /** Null until chosen at promote-to-today (or set at color-tap capture). */
  significance: Significance | null;
  tag: BacklogTag;
  ai_placement: DailySlot | null;
  target_date: string | null;
  status: BacklogStatus;
  created_at: string;
  last_touched_at: string;
  promoted_to_entry_id: string | null;
  promoted_to_slot: DailySlot | null;
};

export type DailyItemKind = "must_do" | "should_do" | "quick_win";

/** Singular display labels — selecting a category or describing one task. */
export const KIND_LABELS: Record<DailyItemKind, string> = {
  must_do: "Must-Do",
  should_do: "Should-Do",
  quick_win: "Quick Win",
};

/** Plural display labels — section headings that contain multiple tasks. */
export const KIND_LABELS_PLURAL: Record<DailyItemKind, string> = {
  must_do: "Must-Dos",
  should_do: "Should-Dos",
  quick_win: "Quick Wins",
};

export type ExtraDailyItem = {
  id: string;
  kind: DailyItemKind;
  text: string;
  done: boolean;
  carryover_count: number;
};

export type DailyEntry = {
  id: string;
  user_id: string;
  date: string;
  must_do_text: string | null;
  must_do_done: boolean;
  must_do_carryover_count: number;
  should_do_1_text: string | null;
  should_do_1_done: boolean;
  should_do_1_carryover_count: number;
  should_do_2_text: string | null;
  should_do_2_done: boolean;
  should_do_2_carryover_count: number;
  quick_win_1_text: string | null;
  quick_win_1_done: boolean;
  quick_win_1_carryover_count: number;
  quick_win_2_text: string | null;
  quick_win_2_done: boolean;
  quick_win_2_carryover_count: number;
  quick_win_3_text: string | null;
  quick_win_3_done: boolean;
  quick_win_3_carryover_count: number;
  /** Overflow beyond default 1/2/3 slots. */
  extra_items: ExtraDailyItem[];
  daily_reminder: string | null;
  locked: boolean;
  morning_digest_sent: boolean;
  /** Set once this day's unresolved tasks have been pulled forward by carryover. */
  carryover_swept: boolean;
  notes: string | null;
  created_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  active: boolean;
  created_at: string;
  archived_at: string | null;
};

export type HabitCheckIn = {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  done: boolean;
};

export type HabitWithCheckIn = Habit & {
  done_today: boolean;
};

/** Fixed pre-made cat in the rescue catalog (PRD §10 Cat). */
export type Cat = {
  id: string;
  sequence_order: number;
  name: string;
  image_key: string;
};

/** Append-only weekly rescue record (PRD §10 CatRescued). */
export type CatRescued = {
  id: string;
  user_id: string;
  cat_id: string;
  week_start_date: string;
  /** Set the first time the Today rescue toast is shown — never shown twice. */
  banner_shown_at: string | null;
  created_at: string;
};

export type CatRescuedWithCat = CatRescued & {
  cat: Cat;
};

export const DAILY_SLOTS: { slot: DailySlot; label: string; group: string }[] = [
  { slot: "must_do", label: "Must-Do", group: "Must-Dos" },
  { slot: "should_do_1", label: "Should-Do 1", group: "Should-Dos" },
  { slot: "should_do_2", label: "Should-Do 2", group: "Should-Dos" },
  { slot: "quick_win_1", label: "Quick Win 1", group: "Quick Wins" },
  { slot: "quick_win_2", label: "Quick Win 2", group: "Quick Wins" },
  { slot: "quick_win_3", label: "Quick Win 3", group: "Quick Wins" },
];

export const BACKLOG_TAGS: { tag: BacklogTag; label: string }[] = [
  { tag: "task", label: "Task" },
  { tag: "errand", label: "Errand" },
  { tag: "reminder", label: "Reminder" },
  { tag: "shopping", label: "Shopping" },
  { tag: "uncategorized", label: "Uncategorized" },
];

export function slotTextColumn(slot: DailySlot): keyof DailyEntry {
  switch (slot) {
    case "must_do":
      return "must_do_text";
    case "should_do_1":
      return "should_do_1_text";
    case "should_do_2":
      return "should_do_2_text";
    case "quick_win_1":
      return "quick_win_1_text";
    case "quick_win_2":
      return "quick_win_2_text";
    case "quick_win_3":
      return "quick_win_3_text";
  }
}

export function slotDoneColumn(slot: DailySlot): keyof DailyEntry {
  return slotTextColumn(slot).replace("_text", "_done") as keyof DailyEntry;
}

export function slotCarryoverColumn(slot: DailySlot): keyof DailyEntry {
  return slotTextColumn(slot).replace(
    "_text",
    "_carryover_count",
  ) as keyof DailyEntry;
}

export function isDayWin(entry: DailyEntry): boolean {
  const primaryText = String(entry.must_do_text ?? "").trim();
  const extras = parseExtraItemsSafe(entry.extra_items);
  const extraMusts = extras.filter(
    (row) => row.kind === "must_do" && String(row.text ?? "").trim(),
  );

  if (!primaryText && extraMusts.length === 0) return false;

  const primaryOk = !primaryText || Boolean(entry.must_do_done);
  const extrasOk = extraMusts.every((row) => Boolean(row.done));
  return primaryOk && extrasOk;
}

function parseExtraItemsSafe(value: unknown): ExtraDailyItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Partial<ExtraDailyItem>;
    if (
      typeof item.id !== "string" ||
      (item.kind !== "must_do" &&
        item.kind !== "should_do" &&
        item.kind !== "quick_win")
    ) {
      return [];
    }
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

export type UncheckedSlot = {
  slot: DailySlot;
  label: string;
  text: string;
  carryover_count: number;
};

export type UncheckedItem =
  | (UncheckedSlot & { source: "slot" })
  | {
      source: "extra";
      id: string;
      kind: "must_do" | "should_do" | "quick_win";
      label: string;
      text: string;
      carryover_count: number;
    };

export function listUncheckedFilledSlots(entry: DailyEntry): UncheckedSlot[] {
  return DAILY_SLOTS.flatMap(({ slot, label }) => {
    const text = String(entry[slotTextColumn(slot)] ?? "").trim();
    const done = Boolean(entry[slotDoneColumn(slot)]);
    if (!text || done) return [];
    return [
      {
        slot,
        label,
        text,
        carryover_count: Number(entry[slotCarryoverColumn(slot)] ?? 0),
      },
    ];
  });
}

export function listUncheckedFilledItems(entry: DailyEntry): UncheckedItem[] {
  const fromSlots: UncheckedItem[] = listUncheckedFilledSlots(entry).map(
    (item) => ({ ...item, source: "slot" as const }),
  );

  const extras = parseExtraItemsSafe(entry.extra_items);
  const fromExtras: UncheckedItem[] = extras.flatMap((item) => {
    const text = item.text.trim();
    if (!text || item.done) return [];
    const label = KIND_LABELS[item.kind];
    return [
      {
        source: "extra" as const,
        id: item.id,
        kind: item.kind,
        label,
        text,
        carryover_count: item.carryover_count,
      },
    ];
  });

  return [...fromSlots, ...fromExtras];
}

/**
 * How many times an unchecked task may carry forward before the dashboard
 * stops letting it sit quietly and prompts to move it to the backlog.
 * The task is entered at count 0, so count >= 5 means it has been carried
 * five separate days without being checked off.
 */
export const STAGNANT_CARRYOVER_COUNT = 5;

/**
 * Unchecked, still-filled tasks (slots or extras) that have carried forward
 * at least STAGNANT_CARRYOVER_COUNT times — the ones the 5-day prompt asks
 * the user to backlog or archive.
 */
export function listStagnantItems(entry: DailyEntry): UncheckedItem[] {
  return listUncheckedFilledItems(entry).filter(
    (item) => item.carryover_count >= STAGNANT_CARRYOVER_COUNT,
  );
}
