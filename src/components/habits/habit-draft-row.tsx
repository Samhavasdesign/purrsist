"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addHabit } from "@/lib/daily/actions";
import styles from "./habits-page.module.css";

type Props = {
  /** Row saved — drop the draft and let the server row take its place. */
  onSaved: () => void;
  /** Row abandoned via X, Escape, or an empty blur. */
  onDiscard: () => void;
};

/**
 * Empty habit row the plus adds — mirrors the Backlog draft row: type into it
 * and it saves on blur or Enter; the X throws it away.
 */
export function HabitDraftRow({ onSaved, onDiscard }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /** Set before blur fires so dismissing never also saves. */
  const dismissing = useRef(false);
  /** Synchronous save lock — `pending` lags the Enter → blur → commit chain. */
  const saving = useRef(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, []);

  function dismiss() {
    dismissing.current = true;
    onDiscard();
  }

  function save(trimmed: string) {
    if (saving.current) return;
    saving.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const result = await addHabit(trimmed);

        if (!result.ok) {
          setError(result.error);
          saving.current = false;
          inputRef.current?.focus();
          return;
        }

        router.refresh();
        onSaved();
      } catch {
        setError("Couldn't save that — check your connection and try again.");
        saving.current = false;
        inputRef.current?.focus();
      }
    });
  }

  function commit(value: string) {
    if (dismissing.current || pending || saving.current) return;

    const trimmed = value.trim();
    if (!trimmed) {
      onDiscard();
      return;
    }

    save(trimmed);
  }

  return (
    <li className={`${styles.item} ${styles.itemDraft}`}>
      <div className={styles.itemTop}>
        <div className={styles.itemMain}>
          <div className={styles.itemBody}>
            <textarea
              ref={inputRef}
              className={styles.itemTextInput}
              rows={1}
              placeholder="e.g. Drink water"
              value={text}
              aria-label="New habit name"
              aria-describedby={error ? "habit-draft-error" : undefined}
              disabled={pending}
              autoComplete="off"
              onChange={(event) => {
                setText(event.target.value);
                if (error) setError(null);
              }}
              onBlur={(event) => commit(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  dismiss();
                }
              }}
            />
            {error ? (
              <p
                id="habit-draft-error"
                className={styles.itemError}
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
