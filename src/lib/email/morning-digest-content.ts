import { readReminders } from "@/lib/daily/reminders";
import type { DailyEntry } from "@/lib/types/database";
import {
  DAILY_SLOTS,
  KIND_LABELS,
  slotDoneColumn,
  slotTextColumn,
} from "@/lib/types/database";
import { parseExtraItems } from "@/lib/daily/extra-items";

export type DigestHabitLine = {
  name: string;
  done: boolean;
};

export type DigestDueReminder = {
  text: string;
  target_date: string;
};

export type MorningDigestData = {
  todayKey: string;
  yesterdayKey: string;
  yesterday: DailyEntry | null;
  today: DailyEntry;
  habitsYesterday: DigestHabitLine[];
  /** Date-triggered backlog items whose target date has arrived. */
  dueReminders: DigestDueReminder[];
};

export type TodayNudge = {
  mustDoEmpty: boolean;
  shouldDosEmpty: boolean;
  quickWinsEmpty: boolean;
  reminderEmpty: boolean;
};

export function analyzeTodayNudge(today: DailyEntry): TodayNudge {
  const extras = parseExtraItems(today.extra_items);
  const shouldEmpty =
    !today.should_do_1_text?.trim() &&
    !today.should_do_2_text?.trim() &&
    !extras.some((item) => item.kind === "should_do" && item.text.trim());
  const quickEmpty =
    !today.quick_win_1_text?.trim() &&
    !today.quick_win_2_text?.trim() &&
    !today.quick_win_3_text?.trim() &&
    !extras.some((item) => item.kind === "quick_win" && item.text.trim());
  const reminders = readReminders(today);

  return {
    mustDoEmpty:
      !today.must_do_text?.trim() &&
      !extras.some((item) => item.kind === "must_do" && item.text.trim()),
    shouldDosEmpty: shouldEmpty,
    quickWinsEmpty: quickEmpty,
    reminderEmpty: !reminders.some((item) => item.text.trim()),
  };
}

export function needsTodayNudge(nudge: TodayNudge): boolean {
  return (
    nudge.mustDoEmpty ||
    nudge.shouldDosEmpty ||
    nudge.quickWinsEmpty ||
    nudge.reminderEmpty
  );
}

function formatSlotLine(
  entry: DailyEntry,
  slot: (typeof DAILY_SLOTS)[number]["slot"],
  label: string,
): string | null {
  const text = String(entry[slotTextColumn(slot)] ?? "").trim();
  if (!text) return null;
  const done = Boolean(entry[slotDoneColumn(slot)]);
  return `${done ? "[done]" : "[open]"} ${label}: ${text}`;
}

/**
 * Plain-text Morning Digest matching PRD §7:
 * (1) yesterday recap — Must-Do hit or not, Should-Dos/Quick Wins completed, habits checked off
 * (2) nudge to fill today's Must-Dos, Should-Dos, Quick Wins, Daily Reminder if not set
 */
export function buildMorningDigestEmail(data: MorningDigestData): {
  subject: string;
  text: string;
} {
  const { yesterday, today, habitsYesterday } = data;
  const nudge = analyzeTodayNudge(today);
  const lines: string[] = [];

  lines.push("Good morning — here's your Purrsist digest.");
  lines.push("");
  lines.push("—— Yesterday ——");
  lines.push("");

  if (!yesterday) {
    lines.push("No entry logged yesterday.");
  } else {
    const mustText = yesterday.must_do_text?.trim();
    if (mustText) {
      lines.push(
        yesterday.must_do_done
          ? `Must-Do: hit — ${mustText}`
          : `Must-Do: not hit — ${mustText}`,
      );
    } else {
      lines.push("Must-Do: none set");
    }

    const completedShould: string[] = [];
    for (const slot of ["should_do_1", "should_do_2"] as const) {
      const text = yesterday[slotTextColumn(slot)]?.toString().trim();
      if (text && yesterday[slotDoneColumn(slot)]) {
        completedShould.push(text);
      }
    }
    lines.push(
      completedShould.length
        ? `Should-Dos completed (${completedShould.length}): ${completedShould.join("; ")}`
        : "Should-Dos completed: none",
    );

    const completedQuick: string[] = [];
    for (const slot of [
      "quick_win_1",
      "quick_win_2",
      "quick_win_3",
    ] as const) {
      const text = yesterday[slotTextColumn(slot)]?.toString().trim();
      if (text && yesterday[slotDoneColumn(slot)]) {
        completedQuick.push(text);
      }
    }
    lines.push(
      completedQuick.length
        ? `Quick Wins completed (${completedQuick.length}): ${completedQuick.join("; ")}`
        : "Quick Wins completed: none",
    );

    const habitsDone = habitsYesterday.filter((h) => h.done);
    if (habitsYesterday.length === 0) {
      lines.push("Habits checked off: none logged");
    } else if (habitsDone.length === 0) {
      lines.push("Habits checked off: none");
    } else {
      lines.push(
        `Habits checked off (${habitsDone.length}/${habitsYesterday.length}): ${habitsDone
          .map((h) => h.name)
          .join("; ")}`,
      );
    }

    lines.push("");
    lines.push("Full snapshot:");
    for (const { slot, label } of DAILY_SLOTS) {
      const line = formatSlotLine(yesterday, slot, label);
      if (line) lines.push(`  ${line}`);
    }
    for (const extra of parseExtraItems(yesterday.extra_items)) {
      const text = extra.text.trim();
      if (!text) continue;
      const label = KIND_LABELS[extra.kind];
      lines.push(
        `  ${extra.done ? "[done]" : "[open]"} ${label}: ${text}`,
      );
    }
  }

  lines.push("");
  lines.push("—— Today ——");
  lines.push("");

  if (data.dueReminders.length > 0) {
    lines.push("Reminders you scheduled for today:");
    for (const reminder of data.dueReminders) {
      const past =
        reminder.target_date < data.todayKey
          ? ` (was due ${reminder.target_date})`
          : "";
      lines.push(`  • ${reminder.text}${past}`);
    }
    lines.push("");
  }

  if (!needsTodayNudge(nudge)) {
    lines.push(
      "Today's Dashboard looks filled in — Must-Dos, Should-Dos, Quick Wins, and Daily Reminder are set. Review them when you're ready.",
    );
  } else {
    lines.push(
      "A gentle nudge to fill in / review today's Dashboard if you haven't yet:",
    );
    if (nudge.mustDoEmpty) lines.push("  • Must-Dos — not set yet");
    if (nudge.shouldDosEmpty) lines.push("  • Should-Dos — not set yet");
    if (nudge.quickWinsEmpty) lines.push("  • Quick Wins — not set yet");
    if (nudge.reminderEmpty) lines.push("  • Daily Reminder — not set yet");

    const setBits: string[] = [];
    if (!nudge.mustDoEmpty && today.must_do_text?.trim()) {
      setBits.push(`Must-Do: ${today.must_do_text.trim()}`);
    }
    if (!nudge.shouldDosEmpty) {
      const parts = [today.should_do_1_text, today.should_do_2_text]
        .map((t) => t?.trim())
        .filter(Boolean);
      if (parts.length) setBits.push(`Should-Dos: ${parts.join("; ")}`);
    }
    if (!nudge.quickWinsEmpty) {
      const parts = [
        today.quick_win_1_text,
        today.quick_win_2_text,
        today.quick_win_3_text,
      ]
        .map((t) => t?.trim())
        .filter(Boolean);
      if (parts.length) setBits.push(`Quick Wins: ${parts.join("; ")}`);
    }
    if (!nudge.reminderEmpty) {
      const parts = readReminders(today)
        .map((item) => item.text.trim())
        .filter(Boolean);
      if (parts.length) setBits.push(`Daily Reminder: ${parts.join("; ")}`);
    }
    if (setBits.length) {
      lines.push("");
      lines.push("Already on today's list:");
      for (const bit of setBits) lines.push(`  • ${bit}`);
    }
  }

  lines.push("");
  lines.push("One email, one purpose — start the day, close the loop on yesterday.");
  lines.push("— Purrsist");

  return {
    subject: `Purrsist Morning Digest · ${data.todayKey}`,
    text: lines.join("\n"),
  };
}
