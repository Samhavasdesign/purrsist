"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addHabit,
  archiveHabit,
  removeHabit,
  renameHabit,
  unarchiveHabit,
} from "@/lib/daily/actions";
import { ViewTabs } from "@/components/ui/view-tabs";
import type { Habit } from "@/lib/types/database";
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

function formatCreatedDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const skipSaveOnBlur = useRef(false);
  const editNameRef = useRef("");
  const editingIdRef = useRef<string | null>(null);

  useEffect(() => {
    setActiveHabits(initialActive);
    setArchivedHabits(initialArchived);
  }, [initialActive, initialArchived]);

  function refresh() {
    router.refresh();
  }

  function setTab(next: HabitsTab) {
    if (next === "archived") {
      router.push("/habits?tab=archived");
      return;
    }
    router.push("/habits");
  }

  function onAdd(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Name required");
      return;
    }

    setError(null);
    setNewName("");
    startTransition(async () => {
      const result = await addHabit(trimmed);
      if (!result.ok) {
        setError(result.error);
        setNewName(trimmed);
        return;
      }
      refresh();
    });
  }

  function startEdit(habit: Habit) {
    setError(null);
    skipSaveOnBlur.current = false;
    editingIdRef.current = habit.id;
    editNameRef.current = habit.name;
    setEditingId(habit.id);
    setEditName(habit.name);
  }

  function cancelEdit() {
    skipSaveOnBlur.current = true;
    editingIdRef.current = null;
    editNameRef.current = "";
    setEditingId(null);
    setEditName("");
  }

  function commitEdit(habitId: string) {
    if (skipSaveOnBlur.current) {
      skipSaveOnBlur.current = false;
      return;
    }
    if (editingIdRef.current !== habitId) return;

    const trimmed = editNameRef.current.trim();
    if (!trimmed) {
      setError("Name required");
      return;
    }

    const current = activeHabits.find((habit) => habit.id === habitId);
    editingIdRef.current = null;
    editNameRef.current = "";
    setEditingId(null);
    setEditName("");

    if (current && current.name.trim() === trimmed) return;

    setError(null);
    setActiveHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId ? { ...habit, name: trimmed } : habit,
      ),
    );

    // Avoid startTransition here — blur can fire during React commit/unmount.
    void (async () => {
      const result = await renameHabit(habitId, trimmed);
      if (!result.ok) {
        setError(result.error);
        refresh();
        return;
      }
      refresh();
    })();
  }

  function onEditNameChange(value: string) {
    editNameRef.current = value;
    setEditName(value);
  }

  function onArchive(habit: Habit) {
    setError(null);
    setActiveHabits((prev) => prev.filter((row) => row.id !== habit.id));
    setArchivedHabits((prev) => [
      ...prev,
      {
        ...habit,
        active: false,
        archived_at: new Date().toISOString(),
      },
    ]);
    if (editingId === habit.id) cancelEdit();

    startTransition(async () => {
      const result = await archiveHabit(habit.id);
      if (!result.ok) {
        setError(result.error);
        refresh();
        return;
      }
      refresh();
    });
  }

  function onDelete(habit: Habit) {
    const name = habit.name.trim() || "this habit";
    const confirmed = window.confirm(
      `Delete “${name}”? This permanently removes it and its past check-ins. Archive instead if you want to keep history.`,
    );
    if (!confirmed) return;

    setError(null);
    setActiveHabits((prev) => prev.filter((row) => row.id !== habit.id));
    if (editingId === habit.id) cancelEdit();

    startTransition(async () => {
      const result = await removeHabit(habit.id);
      if (!result.ok) {
        setError(result.error);
        refresh();
        return;
      }
      refresh();
    });
  }

  function onUnarchive(habit: Habit) {
    setError(null);
    setArchivedHabits((prev) => prev.filter((row) => row.id !== habit.id));
    setActiveHabits((prev) => [
      ...prev,
      {
        ...habit,
        active: true,
        archived_at: null,
      },
    ]);

    startTransition(async () => {
      const result = await unarchiveHabit(habit.id);
      if (!result.ok) {
        setError(result.error);
        refresh();
        return;
      }
      refresh();
    });
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Habits</h1>
        <p className={styles.subtitle}>
          Set up and clean up the recurring checklist that shows up on Today.
          Checking off today&apos;s habits stays on the Today dashboard.
        </p>
        <ViewTabs
          value={tab}
          options={TAB_OPTIONS}
          ariaLabel="Habits view"
          onChange={setTab}
        />
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {tab === "active" ? (
        <>
          <section className={styles.section} aria-labelledby="add-habit-heading">
            <h2 id="add-habit-heading" className={styles.sectionTitle}>
              Add habit
            </h2>
            <form className={styles.addForm} onSubmit={onAdd}>
              <input
                className={styles.input}
                type="text"
                value={newName}
                placeholder="e.g. Drink water"
                aria-label="New habit name"
                disabled={pending}
                onChange={(event) => setNewName(event.target.value)}
              />
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={pending || !newName.trim()}
              >
                Add
              </button>
            </form>
          </section>

          <section
            className={styles.section}
            aria-labelledby="active-habits-heading"
          >
            <h2 id="active-habits-heading" className={styles.sectionTitle}>
              Your habits
            </h2>
            {activeHabits.length === 0 ? (
              <p className={styles.empty}>No active habits yet.</p>
            ) : (
              <ul className={styles.list}>
                {activeHabits.map((habit) => {
                  const isEditing = editingId === habit.id;
                  return (
                    <li key={habit.id} className={styles.row}>
                      <div className={styles.rowMain}>
                        {isEditing ? (
                          <input
                            className={styles.nameInput}
                            type="text"
                            value={editName}
                            aria-label="Edit habit name"
                            disabled={pending}
                            autoFocus
                            onChange={(event) =>
                              onEditNameChange(event.target.value)
                            }
                            onBlur={() => commitEdit(habit.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                event.currentTarget.blur();
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                cancelEdit();
                              }
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            className={styles.habitName}
                            disabled={pending}
                            onClick={() => startEdit(habit)}
                          >
                            {habit.name.trim() || "Untitled habit"}
                          </button>
                        )}
                        <p className={styles.meta}>
                          Created {formatCreatedDate(habit.created_at)}
                        </p>
                      </div>
                      <div className={styles.actions}>
                        {isEditing ? (
                          <button
                            type="button"
                            className={styles.ghostBtn}
                            disabled={pending}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={styles.ghostBtn}
                              disabled={pending}
                              onClick={() => onArchive(habit)}
                            >
                              Archive
                            </button>
                            <button
                              type="button"
                              className={styles.dangerBtn}
                              disabled={pending}
                              onClick={() => onDelete(habit)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : archivedHabits.length === 0 ? (
        <p className={styles.empty}>
          No archived habits. Archive a habit to pause it without losing past
          check-ins.
        </p>
      ) : (
        <section
          className={styles.section}
          aria-labelledby="archived-habits-heading"
        >
          <h2 id="archived-habits-heading" className={styles.sectionTitle}>
            Archived
          </h2>
          <ul className={styles.list}>
            {archivedHabits.map((habit) => (
              <li
                key={habit.id}
                className={`${styles.row} ${styles.rowArchived}`}
              >
                <div className={styles.rowMain}>
                  <p className={styles.archivedName}>
                    {habit.name.trim() || "Untitled habit"}
                  </p>
                  <p className={styles.meta}>
                    Created {formatCreatedDate(habit.created_at)}
                    {habit.archived_at
                      ? ` · Archived ${formatCreatedDate(habit.archived_at)}`
                      : null}
                  </p>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    disabled={pending}
                    onClick={() => onUnarchive(habit)}
                  >
                    Unarchive
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
