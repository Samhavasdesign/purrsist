import { describe, expect, it } from "vitest";
import type { DailyEntry, ExtraDailyItem } from "@/lib/types/database";
import {
  STAGNANT_CARRYOVER_COUNT,
  listStagnantItems,
} from "@/lib/types/database";

function entry(over: Partial<DailyEntry> = {}): DailyEntry {
  return {
    id: "entry-1",
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
    id: "extra-1",
    kind: "should_do",
    text: "",
    done: false,
    carryover_count: 0,
    ...over,
  };
}

describe("listStagnantItems", () => {
  it("returns nothing when no task has reached the threshold", () => {
    expect(
      listStagnantItems(
        entry({
          must_do_text: "taxes",
          must_do_carryover_count: STAGNANT_CARRYOVER_COUNT - 1,
        }),
      ),
    ).toEqual([]);
  });

  it("flags a slot task once it has carried the threshold number of times", () => {
    const result = listStagnantItems(
      entry({
        must_do_text: "taxes",
        must_do_carryover_count: STAGNANT_CARRYOVER_COUNT,
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      source: "slot",
      slot: "must_do",
      text: "taxes",
      carryover_count: STAGNANT_CARRYOVER_COUNT,
    });
  });

  it("flags stagnant extras too", () => {
    const result = listStagnantItems(
      entry({
        extra_items: [
          extra({
            id: "x1",
            text: "call plumber",
            carryover_count: STAGNANT_CARRYOVER_COUNT + 3,
          }),
        ],
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      source: "extra",
      id: "x1",
      text: "call plumber",
      carryover_count: STAGNANT_CARRYOVER_COUNT + 3,
    });
  });

  it("ignores tasks that are checked off or empty, however old", () => {
    const result = listStagnantItems(
      entry({
        must_do_text: "done thing",
        must_do_done: true,
        must_do_carryover_count: STAGNANT_CARRYOVER_COUNT + 10,
        should_do_1_text: "   ",
        should_do_1_carryover_count: STAGNANT_CARRYOVER_COUNT + 10,
        extra_items: [
          extra({
            id: "x-done",
            text: "also done",
            done: true,
            carryover_count: STAGNANT_CARRYOVER_COUNT,
          }),
        ],
      }),
    );
    expect(result).toEqual([]);
  });

  it("returns every stagnant task when several pile up", () => {
    const result = listStagnantItems(
      entry({
        must_do_text: "taxes",
        must_do_carryover_count: STAGNANT_CARRYOVER_COUNT,
        quick_win_2_text: "water plants",
        quick_win_2_carryover_count: STAGNANT_CARRYOVER_COUNT + 1,
        extra_items: [
          extra({ id: "x1", text: "old extra", carryover_count: 99 }),
          extra({ id: "x2", text: "fresh extra", carryover_count: 1 }),
        ],
      }),
    );
    expect(result.map((item) => item.text).sort()).toEqual([
      "old extra",
      "taxes",
      "water plants",
    ]);
  });
});
