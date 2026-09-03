import { ArchiveDatePicker } from "@/components/archive/archive-date-picker";
import { ArchiveEntryView } from "@/components/archive/archive-entry-view";
import type {
  ArchiveDateOption,
  ArchiveHabitCheck,
} from "@/lib/daily/archive";
import type { DailyEntry } from "@/lib/types/database";
import styles from "./archive-screen.module.css";

type Props = {
  dates: ArchiveDateOption[];
  selectedDate: string | null;
  entry: DailyEntry | null;
  habits: ArchiveHabitCheck[];
};

/** Past locked days, read-only (PRD §8). Archived backlog items live in Backlog. */
export function ArchiveScreen({
  dates,
  selectedDate,
  entry,
  habits,
}: Props) {
  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Past days</h1>
        <p className={styles.subtitle}>
          Once a day has passed, it&apos;s locked and view-only.
        </p>
      </header>

      <div className={styles.body}>
        <ArchiveDatePicker dates={dates} selectedDate={selectedDate} />
        {entry ? (
          <ArchiveEntryView entry={entry} habits={habits} />
        ) : dates.length > 0 ? (
          <p className={styles.empty}>
            Pick a past date to see what was logged that day.
          </p>
        ) : null}
      </div>
    </main>
  );
}
