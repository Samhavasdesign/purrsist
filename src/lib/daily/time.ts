/** Client-safe time helpers for end-of-day nudges (PRD §7). */

export function eveningHourLocal(now = new Date()): boolean {
  return now.getHours() >= 20;
}

export function localDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
