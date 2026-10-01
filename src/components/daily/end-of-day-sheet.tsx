"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ToastShell } from "@/components/ui/toast-shell";
import {
  restoreUndone,
  type UndoneTarget,
  updateExtraDailyItemDone,
  updateSlotDone,
} from "@/lib/daily/actions";
import { saveStagnantToBacklog } from "@/lib/daily/stagnant";
import { eveningHourLocal } from "@/lib/daily/time";
import type {
  DailyEntry,
  DailyItemKind,
  UncheckedItem,
} from "@/lib/types/database";
import { KIND_LABELS, listUncheckedFilledItems } from "@/lib/types/database";
import styles from "./end-of-day-sheet.module.css";

type SheetState = {
  /** The sheet already opened itself once today. */
  autoOpened: boolean;
  /** "Check all" ran — stay quiet until tomorrow. */
  closed: boolean;
};

/** Show the carry count once a task is on its third day. */
const SHOW_DAY_FROM = 2;

/** How long the "Undo" toast stays up after closing out the day. */
const UNDO_MS = 8000;

function storageKey(date: string) {
  return `purrsist:eod-sheet:${date}`;
}

function readState(date: string): SheetState {
  try {
    const raw = window.localStorage.getItem(storageKey(date));
    if (raw) return { autoOpened: false, closed: false, ...JSON.parse(raw) };
  } catch {
    // fall through — a private window simply re-prompts
  }
  return { autoOpened: false, closed: false };
}

function writeState(date: string, patch: Partial<SheetState>) {
  try {
    window.localStorage.setItem(
      storageKey(date),
      JSON.stringify({ ...readState(date), ...patch }),
    );
  } catch {
    // best-effort
  }
}

/**
 * Dev-only: `/dashboard?eod=demo` opens the sheet on load regardless of the
 * hour or whether today was already closed out. Ignored in production.
 */
function isDemo(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return new URLSearchParams(window.location.search).get("eod") === "demo";
}

function keyFor(item: UncheckedItem): string {
  return item.source === "slot" ? `slot:${item.slot}` : `extra:${item.id}`;
}

function kindFor(item: UncheckedItem): DailyItemKind {
  if (item.source === "extra") return item.kind;
  if (item.slot === "must_do") return "must_do";
  return item.slot.startsWith("should_do") ? "should_do" : "quick_win";
}

function undoneTarget(item: UncheckedItem): UndoneTarget {
  return item.source === "slot"
    ? { source: "slot", slot: item.slot, carryover_count: item.carryover_count }
    : { source: "extra", id: item.id, carryover_count: item.carryover_count };
}

/**
 * Tick, or untick with the carry count restored. `item` is the snapshot taken
 * when the sheet opened, so its carryover_count is the pre-tick value.
 */
function setItemDone(entryId: string, item: UncheckedItem, done: boolean) {
  if (!done) return restoreUndone(entryId, [undoneTarget(item)]);
  return item.source === "slot"
    ? updateSlotDone(entryId, item.slot, true)
    : updateExtraDailyItemDone(entryId, item.id, true);
}

const DOT_CLASS: Record<DailyItemKind, string> = {
  must_do: styles.dotMust,
  should_do: styles.dotShould,
  quick_win: styles.dotQuick,
};

type Props = {
  entry: DailyEntry;
};

/**
 * End-of-day wrap-up. From 8pm local, the first time the dashboard is opened
 * (or the app comes back to the foreground) with unchecked tasks, a bottom
 * sheet lists them. Each tick saves immediately and can be undone; "Backlog"
 * moves a task off today. "Check all" checks off whatever is left, with
 * a short-lived Undo toast; "Later" leaves a small entry point on the
 * dashboard and the rest carries into tomorrow as usual.
 */
export function EndOfDaySheet({ entry }: Props) {
  const router = useRouter();
  const unchecked = useMemo(() => listUncheckedFilledItems(entry), [entry]);
  const [open, setOpen] = useState(false);
  // Start hidden until localStorage has been read, to avoid a flash.
  const [state, setState] = useState<SheetState>({
    autoOpened: false,
    closed: true,
  });
  // Rows are snapshotted on open so checked items stay visible (and undoable)
  // after the dashboard refreshes and drops them from the unchecked list.
  const [items, setItems] = useState<UncheckedItem[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [closing, startClosing] = useTransition();
  /** Tasks the last "Check all" ticked — what Undo puts back. */
  const [undoTargets, setUndoTargets] = useState<UndoneTarget[] | null>(null);
  const [undoing, startUndoing] = useTransition();
  const [undoError, setUndoError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const uncheckedRef = useRef(unchecked);
  useEffect(() => {
    uncheckedRef.current = unchecked;
  }, [unchecked]);

  const hasOpen = unchecked.length > 0;

  function openSheet() {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setItems(uncheckedRef.current);
    setDone(new Set());
    setError(null);
    setOpen(true);
  }

  useEffect(() => {
    function evaluate(initial = false) {
      const current = readState(entry.date);
      setState(current);
      if (isDemo()) {
        // Only on load, so switching tabs mid-demo doesn't reset the sheet.
        if (!initial) return;
        if (hasOpen) openSheet();
        return;
      }
      if (!eveningHourLocal() || !hasOpen || current.closed) return;
      if (current.autoOpened) return;
      writeState(entry.date, { autoOpened: true });
      setState({ ...current, autoOpened: true });
      openSheet();
    }

    function onVisible() {
      if (document.visibilityState === "visible") evaluate();
    }

    evaluate(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [entry.date, hasOpen]);

  // If the calendar day flips while the app is open, refresh so carryover can run.
  useEffect(() => {
    const expected = entry.date;
    const timer = window.setInterval(() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      if (`${y}-${m}-${d}` !== expected) router.refresh();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [entry.date, router]);

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      returnFocus.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!undoTargets || undoing || undoError) return;
    const timer = window.setTimeout(() => setUndoTargets(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [undoTargets, undoing, undoError]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !closing) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closing]);

  function markBusy(key: string, on: boolean) {
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleDone(item: UncheckedItem) {
    const key = keyFor(item);
    if (busy.has(key) || closing) return;
    const next = !done.has(key);
    setError(null);
    setDone((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(key);
      else copy.delete(key);
      return copy;
    });
    markBusy(key, true);

    void (async () => {
      try {
        const result = await setItemDone(entry.id, item, next);
        if (!result.ok) throw new Error(result.error);
        router.refresh();
      } catch (err) {
        // Roll the tick back so the row matches what's saved.
        setDone((prev) => {
          const copy = new Set(prev);
          if (next) copy.delete(key);
          else copy.add(key);
          return copy;
        });
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        markBusy(key, false);
      }
    })();
  }

  function moveToBacklog(item: UncheckedItem) {
    const key = keyFor(item);
    if (busy.has(key) || closing) return;
    setError(null);
    markBusy(key, true);

    void (async () => {
      try {
        const result = await saveStagnantToBacklog(
          entry.id,
          item.source === "slot"
            ? { source: "slot", slot: item.slot }
            : { source: "extra", id: item.id },
        );
        if (!result.ok) throw new Error(result.error);
        setItems((prev) => prev.filter((row) => keyFor(row) !== key));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        markBusy(key, false);
      }
    })();
  }

  function closeOutToday() {
    if (closing) return;
    setError(null);
    const remaining = items.filter((item) => !done.has(keyFor(item)));

    startClosing(async () => {
      try {
        for (const item of remaining) {
          const result = await setItemDone(entry.id, item, true);
          if (!result.ok) throw new Error(result.error);
          setDone((prev) => new Set(prev).add(keyFor(item)));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        router.refresh();
        return;
      }
      writeState(entry.date, { closed: true });
      setState((prev) => ({ ...prev, closed: true }));
      setOpen(false);
      setUndoError(null);
      setUndoTargets(remaining.length > 0 ? remaining.map(undoneTarget) : null);
      router.refresh();
    });
  }

  function undoCloseOut() {
    if (!undoTargets || undoing) return;
    const targets = undoTargets;
    setUndoError(null);
    startUndoing(async () => {
      try {
        const result = await restoreUndone(entry.id, targets);
        if (!result.ok) throw new Error(result.error);
      } catch (err) {
        setUndoError(
          err instanceof Error ? err.message : "Couldn't undo. Try again.",
        );
        return;
      }
      // Back to "Later": the dashboard entry point returns, no auto-reopen.
      writeState(entry.date, { closed: false });
      setState((prev) => ({ ...prev, closed: false }));
      setUndoTargets(null);
      router.refresh();
    });
  }

  const doneCount = items.filter((item) => done.has(keyFor(item))).length;
  const visible = open && items.length > 0;
  const showEntryPoint =
    hasOpen && !open && state.autoOpened && !state.closed && eveningHourLocal();

  return (
    <>
      {undoTargets ? (
        <ToastShell className={styles.toast}>
          <span className={styles.toastText}>
            {undoError ??
              `Checked off ${undoTargets.length} ${
                undoTargets.length === 1 ? "task" : "tasks"
              }`}
          </span>
          <button
            type="button"
            className={styles.toastAction}
            disabled={undoing}
            onClick={undoCloseOut}
          >
            {undoing ? "Undoing…" : undoError ? "Retry" : "Undo"}
          </button>
          {undoError ? (
            <button
              type="button"
              className={styles.toastDismiss}
              aria-label="Dismiss"
              onClick={() => setUndoTargets(null)}
            >
              ×
            </button>
          ) : null}
        </ToastShell>
      ) : null}

      {showEntryPoint ? (
        <button type="button" className={styles.entryPoint} onClick={openSheet}>
          <span className={styles.entryTitle}>Wrap up today</span>
          <span className={styles.entryMeta}>
            {unchecked.length} open · Review
          </span>
        </button>
      ) : null}

      {visible ? (
        <div
          className={styles.backdrop}
          role="presentation"
          onClick={() => !closing && setOpen(false)}
        >
          <div
            ref={sheetRef}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="eod-sheet-title"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <span className={styles.grabber} aria-hidden="true" />

            <div className={styles.head}>
              <h2 id="eod-sheet-title" className={styles.title}>
                Wrap up today
              </h2>
              <p className={styles.summary} aria-live="polite">
                {doneCount} of {items.length} done
              </p>
            </div>
            <p className={styles.hint}>
              Tick what you finished. Anything you leave open rolls into
              tomorrow.
            </p>

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}

            <ul className={styles.list}>
              {items.map((item) => {
                const key = keyFor(item);
                const isDone = done.has(key);
                const isBusy = busy.has(key);
                const kind = kindFor(item);

                return (
                  <li key={key} className={styles.row}>
                    <button
                      type="button"
                      className={`${styles.check} ${isDone ? styles.checkOn : ""}`}
                      aria-pressed={isDone}
                      aria-label={`Mark “${item.text}” done`}
                      disabled={closing}
                      aria-busy={isBusy}
                      onClick={() => toggleDone(item)}
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3.5 8.5l3 3 6-7" />
                      </svg>
                    </button>
                    <span
                      className={`${styles.dot} ${DOT_CLASS[kind]}`}
                      role="img"
                      aria-label={KIND_LABELS[kind]}
                      title={KIND_LABELS[kind]}
                    />
                    <span className={styles.textWrap}>
                      <span
                        className={`${styles.text} ${isDone ? styles.textDone : ""}`}
                      >
                        {item.text}
                      </span>
                      {!isDone && item.carryover_count >= SHOW_DAY_FROM ? (
                        <span className={styles.meta}>
                          Day {item.carryover_count + 1}
                        </span>
                      ) : null}
                    </span>
                    {!isDone ? (
                      <button
                        type="button"
                        className={styles.pill}
                        disabled={isBusy || closing}
                        aria-label={`Move “${item.text}” to backlog`}
                        onClick={() => moveToBacklog(item)}
                      >
                        Backlog
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <div className={styles.actions}>
              <Button
                type="button"
                variant="primary"
                disabled={closing}
                onClick={closeOutToday}
              >
                {closing ? "Checking…" : "Check all"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={closing}
                onClick={() => setOpen(false)}
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
