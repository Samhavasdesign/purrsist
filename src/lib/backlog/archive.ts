import { createClient } from "@/lib/supabase/server";

/** Backlog items untouched this long are swept into the Archive automatically. */
export const BACKLOG_STALE_DAYS = 30;

/**
 * Auto-archive backlog items that have sat untouched past the stale window.
 * Called on Backlog page load, mirroring ensurePastDaysLocked on the Archive page.
 *
 * Scoped to items still sitting in the backlog: active, not promoted onto a day,
 * and not scheduled for a future date. `last_touched_at` (bumped by every edit,
 * retag, or move) is the "sitting" clock; it is left untouched here so the
 * Archive tab still shows how long ago the item was really active.
 */
export async function sweepAgedBacklogItems(userId: string): Promise<void> {
  const supabase = await createClient();

  const now = new Date();
  const cutoff = new Date(
    now.getTime() - BACKLOG_STALE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const todayKey = now.toISOString().slice(0, 10);

  const { error } = await supabase
    .from("backlog_items")
    .update({ status: "archived" })
    .eq("user_id", userId)
    .eq("status", "active")
    .is("promoted_to_entry_id", null)
    .lt("last_touched_at", cutoff)
    .or(`target_date.is.null,target_date.lt.${todayKey}`);

  if (error) throw error;
}
