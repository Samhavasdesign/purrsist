import { describe, expect, it } from "vitest";
import { mightMentionDate, parseDueDate } from "@/lib/dates/parse-due-date";

// Thursday.
const TODAY = "2026-10-01";

describe("parseDueDate", () => {
  it.each([
    ["call mom sunday", "2026-10-04"],
    ["Call Mom Sunday", "2026-10-04"],
    ["call mom on Sunday", "2026-10-04"],
    ["dentist next tuesday", "2026-10-06"],
    ["pay rent thursday", TODAY],
    ["review next thursday", "2026-10-08"],
    ["water plants today", TODAY],
    ["take bins out tonight", TODAY],
    ["email Sam tomorrow", "2026-10-02"],
    ["clean garage this weekend", "2026-10-03"],
    ["book flights next week", "2026-10-05"],
    ["follow up in 3 days", "2026-10-04"],
    ["follow up in a week", "2026-10-08"],
    ["renew passport oct 12", "2026-10-12"],
    ["renew passport October 12th", "2026-10-12"],
    ["party 3rd of november", "2026-11-03"],
    ["dentist sept 3", "2027-09-03"],
  ])("%s → %s", (text, expected) => {
    expect(parseDueDate(text, TODAY)).toBe(expected);
  });

  it.each([
    "buy sun cream",
    "buy cat food",
    "may want to call the bank",
    "renew passport feb 30",
    "monitor setup",
  ])("finds no date in %s", (text) => {
    expect(parseDueDate(text, TODAY)).toBeNull();
  });
});

describe("mightMentionDate", () => {
  it("flags wording the parser leaves to the AI", () => {
    expect(mightMentionDate("finish taxes by end of month")).toBe(true);
    expect(mightMentionDate("pay invoice before the 15th")).toBe(true);
    expect(mightMentionDate("buy cat food")).toBe(false);
  });
});
