/**
 * Story fixtures — realistic rows shaped like the Supabase tables so components
 * render exactly as they would with server data.
 */
import { dateKeyFromDate } from "@/lib/daily/entry-rules";
import type {
  BacklogItem,
  DailyEntry,
  ExtraDailyItem,
  Habit,
  HabitWithCheckIn,
} from "@/lib/types/database";

export const USER_ID = "user-story";

export function todayKey(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return dateKeyFromDate(d);
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function makeEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return {
    id: "entry-today",
    user_id: USER_ID,
    date: todayKey(),
    must_do_text: null,
    must_do_done: false,
    must_do_carryover_count: 0,
    should_do_1_text: null,
    should_do_1_done: false,
    should_do_1_carryover_count: 0,
    should_do_2_text: null,
    should_do_2_done: false,
    should_do_2_carryover_count: 0,
    quick_win_1_text: null,
    quick_win_1_done: false,
    quick_win_1_carryover_count: 0,
    quick_win_2_text: null,
    quick_win_2_done: false,
    quick_win_2_carryover_count: 0,
    quick_win_3_text: null,
    quick_win_3_done: false,
    quick_win_3_carryover_count: 0,
    extra_items: [],
    daily_reminder: null,
    locked: false,
    morning_digest_sent: false,
    carryover_swept: true,
    notes: null,
    created_at: isoDaysAgo(0),
    ...overrides,
  };
}

export const EMPTY_ENTRY = makeEntry();

export const IN_PROGRESS_ENTRY = makeEntry({
  must_do_text: "Send the quarterly report to Dana",
  should_do_1_text: "Book the vet appointment for Mochi",
  should_do_1_done: true,
  should_do_2_text: "Draft the onboarding email sequence",
  should_do_2_carryover_count: 2,
  quick_win_1_text: "Water the plants",
  quick_win_1_done: true,
  quick_win_2_text: "Reply to Sam about Saturday",
  notes: JSON.stringify({
    purrsist_reminders: [{ id: "r1", text: "Trash goes out tonight" }],
  }),
});

export const ALL_DONE_ENTRY = makeEntry({
  must_do_text: "Send the quarterly report to Dana",
  must_do_done: true,
  should_do_1_text: "Book the vet appointment for Mochi",
  should_do_1_done: true,
  should_do_2_text: "Draft the onboarding email sequence",
  should_do_2_done: true,
  quick_win_1_text: "Water the plants",
  quick_win_1_done: true,
  quick_win_2_text: "Reply to Sam about Saturday",
  quick_win_2_done: true,
  quick_win_3_text: "Order more cat litter",
  quick_win_3_done: true,
});

const OVERFLOW_EXTRAS: ExtraDailyItem[] = [
  {
    id: "extra-1",
    kind: "quick_win",
    text: "Return the library books",
    done: false,
    carryover_count: 0,
  },
  {
    id: "extra-2",
    kind: "should_do",
    text: "Clean out the garage shelves before the weekend so there's room for the bikes",
    done: false,
    carryover_count: 1,
  },
];

export const OVERFLOW_ENTRY = makeEntry({
  ...IN_PROGRESS_ENTRY,
  quick_win_3_text: "Order more cat litter",
  extra_items: OVERFLOW_EXTRAS,
});

/** One task past the 5-day carryover threshold — triggers the stagnant nudge. */
export const STAGNANT_ENTRY = makeEntry({
  ...IN_PROGRESS_ENTRY,
  should_do_2_carryover_count: 5,
  quick_win_2_carryover_count: 6,
});

export const PAST_ENTRY = makeEntry({
  ...IN_PROGRESS_ENTRY,
  id: "entry-past",
  date: todayKey(-3),
  locked: true,
});

export function makeHabit(
  id: string,
  name: string,
  daysAgo: number,
  overrides: Partial<Habit> = {},
): Habit {
  return {
    id,
    user_id: USER_ID,
    name,
    active: true,
    created_at: isoDaysAgo(daysAgo),
    archived_at: null,
    ...overrides,
  };
}

export const HABITS: Habit[] = [
  makeHabit("h1", "Drink 8 glasses of water", 42),
  makeHabit("h2", "Stretch for 10 minutes", 12),
  makeHabit("h3", "Read before bed", 0),
];

export const ARCHIVED_HABITS: Habit[] = [
  makeHabit("h4", "Journal every morning", 90, {
    active: false,
    archived_at: isoDaysAgo(20),
  }),
];

export const HABITS_WITH_CHECKINS: HabitWithCheckIn[] = [
  { ...HABITS[0], done_today: true },
  { ...HABITS[1], done_today: false },
  { ...HABITS[2], done_today: false },
];

export function makeBacklogItem(
  id: string,
  text: string,
  overrides: Partial<BacklogItem> = {},
): BacklogItem {
  return {
    id,
    user_id: USER_ID,
    text,
    normalized_text: text.toLowerCase(),
    significance: null,
    tag: "task",
    ai_placement: null,
    target_date: null,
    status: "active",
    created_at: isoDaysAgo(3),
    last_touched_at: isoDaysAgo(1),
    promoted_to_entry_id: null,
    promoted_to_slot: null,
    ...overrides,
  };
}

export const BACKLOG_ITEMS: BacklogItem[] = [
  makeBacklogItem("b1", "Renew passport", {
    significance: "red",
    ai_placement: "must_do",
  }),
  makeBacklogItem("b2", "Pick up dry cleaning", {
    tag: "errand",
    significance: "green",
    ai_placement: "quick_win_1",
  }),
  makeBacklogItem("b3", "Call grandma on her birthday", {
    tag: "reminder",
    target_date: todayKey(4),
  }),
  makeBacklogItem("b4", "Oat milk, coffee beans, cat treats", {
    tag: "shopping",
    significance: "yellow",
  }),
  makeBacklogItem("b5", "Look into a standing desk", {
    tag: "uncategorized",
    created_at: isoDaysAgo(30),
  }),
];

export const ARCHIVED_BACKLOG_ITEMS: BacklogItem[] = [
  makeBacklogItem("b6", "Cancel the gym trial", {
    status: "archived",
    last_touched_at: isoDaysAgo(8),
  }),
  makeBacklogItem("b7", "Research paint colors for the hallway", {
    status: "archived",
    tag: "uncategorized",
    last_touched_at: isoDaysAgo(15),
  }),
];
