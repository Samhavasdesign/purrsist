import type { BacklogTag, DailySlot } from "@/lib/types/database";

const TAG_LABELS: Record<BacklogTag, string> = {
  task: "Task",
  errand: "Errand",
  reminder: "Reminder",
  shopping: "Shopping",
  uncategorized: "Uncategorized",
};

const SLOT_LABELS: Record<DailySlot, string> = {
  must_do: "Must-Do",
  should_do_1: "Should-Do",
  should_do_2: "Should-Do",
  quick_win_1: "Quick Win",
  quick_win_2: "Quick Win",
  quick_win_3: "Quick Win",
};

/** Human aha line, e.g. "Sorted as Errand → added to today's Should-Do" */
export function formatCaptureReason(input: {
  tag: BacklogTag;
  placement: DailySlot | null;
  target_date: string | null;
}): string {
  const tag = TAG_LABELS[input.tag] ?? "Item";

  if (input.target_date) {
    return `Sorted as ${tag} → Upcoming (${input.target_date})`;
  }

  if (input.placement) {
    return `Sorted as ${tag} → added to today's ${SLOT_LABELS[input.placement]}`;
  }

  return `Sorted as ${tag} → added to Backlog`;
}
