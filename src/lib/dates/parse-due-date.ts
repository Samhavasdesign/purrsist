/**
 * Reads a due date out of a captured note ("call mom sunday" → that Sunday).
 * Pure and timezone-free: everything is relative to the caller's local
 * YYYY-MM-DD, so it runs the same in the browser and on the server.
 */

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  tues: 2,
  wednesday: 3,
  weds: 3,
  thursday: 4,
  thurs: 4,
  friday: 5,
  saturday: 6,
};

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const WEEKDAY_RE = new RegExp(
  `\\b(next\\s+|this\\s+|on\\s+)?(${Object.keys(WEEKDAYS).join("|")})s?\\b`,
  "i",
);
const MONTH_NAMES = Object.keys(MONTHS).join("|");
const MONTH_DAY_RE = new RegExp(
  `\\b(${MONTH_NAMES})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`,
  "i",
);
const DAY_MONTH_RE = new RegExp(
  `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_NAMES})\\b`,
  "i",
);
const IN_N_RE = /\bin\s+(\d{1,2}|a|one|two|three)\s+(day|week)s?\b/i;

const SMALL_NUMBERS: Record<string, number> = { a: 1, one: 1, two: 2, three: 3 };

/** Local calendar day as YYYY-MM-DD. */
export function localTodayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isDateKey(value: unknown): value is string {
  return typeof value === "string" && DATE_KEY.test(value);
}

function toUtc(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(key: string, days: number): string {
  const date = toUtc(key);
  date.setUTCDate(date.getUTCDate() + days);
  return toKey(date);
}

/** Days from `todayKey` to the next `weekday`; 0 when it's today. */
function daysUntil(todayKey: string, weekday: number): number {
  return (weekday - toUtc(todayKey).getUTCDay() + 7) % 7;
}

/** Month/day this year, or next year if it has already passed. */
function nextMonthDay(todayKey: string, month: number, day: number): string | null {
  if (day < 1 || day > 31) return null;
  const year = Number(todayKey.slice(0, 4));
  for (const y of [year, year + 1]) {
    const date = new Date(Date.UTC(y, month - 1, day));
    // Rejects Feb 30 and friends, which Date would roll into March.
    if (date.getUTCMonth() !== month - 1) return null;
    const key = toKey(date);
    if (key >= todayKey) return key;
  }
  return null;
}

/**
 * The date a note names, or null when it names none (or names one this
 * doesn't understand — see `mightMentionDate` for the AI fallback).
 */
export function parseDueDate(text: string, todayKey: string): string | null {
  const t = text.toLowerCase();

  if (/\b(today|tonight|this (morning|afternoon|evening))\b/.test(t)) {
    return todayKey;
  }
  if (/\b(tomorrow|tmrw|tmr)\b/.test(t)) return addDays(todayKey, 1);
  if (/\bthis weekend\b/.test(t)) {
    return addDays(todayKey, daysUntil(todayKey, 6));
  }
  if (/\bnext week\b/.test(t)) {
    // The Monday after this one (or after today, if today is Monday).
    return addDays(todayKey, daysUntil(todayKey, 1) || 7);
  }

  const inN = t.match(IN_N_RE);
  if (inN) {
    const n = SMALL_NUMBERS[inN[1]] ?? Number(inN[1]);
    return addDays(todayKey, inN[2] === "week" ? n * 7 : n);
  }

  const monthDay = t.match(MONTH_DAY_RE);
  if (monthDay) {
    return nextMonthDay(todayKey, MONTHS[monthDay[1]], Number(monthDay[2]));
  }
  const dayMonth = t.match(DAY_MONTH_RE);
  if (dayMonth) {
    return nextMonthDay(todayKey, MONTHS[dayMonth[2]], Number(dayMonth[1]));
  }

  const weekday = t.match(WEEKDAY_RE);
  if (weekday) {
    const days = daysUntil(todayKey, WEEKDAYS[weekday[2]]);
    // "next sunday" on a Sunday means a week out; plain "sunday" means today.
    const isNext = weekday[1]?.trim() === "next";
    return addDays(todayKey, days === 0 && isNext ? 7 : days);
  }

  return null;
}

/**
 * Loose check for date-ish wording `parseDueDate` may have missed ("end of
 * the month", "before the 15th", "christmas"), so only those notes go to the
 * AI and plain ones save instantly.
 */
export function mightMentionDate(text: string): boolean {
  return /\b(week|weekend|month|year|end of|eod|eow|eom|before|after|until|by the|on the|\d{1,2}(st|nd|rd|th)|\d{1,2}\/\d{1,2}|christmas|xmas|thanksgiving|easter|new year|birthday|anniversary|holiday|noon|midnight|morning|evening|afternoon)\b/i.test(
    text,
  );
}
