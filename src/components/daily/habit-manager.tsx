"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { setHabitCheckIn } from "@/lib/daily/actions";
import { isHabitsComplete } from "@/lib/daily/section-complete";
import { SECTION_SUBCOPY } from "@/lib/daily/section-subcopy";
import { Button } from "@/components/ui/button";
import type { HabitWithCheckIn } from "@/lib/types/database";
import styles from "./daily-dashboard.module.css";

type Props = {
  date: string;
  habits: HabitWithCheckIn[];
  readOnly?: boolean;
  /** Fires once when the section flips from incomplete → complete. */
  onSectionWin?: () => void;
  /** Keeps parent sheet-complete checks in sync with local habit toggles. */
  onHabitsCompleteChange?: (complete: boolean) => void;
};

export function HabitManager({
  date,
  habits: initialHabits,
  readOnly = false,
  onSectionWin,
  onHabitsCompleteChange,
}: Props) {
  const [, startTransition] = useTransition();
  const [habits, setHabits] = useState(initialHabits);
  const dirtyHabits = useRef(new Set<string>());
  const prevComplete = useRef<boolean | null>(null);
  const onSectionWinRef = useRef(onSectionWin);
  onSectionWinRef.current = onSectionWin;
  const onHabitsCompleteChangeRef = useRef(onHabitsCompleteChange);
  onHabitsCompleteChangeRef.current = onHabitsCompleteChange;

  useEffect(() => {
    setHabits((prev) => {
      if (dirtyHabits.current.size === 0) return initialHabits;
      return initialHabits.map((habit) => {
        if (!dirtyHabits.current.has(habit.id)) return habit;
        const local = prev.find((h) => h.id === habit.id);
        return local ? { ...habit, done_today: local.done_today } : habit;
      });
    });
  }, [initialHabits]);

  // Reset completion tracking when the calendar day changes.
  useEffect(() => {
    prevComplete.current = null;
  }, [date]);

  const sectionComplete = isHabitsComplete(habits);

  useEffect(() => {
    if (prevComplete.current === null) {
      // Seed from current state so a reload with all habits already checked
      // does not re-fire the celebratory toast / confetti.
      prevComplete.current = sectionComplete;
      onHabitsCompleteChangeRef.current?.(sectionComplete);
      return;
    }

    if (!prevComplete.current && sectionComplete) {
      onSectionWinRef.current?.();
    }

    prevComplete.current = sectionComplete;
    onHabitsCompleteChangeRef.current?.(sectionComplete);
  }, [sectionComplete]);

  function toggle(habitId: string, done: boolean) {
    dirtyHabits.current.add(habitId);
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId ? { ...habit, done_today: done } : habit,
      ),
    );
    startTransition(async () => {
      try {
        await setHabitCheckIn(habitId, date, done);
      } catch {
        setHabits((prev) =>
          prev.map((habit) =>
            habit.id === habitId ? { ...habit, done_today: !done } : habit,
          ),
        );
      } finally {
        dirtyHabits.current.delete(habitId);
      }
    });
  }

  return (
    <section
      className={[
        styles.section,
        styles.section_support,
        sectionComplete ? styles.sectionComplete : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitleRow}>
          <div className={styles.sectionTitleCluster}>
            <div className={styles.sectionTitleMain}>
              <h2 className={styles.sectionTitle}>Habits</h2>
              <p className={styles.sectionHint}>
                {SECTION_SUBCOPY.habitChecklist}
              </p>
            </div>
          </div>
          {!readOnly ? (
            <Button
              href="/habits"
              variant="secondary"
              className={styles.manageHabitsLink}
            >
              Manage habits
            </Button>
          ) : null}
        </div>
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
                  disabled={readOnly}
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
