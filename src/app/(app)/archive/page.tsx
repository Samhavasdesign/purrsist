import { ArchiveScreen } from "@/components/archive/archive-screen";
import { requireUser } from "@/lib/auth";
import {
  ensurePastDaysLocked,
  getDailyEntryByDate,
  listArchiveDates,
  listHabitChecksForDate,
} from "@/lib/daily/archive";
import type { ArchiveHabitCheck } from "@/lib/daily/archive";
import { dateKey } from "@/lib/daily/carryover";
import type { DailyEntry } from "@/lib/types/database";

type SearchParams = Promise<{ date?: string | string[] }>;

export default async function ArchiveRoutePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  await ensurePastDaysLocked(user.id);

  const params = await searchParams;
  const raw = params.date;
  const requested = Array.isArray(raw) ? raw[0] : raw;

  const dates = await listArchiveDates(user.id);
  const todayKey = dateKey(new Date());
  const selectedDate =
    requested &&
    /^\d{4}-\d{2}-\d{2}$/.test(requested) &&
    requested < todayKey &&
    dates.some((option) => option.date === requested)
      ? requested
      : (dates[0]?.date ?? null);

  let entry: DailyEntry | null = null;
  let habits: ArchiveHabitCheck[] = [];

  if (selectedDate != null) {
    [entry, habits] = await Promise.all([
      getDailyEntryByDate(user.id, selectedDate),
      listHabitChecksForDate(user.id, selectedDate),
    ]);
  }

  return (
    <ArchiveScreen
      dates={dates}
      selectedDate={selectedDate}
      entry={entry}
      habits={habits}
    />
  );
}
