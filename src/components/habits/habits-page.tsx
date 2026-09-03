"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveHabit, unarchiveHabit } from "@/lib/daily/actions";
import { PlusIcon } from "@/components/icons/icons";
import { IconButton } from "@/components/ui/icon-button";
import { ViewTabs } from "@/components/ui/view-tabs";
import type { Habit } from "@/lib/types/database";
import { HabitDraftRow } from "./habit-draft-row";
import { HabitRow } from "./habit-row";
import styles from "./habits-page.module.css";

type Props = {
  tab: HabitsTab;
  activeHabits: Habit[];
  archivedHabits: Habit[];
};

export type HabitsTab = "active" | "archived";

const TAB_OPTIONS = [
  { value: "active" as const, label: "Active" },
  { value: "archived" as const, label: "Archived" },
];

/** Local-only key for an unsaved draft row — never reaches the server. */
function newDraftId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function HabitsPage({
  tab,
  activeHabits: initialActive,
  archivedHabits: initialArchived,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeHabits, setActiveHabits] = useState(initialActive);
  const [archivedHabits, setArchivedHabits] = useState(initialArchived);
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveHabits(initialActive);
    setArchivedHabits(initialArchived);
  }, [initialActive, initialArchived]);

  function setTab(next: HabitsTab) {
    router.push(next === "archived" ? "/habits?tab=archived" : "/habits");
  }

  function addDraft() {
    setDraftIds((prev) => [...prev, newDraftId()]);
  }

  function removeDraft(draftId: string) {
    setDraftIds((prev) => prev.filter((id) => id !== draftId));
  }

  function onArchive(habit: Habit) {
    setError(null);
    setActiveHabits((prev) => prev.filter((row) => row.id !== habit.id));
    startTransition(async () => {
      const result = await archiveHabit(habit.id);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function onUnarchive(habit: Habit) {
    setError(null);
    setArchivedHabits((prev) => prev.filter((row) => row.id !== habit.id));
    startTransition(async () => {
      const result = await unarchiveHabit(habit.id);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  const hasActive = activeHabits.length > 0;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Habits</h1>
          <ViewTabs
            value={tab}
            options={TAB_OPTIONS}
            ariaLabel="Habits view"
            onChange={setTab}
          />
        </div>
        <p className={styles.subtitle}>
          Set up the recurring checklist that shows up on Today. Checking off
          today&apos;s habits stays on the Today dashboard.
        </p>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {tab === "active" ? (
        <section className={styles.section} aria-label="Habits">
          <div className={styles.groupHead}>
            <div className={styles.groupHeadText}>
              <h2 className={styles.groupTitle}>Your habits</h2>
              <p className={styles.groupHint}>Same list every day.</p>
            </div>
            <IconButton
              label="Add habit"
              icon={<PlusIcon />}
              iconSize={20}
              className={styles.addBtn}
              title="Add habit"
              onClick={addDraft}
            />
          </div>

          {!hasActive && draftIds.length === 0 ? (
            <p className={styles.empty}>
              No habits yet. Add one and it shows up on Today every day.
            </p>
          ) : (
            <div className={styles.cardBody}>
              {hasActive ? (
                <ul className={styles.list}>
                  {activeHabits.map((habit) => (
                    <HabitRow
                      key={habit.id}
                      habit={habit}
                      busy={pending}
                      onArchive={() => onArchive(habit)}
                    />
                  ))}
                </ul>
              ) : null}

              {draftIds.length > 0 ? (
                <ul className={styles.list}>
                  {draftIds.map((id) => (
                    <HabitDraftRow
                      key={id}
                      onSaved={() => removeDraft(id)}
                      onDiscard={() => removeDraft(id)}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </section>
      ) : (
        <section className={styles.section} aria-label="Archived habits">
          {archivedHabits.length === 0 ? (
            <p className={styles.empty}>
              No archived habits. Archive a habit to pause it without losing
              past check-ins.
            </p>
          ) : (
            <ul className={styles.list}>
              {archivedHabits.map((habit) => (
                <li
                  key={habit.id}
                  className={`${styles.item} ${styles.itemArchived}`}
                >
                  <div className={styles.itemTop}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemBody}>
                        <p className={styles.itemText}>
                          {habit.name.trim() || "Untitled habit"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        disabled={pending}
                        onClick={() => onUnarchive(habit)}
                      >
                        Unarchive
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
