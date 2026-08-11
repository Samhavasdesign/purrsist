import type { DailyEntry } from "@/lib/types/database";

export function dateKeyFromDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatArchiveDate(dateKeyStr: string): string {
  const [y, m, d] = dateKeyStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Compact date for chrome tags — e.g. "Aug 10, 2026". */
export function formatShortDate(dateKeyStr: string): string {
  const [y, m, d] = dateKeyStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Same-day-only editing (PRD §6 / §8). */
export function isEditableEntry(entry: DailyEntry, now = new Date()): boolean {
  return entry.date === dateKeyFromDate(now) && !entry.locked;
}
