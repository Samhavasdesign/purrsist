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

type ReminderRow = DailyReminderItem;

function toRows(entry: DailyEntry): ReminderRow[] {
  return readReminders(entry).map((item) => ({
    id: item.id,
    text: item.text,
  }));
}

function persistedReminders(rows: ReminderRow[]): DailyReminderItem[] {
  return rows
    .map((row) => ({ id: row.id, text: row.text.trim() }))
    .filter((row) => row.text.length > 0);
}

function serialize(reminders: DailyReminderItem[]) {
  return JSON.stringify(reminders);
}

function entrySyncKey(entry: DailyEntry) {
  return `${entry.id}|${entry.daily_reminder ?? ""}|${entry.notes ?? ""}`;
}

export function ReminderManager({ entry, readOnly = false }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ReminderRow[]>(() => toRows(entry));
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const rowsRef = useRef(rows);
  const dirty = useRef(new Set<string>());
  const lastSaved = useRef(serialize(persistedReminders(toRows(entry))));
  const syncKeyRef = useRef(entrySyncKey(entry));
  const inputRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const focusNewest = useRef(false);
  const saveSeq = useRef(0);
  const ignoreServerUntil = useRef<string | null>(null);

  rowsRef.current = rows;

  useEffect(() => {
    const key = entrySyncKey(entry);
    if (key === syncKeyRef.current) return;
    syncKeyRef.current = key;

    if (ignoreServerUntil.current) {
      const serverPayload = serialize(persistedReminders(toRows(entry)));
      if (serverPayload !== ignoreServerUntil.current) return;
      ignoreServerUntil.current = null;
    }

    if (dirty.current.size > 0 || savingId) return;

    const next = toRows(entry);
    lastSaved.current = serialize(persistedReminders(next));
    setRows(next);
  }, [entry, savingId]);

  useEffect(() => {
    if (!focusNewest.current) return;
    focusNewest.current = false;
    const newest = rows[rows.length - 1];
    if (!newest) return;
    window.setTimeout(() => inputRefs.current.get(newest.id)?.focus(), 30);
  }, [rows]);

  async function persist(nextRows: ReminderRow[], rowId: string) {
    const payload = persistedReminders(nextRows);
    const key = serialize(payload);
    if (key === lastSaved.current) return;

    const seq = ++saveSeq.current;
    setError(null);
    setSavingId(rowId);

    try {
      const result = await updateDailyReminders(entry.id, payload);
      if (seq !== saveSeq.current) return;

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const saved = result.reminders ?? [];
      lastSaved.current = serialize(saved);
      ignoreServerUntil.current = lastSaved.current;
      dirty.current.clear();
      // Keep any in-progress empty draft rows the user just added.
      const drafts = nextRows.filter((row) => !row.text.trim());
      setRows([...saved, ...drafts]);
      router.refresh();
    } finally {
      if (seq === saveSeq.current) setSavingId(null);
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
    const draft = newReminderItem("");
    dirty.current.add(draft.id);
    setRows((prev) => [...prev, draft]);
  }

  function onBlurSave(id: string, text: string) {
    if (readOnly) return;

    const trimmed = text.trim();
    const prev = rowsRef.current.find((row) => row.id === id);
    const wasEmpty = !prev?.text.trim();
    const unchanged = (prev?.text.trim() ?? "") === trimmed;

    if (!trimmed && wasEmpty && !dirty.current.has(id)) return;
    if (unchanged && !dirty.current.has(id)) return;

    let next = rowsRef.current.map((row) =>
      row.id === id ? { ...row, text: trimmed } : row,
    );

    // Drop blank rows on blur — don't keep an automatic empty shell.
    if (!trimmed) {
      next = next.filter((row) => row.id !== id);
    }

    dirty.current.delete(id);
    rowsRef.current = next;
    setRows(next);
    void persist(next, id);
  }

  function onRemove(id: string) {
    if (readOnly) return;
    setError(null);

    const next = rowsRef.current.filter((row) => row.id !== id);
    dirty.current.delete(id);
    rowsRef.current = next;
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
              disabled={Boolean(savingId)}
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

      {rows.length === 0 ? (
        <p className={styles.habitsEmpty}>
          {readOnly
            ? "No reminder set."
            : "No reminder yet. Tap + to add one."}
        </p>
      ) : (
        <ul className={styles.slotList}>
          {rows.map((row) => {
            const isEmpty = !row.text.trim();
            const isSaving = savingId === row.id;
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
                    onChange={(event) =>
                      setTextLocal(row.id, event.target.value)
                    }
                    onBlur={(event) => onBlurSave(row.id, event.target.value)}
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
                    disabled={Boolean(savingId)}
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
      )}
    </section>
  );
}
