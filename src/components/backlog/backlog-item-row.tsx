"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  checkOffInPlace,
  promoteToToday,
  updateBacklogItemText,
} from "@/lib/backlog/actions";
import {
  openKindsForEntry,
  openSlotsForSignificance,
  significanceForKind,
} from "@/lib/capture/placement";
import { formatTargetDate, toDateKey } from "@/lib/backlog/group";
import { formatShortDate } from "@/lib/daily/entry-rules";
import type {
  BacklogItem,
  DailyEntry,
  DailyItemKind,
  DailySlot,
  Significance,
} from "@/lib/types/database";
import { BACKLOG_TAGS, KIND_LABELS } from "@/lib/types/database";
import { SignificanceDot } from "./significance-dot";
import styles from "./backlog.module.css";

type Props = {
  item: BacklogItem;
  todayEntry: DailyEntry;
  /** Show the tag chip when the section header isn’t already the category. */
  showTag?: boolean;
  promoteOpen: boolean;
  exiting?: boolean;
  onPromoteOpen: () => void;
  onPromoteClose: () => void;
  onPromoted: (payload: {
    itemId: string;
    slot: DailySlot;
    text: string;
  }) => void;
  onExitComplete: () => void;
};

const SIGNIFICANCE_OPTIONS: {
  value: Significance;
  label: string;
}[] = [
  { value: "red", label: "Red" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
];

const SLOT_OPTIONS: DailyItemKind[] = ["must_do", "should_do", "quick_win"];

export function BacklogItemRow({
  item,
  todayEntry,
  showTag = false,
  promoteOpen,
  exiting = false,
  onPromoteOpen,
  onPromoteClose,
  onPromoted,
  onExitComplete,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [significance, setSignificance] = useState<Significance | null>(
    item.significance,
  );
  const [kind, setKind] = useState<DailyItemKind | null>(null);
  const [text, setText] = useState(item.text);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const openKinds = openKindsForEntry(todayEntry);
  const openKindSet = new Set(openKinds);
  const canConfirm = Boolean(significance && kind && openKindSet.has(kind));

  useEffect(() => {
    setText(item.text);
  }, [item.text]);

  useEffect(() => {
    setSignificance(item.significance);
  }, [item.significance]);

  useEffect(() => {
    if (!promoteOpen) {
      setSignificance(item.significance);
      setKind(null);
      return;
    }
    setError(null);
    setSignificance(item.significance);
    setKind(null);
  }, [promoteOpen, item.significance]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  useEffect(() => {
    if (!promoteOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        event.preventDefault();
        onPromoteClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [promoteOpen, pending, onPromoteClose]);

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
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function confirmPromote() {
    if (!significance || !kind || !openKindSet.has(kind) || pending) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await promoteToToday(item.id, {
          significance,
          kind,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onPromoted({
          itemId: item.id,
          slot: result.slot,
          text: item.text,
        });
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

  const itemToneClass = item.significance
    ? styles[`item_${item.significance}`]
    : styles.itemNeutral;

  return (
    <li
      className={`${styles.item} ${itemToneClass} ${
        promoteOpen ? styles.itemPromoteOpen : ""
      } ${exiting ? styles.itemExiting : ""}`}
      onAnimationEnd={(event) => {
        if (!exiting) return;
        if (event.target !== event.currentTarget) return;
        onExitComplete();
      }}
    >
      <div className={styles.itemMain}>
        <SignificanceDot value={item.significance} />
        <div className={styles.itemBody}>
          <textarea
            ref={textRef}
            className={styles.itemTextInput}
            rows={1}
            value={text}
            aria-label="Edit backlog item"
            disabled={pending || exiting}
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
          <p className={styles.itemMeta}>
            {showTag ? (
              <span className={styles.tag}>
                {BACKLOG_TAGS.find((row) => row.tag === item.tag)?.label ??
                  item.tag}
              </span>
            ) : null}
            <span className={styles.dateTag}>
              {formatShortDate(toDateKey(item.created_at))}
            </span>
            {item.target_date ? (
              <span className={styles.metaDate}>
                {formatTargetDate(item.target_date)}
              </span>
            ) : null}
          </p>
          {error ? <p className={styles.itemError}>{error}</p> : null}
        </div>
      </div>

      {!promoteOpen ? (
        <div className={styles.itemActions}>
          <button
            type="button"
            className={styles.actionBtnPrimary}
            disabled={pending || exiting}
            onClick={() => {
              setError(null);
              onPromoteOpen();
            }}
          >
            Promote to today
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            disabled={pending || exiting}
            onClick={() => run(() => checkOffInPlace(item.id))}
          >
            Delete
          </button>
        </div>
      ) : (
        <div className={styles.promoteMenu} aria-label="Promote to today">
          <div className={styles.promoteBlock}>
            <p className={styles.promoteLabel}>Significance</p>
            <div
              className={styles.promoteSigRow}
              role="group"
              aria-label="Significance"
            >
              {SIGNIFICANCE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="category"
                  category={option.value}
                  selected={significance === option.value}
                  aria-pressed={significance === option.value}
                  className={styles.promoteCategory}
                  disabled={pending}
                  onClick={() => {
                    setSignificance(option.value);
                    setError(null);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className={styles.promoteBlock}>
            <p className={styles.promoteLabel}>Slot</p>
            {openKinds.length === 0 ? (
              <p className={styles.promoteEmpty}>
                Today&apos;s list is full — free a slot first.
              </p>
            ) : (
              <div
                className={styles.promoteSigRow}
                role="group"
                aria-label="Slot"
              >
                {SLOT_OPTIONS.map((slotKind) => {
                  const available =
                    openSlotsForSignificance(
                      todayEntry,
                      significanceForKind(slotKind),
                    ).length > 0;
                  const label = KIND_LABELS[slotKind];
                  const fullReason = `${label} is full`;

                  return (
                    <Button
                      key={slotKind}
                      type="button"
                      variant="category"
                      category={significanceForKind(slotKind)}
                      selected={kind === slotKind}
                      aria-pressed={kind === slotKind}
                      className={styles.promoteCategory}
                      disabled={pending || !available}
                      title={available ? label : fullReason}
                      onClick={() => {
                        if (!available) return;
                        setKind(slotKind);
                        setError(null);
                      }}
                    >
                      {available ? label : fullReason}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.promoteFooter}>
            <Button
              type="button"
              variant="primary"
              disabled={pending || !canConfirm}
              onClick={confirmPromote}
              title={
                !significance
                  ? "Pick a significance"
                  : !kind
                    ? "Pick a slot"
                    : kind && !openKindSet.has(kind)
                      ? `${KIND_LABELS[kind]} is full`
                      : "Confirm promote"
              }
            >
              Confirm
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={onPromoteClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
