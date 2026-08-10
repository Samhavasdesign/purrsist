import { ArchiveDatePicker } from "@/components/archive/archive-date-picker";
import { ArchiveEntryView } from "@/components/archive/archive-entry-view";
import { requireUser } from "@/lib/auth";
import {
  getDailyEntryByDate,
  listArchiveDates,
  listHabitChecksForDate,
} from "@/lib/daily/archive";
import { ensurePastDaysLocked } from "@/lib/daily/archive";
import { dateKey } from "@/lib/daily/carryover";
import styles from "./archive.module.css";

type SearchParams = Promise<{ date?: string | string[] }>;

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  await ensurePastDaysLocked(user.id);

  const params = await searchParams;
  const raw = params.date;
  const requested = Array.isArray(raw) ? raw[0] : raw;
  const today = dateKey(new Date());

  const dates = await listArchiveDates(user.id);
  const selectedDate =
    requested &&
    /^\d{4}-\d{2}-\d{2}$/.test(requested) &&
    requested < today &&
    dates.some((d) => d.date === requested)
      ? requested
      : (dates[0]?.date ?? null);

  const entry =
    selectedDate != null
      ? await getDailyEntryByDate(user.id, selectedDate)
      : null;
  const habits =
    selectedDate != null
      ? await listHabitChecksForDate(user.id, selectedDate)
      : [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Archive</h1>
        <p className={styles.subtitle}>
          Browse past days. Once a day has passed, it&apos;s locked and
          view-only.
        </p>
      </header>

      <ArchiveDatePicker dates={dates} selectedDate={selectedDate} />

      {entry ? (
        <ArchiveEntryView entry={entry} habits={habits} />
      ) : (
        <p className={styles.empty}>
          Pick a past date to see what was logged that day.
        </p>
      )}
    </main>
  );
}
