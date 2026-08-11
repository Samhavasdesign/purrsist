"use client";

import { ArchiveDatePicker } from "@/components/archive/archive-date-picker";
import { ArchiveEntryView } from "@/components/archive/archive-entry-view";
import type {
  ArchiveDateOption,
  ArchiveHabitCheck,
} from "@/lib/daily/archive";
import { formatTargetDate, toDateKey } from "@/lib/backlog/group";
import { formatShortDate } from "@/lib/daily/entry-rules";
import type { BacklogItem, DailyEntry } from "@/lib/types/database";
import { BACKLOG_TAGS } from "@/lib/types/database";
import { SignificanceDot } from "./significance-dot";
import styles from "./backlog.module.css";

type Props = {
  dates: ArchiveDateOption[];
  selectedDate: string | null;
  entry: DailyEntry | null;
  habits: ArchiveHabitCheck[];
  archivedItems: BacklogItem[];
};

export function BacklogArchivedPanel({
  dates,
  selectedDate,
  entry,
  habits,
  archivedItems,
}: Props) {
  return (
    <div className={styles.archivedPanel}>
      <section className={styles.archivedBlock} aria-labelledby="past-days-heading">
        <h2 id="past-days-heading" className={styles.sectionTitle}>
          Past days
        </h2>
        <p className={styles.archivedHint}>
          Once a day has passed, it&apos;s locked and view-only.
        </p>
        <ArchiveDatePicker dates={dates} selectedDate={selectedDate} />
        {entry ? (
          <ArchiveEntryView entry={entry} habits={habits} />
        ) : dates.length > 0 ? (
          <p className={styles.empty}>
            Pick a past date to see what was logged that day.
          </p>
        ) : null}
      </section>

      <section
        className={styles.archivedBlock}
        aria-labelledby="archived-items-heading"
      >
        <h2 id="archived-items-heading" className={styles.sectionTitle}>
          Archived items
        </h2>
        {archivedItems.length === 0 ? (
          <p className={styles.empty}>
            No archived backlog items. Bulk archive moves aging items here
            without counting them as done.
          </p>
        ) : (
          <ul className={styles.list}>
            {archivedItems.map((item) => (
              <ArchivedBacklogItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ArchivedBacklogItemRow({ item }: { item: BacklogItem }) {
  const tagLabel =
    BACKLOG_TAGS.find((row) => row.tag === item.tag)?.label ?? item.tag;

  return (
    <li
      className={`${styles.item} ${styles.itemArchived} ${
        item.significance
          ? styles[`item_${item.significance}`]
          : styles.itemNeutral
      }`}
    >
      <div className={styles.itemMain}>
        <SignificanceDot value={item.significance} />
        <div className={styles.itemBody}>
          <p className={styles.itemText}>{item.text}</p>
          <p className={styles.itemMeta}>
            <span className={styles.tag}>{tagLabel}</span>
            <span className={styles.dateTag}>
              {formatShortDate(toDateKey(item.created_at))}
            </span>
            {item.target_date ? (
              <span className={styles.metaDate}>
                {formatTargetDate(item.target_date)}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </li>
  );
}
