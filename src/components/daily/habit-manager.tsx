"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { setHabitCheckIn } from "@/lib/daily/actions";
import type { HabitWithCheckIn } from "@/lib/types/database";
import styles from "./daily-dashboard.module.css";

type Props = {
  date: string;
  habits: HabitWithCheckIn[];
  readOnly?: boolean;
};

export function HabitManager({
  date,
  habits: initialHabits,
  readOnly = false,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [habits, setHabits] = useState(initialHabits);

  useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);

  function toggle(habitId: string, done: boolean) {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId ? { ...habit, done_today: done } : habit,
      ),
    );
    startTransition(async () => {
      await setHabitCheckIn(habitId, date, done);
    });
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitleRow}>
          <h2 className={styles.sectionTitle}>Habits</h2>
          {!readOnly ? (
            <Link href="/habits" className={styles.manageHabitsLink}>
              Manage habits
            </Link>
          ) : null}
        </div>
        <p className={styles.sectionHint}>
          Recurring checklist — check off for today
        </p>
      </div>

      {habits.length === 0 ? (
        <p className={styles.habitsEmpty}>
          {readOnly
            ? "No habits were active."
            : "No active habits yet. Manage habits to add one."}
        </p>
      ) : (
        <ul className={styles.slotList}>
          {habits.map((habit) => {
            const name = habit.name.trim() || "Untitled habit";
            return (
              <li key={habit.id} className={styles.slotRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={habit.done_today}
                  disabled={readOnly || pending}
                  aria-label={`Mark ${name} done`}
                  onChange={(event) => toggle(habit.id, event.target.checked)}
                />
                <span
                  className={`${styles.habitLabel} ${habit.done_today ? styles.slotDone : ""}`}
                >
                  {name}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
