"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateDailyReminders } from "@/lib/daily/actions";
import {
  newReminderItem,
  readReminders,
  type DailyReminderItem,
} from "@/lib/daily/reminders";
import { SECTION_SUBCOPY } from "@/lib/daily/section-subcopy";
import type { DailyEntry } from "@/lib/types/database";
import { CloseIcon, PlusIcon } from "@/components/icons/icons";
import { IconButton } from "@/components/ui/icon-button";
import styles from "./daily-dashboard.module.css";

type Props = {
  entry: DailyEntry;
  readOnly?: boolean;
};

type ReminderRow = DailyReminderItem;

function toRows(entry: DailyEntry, ensureOpen = false): ReminderRow[] {
  const rows = readReminders(entry).map((item) => ({
    id: item.id,
    text: item.text,
  }));
  if (ensureOpen && rows.length === 0) {
    return [newReminderItem("")];
  }
  return rows;
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
  const [rows, setRows] = useState<ReminderRow[]>(() =>
    toRows(entry, !readOnly),
  );
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  /** Ids that have been persisted with text — only these show the remove control. */
  const [submittedIds, setSubmittedIds] = useState(
    () => new Set(persistedReminders(toRows(entry)).map((row) => row.id)),
  );
  const rowsRef = useRef(rows);
  const dirty = useRef(new Set<string>());
  const lastSaved = useRef(
    serialize(persistedReminders(toRows(entry, !readOnly))),
  );
  const syncKeyRef = useRef(entrySyncKey(entry));
  const inputRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const focusNewest = useRef(false);
  const saveSeq = useRef(0);
  const ignoreServerUntil = useRef<string | null>(null);

  rowsRef.current = rows;

  function resizeInput(el: HTMLTextAreaElement | null | undefined) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    for (const row of rows) {
      resizeInput(inputRefs.current.get(row.id));
    }
  }, [rows]);

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

    const next = toRows(entry, !readOnly);
    const persisted = persistedReminders(next);
    lastSaved.current = serialize(persisted);
    setSubmittedIds(new Set(persisted.map((row) => row.id)));
    setRows(next);
  }, [entry, savingId, readOnly]);

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
      setSubmittedIds(new Set(saved.map((row) => row.id)));
      // Keep any in-progress empty draft rows the user just added.
      // Always leave at least one open field when editable.
      const drafts = nextRows.filter((row) => !row.text.trim());
      const next =
        !readOnly && saved.length === 0 && drafts.length === 0
          ? [newReminderItem("")]
          : [...saved, ...drafts];
      setRows(next);
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
    // Only one empty field at a time — fill/submit the open one first.
    if (rowsRef.current.some((row) => !row.text.trim())) return;
    setError(null);
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

    // Keep empty drafts — plus-added rows stay until the user removes them
    // with X (and only when more than one reminder remains).
    const next = rowsRef.current.map((row) =>
      row.id === id ? { ...row, text: trimmed } : row,
    );

    dirty.current.delete(id);
    rowsRef.current = next;
    setRows(next);
    void persist(next, id);
  }

  function onRemove(id: string) {
    if (readOnly) return;
    setError(null);

    // Last remaining field: clear back to empty placeholder, keep the row.
    if (rowsRef.current.length <= 1) {
      const next = rowsRef.current.map((row) =>
        row.id === id ? { ...row, text: "" } : row,
      );
      dirty.current.delete(id);
      rowsRef.current = next;
      setRows(next);
      void persist(next, id);
      return;
    }

    const next = rowsRef.current.filter((row) => row.id !== id);
    dirty.current.delete(id);
    rowsRef.current = next;
    setRows(next);
    void persist(next, id);
  }

  const hasBlank = rows.some((row) => !row.text.trim());
  const canAddMore = submittedIds.size > 0 && !hasBlank;

  return (
    <section className={`${styles.section} ${styles.section_support}`}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitleRow}>
          <div className={styles.sectionTitleCluster}>
            <div className={styles.sectionTitleMain}>
              <h2 className={styles.sectionTitle}>Daily Reminder</h2>
              <p className={styles.sectionHint}>
                {SECTION_SUBCOPY.dailyReminder}
              </p>
            </div>
          </div>
          {!readOnly && canAddMore ? (
            <IconButton
              label="Add Daily Reminder"
              icon={<PlusIcon />}
              iconSize={20}
              className={styles.addSlotBtn}
              onClick={onAdd}
              disabled={Boolean(savingId)}
              title="Add Daily Reminder"
            />
          ) : null}
        </div>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className={styles.habitsEmpty}>No reminder set.</p>
      ) : (
        <ul className={styles.slotList}>
          {rows.map((row) => {
            const isEmpty = !row.text.trim();
            const isSaving = savingId === row.id;
            return (
              <li
                key={row.id}
                className={`${styles.slotRow} ${isEmpty && !readOnly ? styles.slotEmpty : ""}`}
              >
                <div className={styles.slotFields}>
                  <textarea
                    ref={(node) => {
                      if (node) {
                        inputRefs.current.set(row.id, node);
                        resizeInput(node);
                      } else {
                        inputRefs.current.delete(row.id);
                      }
                    }}
                    className={`${styles.slotInput} ${styles.slotTextarea}`}
                    rows={1}
                    placeholder="Type here..."
                    value={row.text}
                    disabled={readOnly}
                    readOnly={readOnly}
                    aria-label="Daily Reminder"
                    onChange={(event) => {
                      setTextLocal(row.id, event.target.value);
                      resizeInput(event.currentTarget);
                    }}
                    onBlur={(event) => onBlurSave(row.id, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                    }}
                  />
                </div>
                {isSaving ? (
                  <span
                    className={styles.savingSpinner}
                    role="status"
                    aria-label="Saving"
                  />
                ) : null}
                {!readOnly && submittedIds.has(row.id) ? (
                  <IconButton
                    label="Remove reminder"
                    icon={<CloseIcon />}
                    iconSize={20}
                    tone="ghost"
                    className={styles.clearBtn}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onRemove(row.id)}
                    disabled={Boolean(savingId)}
                    title="Remove reminder"
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
