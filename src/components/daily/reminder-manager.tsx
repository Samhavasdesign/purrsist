"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateDailyReminders } from "@/lib/daily/actions";
import {
  newReminderItem,
  readReminders,
  type DailyReminderItem,
} from "@/lib/daily/reminders";
import type { DailyEntry } from "@/lib/types/database";
import styles from "./daily-dashboard.module.css";

type Props = {
  entry: DailyEntry;
  readOnly?: boolean;
};

type ReminderRow = DailyReminderItem & { isDraft?: boolean };

function emptyDraft(): ReminderRow {
  return { ...newReminderItem(""), isDraft: true };
}

function toRows(entry: DailyEntry, readOnly: boolean): ReminderRow[] {
  const rows: ReminderRow[] = readReminders(entry).map((item) => ({
    id: item.id,
    text: item.text,
  }));

  if (!readOnly && !rows.some((row) => !row.text.trim())) {
    rows.push(emptyDraft());
  }

  return rows;
}

function persistedReminders(rows: ReminderRow[]): DailyReminderItem[] {
  return rows
    .map((row) => ({ id: row.id, text: row.text.trim() }))
    .filter((row) => row.text.length > 0);
}

function payloadKey(rows: ReminderRow[]) {
  return JSON.stringify(persistedReminders(rows));
}

export function ReminderManager({ entry, readOnly = false }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ReminderRow[]>(() => toRows(entry, readOnly));
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const dirty = useRef(new Set<string>());
  const rowsRef = useRef(rows);
  const lastSavedKey = useRef(payloadKey(toRows(entry, true)));
  const inputRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const focusNewest = useRef(false);
  const saveGen = useRef(0);

  rowsRef.current = rows;

  useEffect(() => {
    // Don't clobber in-progress edits while dirty or saving.
    if (pending || dirty.current.size > 0) return;
    const next = toRows(entry, readOnly);
    lastSavedKey.current = payloadKey(next);
    setRows(next);
  }, [entry, readOnly, pending]);

  useEffect(() => {
    if (!focusNewest.current) return;
    focusNewest.current = false;
    const empty = rows.find((row) => !row.text.trim());
    if (!empty) return;
    window.setTimeout(() => inputRefs.current.get(empty.id)?.focus(), 30);
  }, [rows]);

  function withTrailingDraft(list: ReminderRow[]): ReminderRow[] {
    if (readOnly || list.some((row) => !row.text.trim())) return list;
    return [...list, emptyDraft()];
  }

  async function persist(nextRows: ReminderRow[], saving?: string) {
    const key = payloadKey(nextRows);
    if (key === lastSavedKey.current) {
      setRows(withTrailingDraft(nextRows));
      return;
    }

    const gen = ++saveGen.current;
    setError(null);
    setSavingId(saving ?? null);
    setPending(true);

    try {
      const result = await updateDailyReminders(
        entry.id,
        persistedReminders(nextRows),
      );
      if (gen !== saveGen.current) return;

      if (!result.ok) {
        setError(result.error);
        return;
      }

      dirty.current.clear();
      lastSavedKey.current = JSON.stringify(result.reminders ?? []);
      const serverRows: ReminderRow[] = (result.reminders ?? []).map((item) => ({
        id: item.id,
        text: item.text,
      }));
      setRows(withTrailingDraft(serverRows));
      router.refresh();
    } finally {
      if (gen === saveGen.current) {
        setPending(false);
        setSavingId(null);
      }
    }
  }

  function setTextLocal(id: string, text: string) {
    dirty.current.add(id);
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, text } : row)),
    );
  }

  function onAdd() {
    if (readOnly) return;
    setError(null);
    const empty = rowsRef.current.find((row) => !row.text.trim());
    if (empty) {
      inputRefs.current.get(empty.id)?.focus();
      return;
    }
    focusNewest.current = true;
    setRows((prev) => [...prev, emptyDraft()]);
  }

  function saveRow(id: string, text: string) {
    if (readOnly) return;

    // Run after React finishes any commit that triggered this blur.
    queueMicrotask(() => {
      const trimmed = text.trim();
      let next = rowsRef.current.map((row) =>
        row.id === id ? { ...row, text: trimmed, isDraft: false } : row,
      );

      if (!trimmed) {
        const filled = next.filter((row) => row.text.trim());
        next =
          filled.length === 0
            ? [emptyDraft()]
            : withTrailingDraft(next.filter((row) => row.id !== id));
      } else {
        next = withTrailingDraft(next);
      }

      dirty.current.delete(id);
      setRows(next);
      void persist(next, id);
    });
  }

  function onRemove(id: string) {
    if (readOnly) return;
    setError(null);

    const filled = rowsRef.current.filter(
      (row) => row.id !== id && row.text.trim(),
    );
    const next =
      filled.length === 0 ? [emptyDraft()] : withTrailingDraft(filled);

    dirty.current.delete(id);
    setRows(next);
    void persist(next, id);
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitleRow}>
          <h2 className={styles.sectionTitle}>Daily Reminder</h2>
          {!readOnly ? (
            <button
              type="button"
              className={styles.addSlotBtn}
              onClick={onAdd}
              disabled={pending}
              aria-label="Add another Daily Reminder"
              title="Add another Daily Reminder"
            >
              <span aria-hidden>+</span>
            </button>
          ) : null}
        </div>
        <p className={styles.sectionHint}>Fresh each day — not recurring</p>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <ul className={styles.slotList}>
        {rows.map((row) => {
          const isEmpty = !row.text.trim();
          const isSaving = savingId === row.id && pending;
          return (
            <li
              key={row.id}
              className={`${styles.slotRow} ${styles.reminderRow} ${isEmpty && !readOnly ? styles.slotEmpty : ""}`}
            >
              <div className={styles.slotFields}>
                <textarea
                  ref={(node) => {
                    if (node) inputRefs.current.set(row.id, node);
                    else inputRefs.current.delete(row.id);
                  }}
                  className={styles.reminderInput}
                  rows={3}
                  placeholder="A task, affirmation, or don’t-do…"
                  value={row.text}
                  disabled={readOnly}
                  readOnly={readOnly}
                  aria-label="Daily Reminder"
                  onChange={(event) => setTextLocal(row.id, event.target.value)}
                  onBlur={(event) => saveRow(row.id, event.target.value)}
                />
                {isSaving ? (
                  <p className={styles.savingHint}>Saving…</p>
                ) : null}
              </div>
              {!readOnly ? (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onRemove(row.id)}
                  disabled={pending || (isEmpty && rows.length <= 1)}
                  aria-label="Clear Daily Reminder"
                  title="Clear"
                >
                  <span aria-hidden>×</span>
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
