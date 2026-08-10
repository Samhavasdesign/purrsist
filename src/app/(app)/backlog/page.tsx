import { BacklogScreen } from "@/components/backlog/backlog-screen";
import { requireUser } from "@/lib/auth";
import { getOrCreateTodayEntry } from "@/lib/daily/entry";
import { createClient } from "@/lib/supabase/server";
import type { BacklogItem } from "@/lib/types/database";

export default async function BacklogPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const today = await getOrCreateTodayEntry(user.id);

  const { data, error } = await supabase
    .from("backlog_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []) as BacklogItem[];

  // List: still sitting in the backlog (not on today's dashboard).
  const listItems = items.filter((item) => !item.promoted_to_entry_id);

  // Review: backlog items + anything promoted onto today (to undo/move/retag).
  const reviewItems = items.filter(
    (item) =>
      !item.promoted_to_entry_id || item.promoted_to_entry_id === today.id,
  );

  return <BacklogScreen listItems={listItems} reviewItems={reviewItems} />;
}
