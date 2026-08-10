import type { DailyEntry } from "@/lib/types/database";
import {
  mergeNotesPayload,
  parseNotesObject,
} from "@/lib/daily/extra-items";

export type DailyReminderItem = {
  id: string;
  text: string;
};

const NOTES_REMINDERS_KEY = "purrsist_reminders";

export function newReminderItem(text = ""): DailyReminderItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `reminder-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
  };
}

export function parseReminders(value: unknown): DailyReminderItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    if (typeof item.id !== "string") return [];
    return [
      {
        id: item.id,
        text: typeof item.text === "string" ? item.text : "",
      },
    ];
  });
}

/** Prefer notes array; fall back to legacy single daily_reminder column. */
export function readReminders(
  entry: Pick<DailyEntry, "daily_reminder" | "notes">,
): DailyReminderItem[] {
  const parsed = parseNotesObject(entry.notes);
  const fromNotes = parseReminders(parsed?.[NOTES_REMINDERS_KEY]);
  if (fromNotes.length > 0) return fromNotes;

  const legacy = entry.daily_reminder?.trim();
  if (legacy) {
    return [{ id: "legacy-reminder", text: legacy }];
  }

  return [];
}

export function notesPayloadWithReminders(
  notes: string | null | undefined,
  reminders: DailyReminderItem[],
): string {
  return mergeNotesPayload(notes, {
    [NOTES_REMINDERS_KEY]: reminders,
  });
}

export function primaryReminderText(reminders: DailyReminderItem[]): string | null {
  const first = reminders.map((r) => r.text.trim()).find(Boolean);
  return first ?? null;
}
