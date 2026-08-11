import type { BacklogTag, DailySlot } from "@/lib/types/database";
import { KIND_LABELS } from "@/lib/types/database";
import { kindForSlot } from "@/lib/daily/section-hints";

const TAG_LABELS: Record<BacklogTag, string> = {
  task: "Task",
  errand: "Errand",
  reminder: "Reminder",
  shopping: "Shopping",
  uncategorized: "Uncategorized",
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
    return `Sorted as ${tag} → added to today's ${KIND_LABELS[kindForSlot(input.placement)]}`;
  }

  return `Sorted as ${tag} → added to Backlog`;
}
