import type {
  ArchiveHabitCheck,
} from "@/lib/daily/archive";
import { formatArchiveDate } from "@/lib/daily/entry-rules";
import {
  extrasForKind,
  KIND_LABELS,
  KIND_LABELS_PLURAL,
  type DailyItemKind,
} from "@/lib/daily/extra-items";
import { readReminders } from "@/lib/daily/reminders";
import type { DailyEntry, DailySlot } from "@/lib/types/database";
import {
  DAILY_SLOTS,
  isDayWin,
  slotCarryoverColumn,
  slotDoneColumn,
  slotTextColumn,
} from "@/lib/types/database";
import styles from "./archive-entry-view.module.css";

type Props = {
  entry: DailyEntry;
  habits: ArchiveHabitCheck[];
};

const GROUPS: {
  title: string;
  kind: DailyItemKind;
  slots: DailySlot[];
}[] = [
  {
    title: KIND_LABELS_PLURAL.must_do,
    kind: "must_do",
    slots: ["must_do"],
  },
  {
    title: KIND_LABELS_PLURAL.should_do,
    kind: "should_do",
    slots: ["should_do_1", "should_do_2"],
  },
  {
    title: KIND_LABELS_PLURAL.quick_win,
    kind: "quick_win",
    slots: ["quick_win_1", "quick_win_2", "quick_win_3"],
  },
];

export function ArchiveEntryView({ entry, habits }: Props) {
  const win = isDayWin(entry);

  return (
    <article className={styles.view}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Archived day</p>
          <h2 className={styles.date}>{formatArchiveDate(entry.date)}</h2>
        </div>
        <span
          className={win ? styles.badge : `${styles.badge} ${styles.badgeOpen}`}
        >
          {win ? "🎉 Win!" : "no win"}
        </span>
      </header>

      <p className={styles.readonlyNote}>
        Read-only — past days can&apos;t be edited.
      </p>

      {GROUPS.map((group) => {
        const rows = [
          ...group.slots.flatMap((slot) => {
            const text = String(entry[slotTextColumn(slot)] ?? "").trim();
            if (!text) return [];
            return [
              {
                key: slot,
                label: DAILY_SLOTS.find((s) => s.slot === slot)?.label ?? slot,
                text,
                done: Boolean(entry[slotDoneColumn(slot)]),
                carry: Number(entry[slotCarryoverColumn(slot)] ?? 0),
              },
            ];
          }),
          ...extrasForKind(entry, group.kind)
            .filter((item) => item.text.trim())
            .map((item) => ({
              key: item.id,
              label: KIND_LABELS[item.kind],
              text: item.text,
              done: item.done,
              carry: item.carryover_count,
            })),
        ];

        if (rows.length === 0) return null;

        return (
          <section key={group.title} className={styles.section}>
            <h3 className={styles.sectionTitle}>{group.title}</h3>
            <ul className={styles.list}>
              {rows.map((row) => (
                <li key={row.key} className={styles.item}>
                  <span
                    className={`${styles.check} ${row.done ? styles.checkOn : ""}`}
                    aria-hidden
                  />
                  <div className={styles.itemBody}>
                    <p
                      className={`${styles.itemText} ${row.done ? styles.done : ""}`}
                    >
                      {row.text}
                    </p>
                    <p className={styles.meta}>
                      {row.label}
                      {row.carry > 0
                        ? ` · carried ${row.carry} day${row.carry === 1 ? "" : "s"}`
                        : ""}
                      {row.done ? " · done" : " · open"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Habits</h3>
        {habits.length === 0 ? (
          <p className={styles.empty}>No habit check-ins logged this day.</p>
        ) : (
          <ul className={styles.list}>
            {habits.map((habit) => (
              <li key={habit.habit_id} className={styles.item}>
                <span
                  className={`${styles.check} ${habit.done ? styles.checkOn : ""}`}
                  aria-hidden
                />
                <p
                  className={`${styles.itemText} ${habit.done ? styles.done : ""}`}
                >
                  {habit.name}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Daily Reminder</h3>
        {(() => {
          const reminders = readReminders(entry).filter((item) =>
            item.text.trim(),
          );
          if (reminders.length === 0) {
            return <p className={styles.empty}>No reminder set.</p>;
          }
          return (
            <ul className={styles.list}>
              {reminders.map((item) => (
                <li key={item.id} className={styles.item}>
                  <p className={styles.reminder}>{item.text}</p>
                </li>
              ))}
            </ul>
          );
        })()}
      </section>
    </article>
  );
}
