"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  checkOffInPlace,
  moveToSlot,
  retagItem,
  sendBackToBacklog,
} from "@/lib/backlog/actions";
import type { BacklogItem, BacklogTag, DailySlot } from "@/lib/types/database";
import { BACKLOG_TAGS, DAILY_SLOTS } from "@/lib/types/database";
import { SignificanceDot } from "./significance-dot";
import styles from "./backlog.module.css";

type Props = {
  items: BacklogItem[];
  onClose: () => void;
};

export function ReviewPass({ items, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const queue = useMemo(() => items, [items]);
  const item = queue[index] ?? null;
  const isPromoted = Boolean(item?.promoted_to_entry_id);

  function setCardOffset(x: number) {
    setDragX(x);
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${x * 0.35}px)`;
    }
  }

  function advance() {
    setError(null);
    setCardOffset(0);
    if (index >= queue.length - 1) {
      onClose();
      return;
    }
    setIndex((i) => i + 1);
  }

  function run(action: () => Promise<unknown>, thenAdvance = true) {
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
        if (thenAdvance) advance();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function onPointerDown(clientX: number) {
    startX.current = clientX;
  }

  function onPointerMove(clientX: number) {
    if (startX.current == null) return;
    setCardOffset(clientX - startX.current);
  }

  function onPointerUp() {
    if (startX.current == null) return;
    const delta = dragX;
    startX.current = null;
    if (delta > 80) {
      advance();
    } else if (delta < -80 && item) {
      run(() => checkOffInPlace(item.id));
    } else {
      setCardOffset(0);
    }
  }

  if (!item) {
    return (
      <div className={styles.reviewShell}>
        <div className={styles.reviewCard}>
          <p className={styles.reviewEmpty}>Nothing left to review.</p>
          <button type="button" className={styles.primaryBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reviewShell} role="dialog" aria-modal="true">
      <div className={styles.reviewHeader}>
        <p className={styles.reviewProgress}>
          Review {index + 1} / {queue.length}
        </p>
        <button type="button" className={styles.textBtn} onClick={onClose}>
          Close
        </button>
      </div>

      <div
        ref={cardRef}
        className={styles.reviewCard}
        onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
        onTouchEnd={onPointerUp}
        onMouseDown={(e) => onPointerDown(e.clientX)}
        onMouseMove={(e) => {
          if (startX.current != null) onPointerMove(e.clientX);
        }}
        onMouseUp={onPointerUp}
        onMouseLeave={() => {
          if (startX.current != null) onPointerUp();
        }}
      >
        <div className={styles.reviewItemHead}>
          <SignificanceDot value={item.significance} />
          <p className={styles.reviewText}>{item.text}</p>
        </div>
        <p className={styles.itemMeta}>
          <span className={styles.tag}>{item.tag}</span>
          {isPromoted && item.promoted_to_slot ? (
            <span className={styles.metaDate}>
              On today · {item.promoted_to_slot.replaceAll("_", " ")}
            </span>
          ) : null}
        </p>
        <p className={styles.swipeHint}>
          Swipe right to skip · swipe left to check off
        </p>
        {error ? <p className={styles.itemError}>{error}</p> : null}
      </div>

      <section className={styles.reviewActions}>
        <div className={styles.reviewBlock}>
          <p className={styles.reviewLabel}>Re-tag</p>
          <div className={styles.chipRow}>
            {BACKLOG_TAGS.map(({ tag, label }) => (
              <button
                key={tag}
                type="button"
                className={`${styles.chip} ${item.tag === tag ? styles.chipActive : ""}`}
                disabled={pending}
                onClick={() =>
                  run(() => retagItem(item.id, tag as BacklogTag), false)
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.reviewBlock}>
          <p className={styles.reviewLabel}>Move to today</p>
          <div className={styles.chipRow}>
            {DAILY_SLOTS.map(({ slot, label }) => (
              <button
                key={slot}
                type="button"
                className={styles.chip}
                disabled={pending}
                onClick={() => run(() => moveToSlot(item.id, slot as DailySlot))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.reviewFooter}>
          {isPromoted ? (
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={pending}
              onClick={() => run(() => sendBackToBacklog(item.id))}
            >
              Send back to Backlog
            </button>
          ) : null}
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={pending}
            onClick={() => run(() => checkOffInPlace(item.id))}
          >
            Check off
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={pending}
            onClick={advance}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
