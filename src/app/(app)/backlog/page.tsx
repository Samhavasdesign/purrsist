import { BacklogScreen } from "@/components/backlog/backlog-screen";
import { sweepAgedBacklogItems } from "@/lib/backlog/archive";
import { requireUser } from "@/lib/auth";
import { getOrCreateTodayEntry } from "@/lib/daily/entry";
import { createClient } from "@/lib/supabase/server";
import type { BacklogItem } from "@/lib/types/database";

type SearchParams = Promise<{
  tab?: string | string[];
}>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BacklogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  await sweepAgedBacklogItems(user.id);
  const today = await getOrCreateTodayEntry(user.id);

  const params = await searchParams;
  const tabParam = firstParam(params.tab);
  const tab = tabParam === "archived" ? "archived" : "active";

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

  let archivedItems: BacklogItem[] = [];

  if (tab === "archived") {
    const { data: archivedData, error: archivedError } = await supabase
      .from("backlog_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "archived")
      .order("last_touched_at", { ascending: false });

    if (archivedError) {
      throw new Error(archivedError.message);
    }

    archivedItems = (archivedData ?? []) as BacklogItem[];
  }

  return (
    <BacklogScreen
      tab={tab}
      listItems={listItems}
      reviewItems={reviewItems}
      archivedItems={archivedItems}
      todayEntry={today}
    />
  );
}
