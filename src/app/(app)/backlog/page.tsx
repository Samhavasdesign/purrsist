import { BacklogScreen } from "@/components/backlog/backlog-screen";
import { requireUser } from "@/lib/auth";
import {
  getDailyEntryByDate,
  listArchiveDates,
  listHabitChecksForDate,
  ensurePastDaysLocked,
} from "@/lib/daily/archive";
import { dateKey } from "@/lib/daily/carryover";
import { getOrCreateTodayEntry } from "@/lib/daily/entry";
import { createClient } from "@/lib/supabase/server";
import type { BacklogItem, DailyEntry } from "@/lib/types/database";
import type {
  ArchiveDateOption,
  ArchiveHabitCheck,
} from "@/lib/daily/archive";

type SearchParams = Promise<{
  tab?: string | string[];
  date?: string | string[];
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
  let archiveDates: ArchiveDateOption[] = [];
  let selectedArchiveDate: string | null = null;
  let archiveEntry: DailyEntry | null = null;
  let archiveHabits: ArchiveHabitCheck[] = [];

  if (tab === "archived") {
    await ensurePastDaysLocked(user.id);

    const [{ data: archivedData, error: archivedError }, dates] =
      await Promise.all([
        supabase
          .from("backlog_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "archived")
          .order("last_touched_at", { ascending: false }),
        listArchiveDates(user.id),
      ]);

    if (archivedError) {
      throw new Error(archivedError.message);
    }

    archivedItems = (archivedData ?? []) as BacklogItem[];
    archiveDates = dates;

    const requested = firstParam(params.date);
    const todayKey = dateKey(new Date());
    selectedArchiveDate =
      requested &&
      /^\d{4}-\d{2}-\d{2}$/.test(requested) &&
      requested < todayKey &&
      dates.some((d) => d.date === requested)
        ? requested
        : (dates[0]?.date ?? null);

    if (selectedArchiveDate != null) {
      [archiveEntry, archiveHabits] = await Promise.all([
        getDailyEntryByDate(user.id, selectedArchiveDate),
        listHabitChecksForDate(user.id, selectedArchiveDate),
      ]);
    }
  }

  return (
    <BacklogScreen
      tab={tab}
      listItems={listItems}
      reviewItems={reviewItems}
      archivedItems={archivedItems}
      archiveDates={archiveDates}
      selectedArchiveDate={selectedArchiveDate}
      archiveEntry={archiveEntry}
      archiveHabits={archiveHabits}
      todayEntry={today}
    />
  );
}
