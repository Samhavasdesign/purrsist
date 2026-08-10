"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  checkOffInPlace,
  promoteToToday,
  updateBacklogItemText,
} from "@/lib/backlog/actions";
import { formatTargetDate } from "@/lib/backlog/group";
import type { BacklogItem } from "@/lib/types/database";
import { BACKLOG_TAGS, DAILY_SLOTS } from "@/lib/types/database";
import { SignificanceDot } from "./significance-dot";
import styles from "./backlog.module.css";

type Props = {
  item: BacklogItem;
  /** Show the tag chip when the section header isn’t already the category. */
  showTag?: boolean;
};

export function BacklogItemRow({ item, showTag = false }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [text, setText] = useState(item.text);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(item.text);
  }, [item.text]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  function run(action: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (
          result &&
          typeof result === "object" &&
          "ok" in result &&
          result.ok === false &&
          "error" in result
        ) {
          setError(String(result.error));
        }
        setPromoteOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function saveText(next: string) {
    const trimmed = next.trim();
    if (trimmed === item.text.trim()) {
      setText(item.text);
      return;
    }
    if (!trimmed) {
      setText(item.text);
      setError("Text can’t be empty.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await updateBacklogItemText(item.id, trimmed);
        if (!result.ok) {
          setText(item.text);
          setError(result.error);
          return;
        }
        setText(trimmed);
      } catch (err) {
        setText(item.text);
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <li className={styles.item}>
      <div className={styles.itemMain}>
        <SignificanceDot value={item.significance} />
        <div className={styles.itemBody}>
          <textarea
            ref={textRef}
            className={styles.itemTextInput}
            rows={1}
            value={text}
            aria-label="Edit backlog item"
            disabled={pending}
            onChange={(event) => setText(event.target.value)}
            onBlur={(event) => saveText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.blur();
              }
              if (event.key === "Escape") {
                setText(item.text);
                setError(null);
                event.currentTarget.blur();
              }
            }}
          />
          {showTag || item.target_date ? (
            <p className={styles.itemMeta}>
              {showTag ? (
                <span className={styles.tag}>
                  {BACKLOG_TAGS.find((row) => row.tag === item.tag)?.label ??
                    item.tag}
                </span>
              ) : null}
              {item.target_date ? (
                <span className={styles.metaDate}>
                  {formatTargetDate(item.target_date)}
                </span>
              ) : null}
            </p>
          ) : null}
          {error ? <p className={styles.itemError}>{error}</p> : null}
        </div>
      </div>

      <div className={styles.itemActions}>
        <button
          type="button"
          className={styles.actionBtnPrimary}
          disabled={pending}
          onClick={() => setPromoteOpen((open) => !open)}
        >
          Add to today&apos;s list
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          disabled={pending}
          onClick={() => run(() => checkOffInPlace(item.id))}
        >
          Delete
        </button>
      </div>

      {promoteOpen ? (
        <div className={styles.promoteMenu}>
          <button
            type="button"
            className={styles.promoteOption}
            disabled={pending}
            onClick={() => run(() => promoteToToday(item.id))}
          >
            First open slot
          </button>
          {DAILY_SLOTS.map(({ slot, label }) => (
            <button
              key={slot}
              type="button"
              className={styles.promoteOption}
              disabled={pending}
              onClick={() => run(() => promoteToToday(item.id, slot))}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </li>
  );
}
