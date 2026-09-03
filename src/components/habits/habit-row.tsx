"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameHabit } from "@/lib/daily/actions";
import type { Habit } from "@/lib/types/database";
import styles from "./habits-page.module.css";

function formatCreatedDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  habit: Habit;
  busy?: boolean;
  onArchive: () => void;
};

/** Active habit row — mirrors the Backlog item row (editable name + actions). */
export function HabitRow({ habit, busy = false, onArchive }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(habit.name);
  const nameRef = useRef<HTMLTextAreaElement>(null);

  const disabled = pending || busy;

  useEffect(() => {
    setName(habit.name);
  }, [habit.name]);

  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [name]);

  function saveName(next: string) {
    const trimmed = next.trim();
    if (trimmed === habit.name.trim()) {
      setName(habit.name);
      return;
    }
    if (!trimmed) {
      setName(habit.name);
      setError("Name required");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await renameHabit(habit.id, trimmed);
        if (!result.ok) {
          setName(habit.name);
          setError(result.error);
          return;
        }
        setName(trimmed);
        router.refresh();
      } catch (err) {
        setName(habit.name);
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <li className={styles.item}>
      <div className={styles.itemTop}>
        <div className={styles.itemMain}>
          <div className={styles.itemBody}>
            <p className={styles.itemMeta}>
              <span className={styles.dateTag}>
                Created {formatCreatedDate(habit.created_at)}
              </span>
            </p>
            <textarea
              ref={nameRef}
              className={styles.itemTextInput}
              rows={1}
              value={name}
              aria-label="Edit habit name"
              disabled={disabled}
              onChange={(event) => setName(event.target.value)}
              onBlur={(event) => saveName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
                if (event.key === "Escape") {
                  setName(habit.name);
                  setError(null);
                  event.currentTarget.blur();
                }
              }}
            />
            {error ? <p className={styles.itemError}>{error}</p> : null}
          </div>
        </div>

        <div className={styles.itemActions}>
          <button
            type="button"
            className={styles.dangerBtn}
            disabled={disabled}
            onClick={onArchive}
          >
            Archive
          </button>
        </div>
      </div>
    </li>
  );
}
