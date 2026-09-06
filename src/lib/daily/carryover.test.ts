import { describe, expect, it } from "vitest";
import type { DailyEntry, ExtraDailyItem } from "@/lib/types/database";
import { planCarryover, shiftDateKey } from "@/lib/daily/carryover";

function entry(over: Partial<DailyEntry> = {}): DailyEntry {
  return {
    id: "entry",
    user_id: "user-1",
    date: "2026-09-06",
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
    carryover_swept: false,
    notes: null,
    created_at: "2026-09-06T00:00:00.000Z",
    ...over,
  };
}

function extra(over: Partial<ExtraDailyItem> = {}): ExtraDailyItem {
  return {
    id: `x-${Math.random().toString(16).slice(2)}`,
    kind: "quick_win",
    text: "",
    done: false,
    carryover_count: 0,
    ...over,
  };
}

describe("shiftDateKey", () => {
  it("walks backwards across a month boundary", () => {
    expect(shiftDateKey("2026-09-06", -14)).toBe("2026-08-23");
    expect(shiftDateKey("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("planCarryover", () => {
  it("does nothing when there are no past days", () => {
    expect(planCarryover(entry(), [])).toEqual({
      slotUpdate: {},
      extras: null,
      changed: false,
    });
  });

  it("drops an unchecked slot task into the matching empty slot and bumps the count", () => {
    const yesterday = entry({
      date: "2026-09-05",
      must_do_text: "file taxes",
      must_do_carryover_count: 2,
    });
    const plan = planCarryover(entry(), [yesterday]);
    expect(plan.slotUpdate).toEqual({
      must_do_text: "file taxes",
      must_do_done: false,
      must_do_carryover_count: 3,
    });
    expect(plan.extras).toBeNull();
    expect(plan.changed).toBe(true);
  });

  it("rides along as an extra of the same kind when the matching slot is taken", () => {
    const today = entry({ must_do_text: "today's big thing" });
    const yesterday = entry({
      date: "2026-09-05",
      must_do_text: "yesterday's big thing",
      must_do_carryover_count: 1,
    });
    const plan = planCarryover(today, [yesterday]);
    expect(plan.slotUpdate).toEqual({});
    expect(plan.extras).toHaveLength(1);
    expect(plan.extras?.[0]).toMatchObject({
      kind: "must_do",
      text: "yesterday's big thing",
      done: false,
      carryover_count: 2,
    });
  });

  it("skips checked-off and empty tasks", () => {
    const yesterday = entry({
      date: "2026-09-05",
      must_do_text: "done already",
      must_do_done: true,
      should_do_1_text: "   ",
    });
    expect(planCarryover(entry(), [yesterday]).changed).toBe(false);
  });

  it("de-dupes by task text against what today already holds (case / space insensitive)", () => {
    const today = entry({ should_do_1_text: "Call The Dentist" });
    const yesterday = entry({
      date: "2026-09-05",
      should_do_1_text: "  call the dentist  ",
    });
    expect(planCarryover(today, [yesterday]).changed).toBe(false);
  });

  it("de-dupes the same task appearing on several past days — carries it once", () => {
    const older = entry({
      date: "2026-09-03",
      quick_win_1_text: "water plants",
      quick_win_1_carryover_count: 4,
    });
    const newer = entry({
      date: "2026-09-05",
      quick_win_1_text: "water plants",
      quick_win_1_carryover_count: 1,
    });
    const plan = planCarryover(entry(), [older, newer]);
    // Oldest-first: the long-waiting copy wins the slot, count preserved.
    expect(plan.slotUpdate).toEqual({
      quick_win_1_text: "water plants",
      quick_win_1_done: false,
      quick_win_1_carryover_count: 5,
    });
  });

  it("carries unchecked extras forward as fresh extras and appends after today's", () => {
    const today = entry({
      extra_items: [extra({ id: "keep", text: "today extra", kind: "should_do" })],
    });
    const yesterday = entry({
      date: "2026-09-05",
      extra_items: [
        extra({ id: "old", text: "old extra", kind: "should_do", carryover_count: 2 }),
        extra({ id: "olddone", text: "old done", done: true }),
      ],
    });
    const plan = planCarryover(today, [yesterday]);
    expect(plan.extras?.map((e) => e.text)).toEqual(["today extra", "old extra"]);
    expect(plan.extras?.[1]).toMatchObject({ carryover_count: 3, done: false });
    // A brand-new id, not the source row's.
    expect(plan.extras?.[1].id).not.toBe("old");
  });

  it("fills each named slot once; a second day's same-named task overflows to an extra", () => {
    const d1 = entry({ date: "2026-09-04", quick_win_1_text: "a", quick_win_2_text: "b" });
    const d2 = entry({ date: "2026-09-05", quick_win_1_text: "c", quick_win_3_text: "d" });
    const plan = planCarryover(entry(), [d1, d2]);
    // Oldest day claims quick_win_1 / quick_win_2; d2's quick_win_3 is still free.
    expect(plan.slotUpdate).toMatchObject({
      quick_win_1_text: "a",
      quick_win_2_text: "b",
      quick_win_3_text: "d",
    });
    // d2's quick_win_1 ("c") collided with an already-claimed slot -> extra.
    expect(plan.extras?.map((e) => e.text)).toEqual(["c"]);
    expect(plan.extras?.[0].kind).toBe("quick_win");
  });
});
