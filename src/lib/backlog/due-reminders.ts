import type { SupabaseClient } from "@supabase/supabase-js";

export type DueReminder = {
  id: string;
  text: string;
  target_date: string;
  /** Due date already passed unactioned — surfaced as "Overdue". */
  overdue: boolean;
};

/** Local calendar day as YYYY-MM-DD. */
export function localTodayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Active backlog items whose scheduled date has arrived (`target_date <= today`)
 * and that are not already sitting on a day. These are what a date-triggered
 * capture becomes on its target date: they surface in the dotted "Reminders"
 * box above Must-Dos and in that morning's digest.
 *
 * Takes the caller's Supabase client so the dashboard runs under the user's RLS
 * session while the digest cron runs under the service-role admin client.
 */
export async function listDueReminders(
  supabase: SupabaseClient,
  userId: string,
  todayKey: string = localTodayKey(),
): Promise<DueReminder[]> {
  const { data, error } = await supabase
    .from("backlog_items")
    .select("id, text, target_date")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("promoted_to_entry_id", null)
    .lte("target_date", todayKey)
    .order("target_date", { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter((row): row is { id: string; text: string; target_date: string } =>
      Boolean(row.target_date),
    )
    .map((row) => ({
      id: row.id,
      text: row.text,
      target_date: row.target_date,
      overdue: row.target_date < todayKey,
    }));
}
