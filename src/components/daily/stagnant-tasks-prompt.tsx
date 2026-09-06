"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  archiveStagnantTask,
  saveStagnantToBacklog,
  type StagnantTarget,
} from "@/lib/daily/stagnant";
import type { DailyEntry, UncheckedItem } from "@/lib/types/database";
import {
  listStagnantItems,
  STAGNANT_CARRYOVER_COUNT,
} from "@/lib/types/database";
import styles from "./stagnant-tasks-prompt.module.css";

function storageKey(date: string) {
  return `purrsist:stagnant-prompt:${date}`;
}

function readDismissed(date: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(date)) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(date: string) {
  try {
    window.localStorage.setItem(storageKey(date), "1");
  } catch {
    // best-effort — a private window simply re-prompts on next load
  }
}

function keyFor(item: UncheckedItem): string {
  return item.source === "slot" ? `slot:${item.slot}` : `extra:${item.id}`;
}

function targetFor(item: UncheckedItem): StagnantTarget {
  return item.source === "slot"
    ? { source: "slot", slot: item.slot }
    : { source: "extra", id: item.id };
}

type Props = { entry: DailyEntry };

/**
 * After a task has carried forward STAGNANT_CARRYOVER_COUNT times unchecked,
 * nudge the user to move it off today's list — into the backlog for later, or
 * straight to the archive. Anything left unresolved keeps carrying and the
 * banner returns the next day (the dismissal key is per-date).
 */
export function StagnantTasksPrompt({ entry }: Props) {
  const router = useRouter();
  const stagnant = useMemo(() => listStagnantItems(entry), [entry]);
  // Start hidden until we've read the persisted dismissal, to avoid a flash.
  const [dismissed, setDismissed] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Nested so the lint rule (no synchronous setState in an effect body) is
    // satisfied — same shape the end-of-day nudge uses to read its state.
    function syncDismissed() {
      setDismissed(readDismissed(entry.date));
    }
    syncDismissed();
  }, [entry.date]);

  useEffect(() => {
    if (!modalOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  if (stagnant.length === 0) return null;
  if (dismissed && !modalOpen) return null;

  function closeModal() {
    setModalOpen(false);
    setError(null);
    // Quiet for the rest of today; a new per-date key re-opens it tomorrow.
    writeDismissed(entry.date);
    setDismissed(true);
  }

  function dismissBanner() {
    writeDismissed(entry.date);
    setDismissed(true);
  }

  function resolve(item: UncheckedItem, action: "backlog" | "archive") {
    if (pending) return;
    setError(null);
    const target = targetFor(item);
    startTransition(async () => {
      const result =
        action === "backlog"
          ? await saveStagnantToBacklog(entry.id, target)
          : await archiveStagnantTask(entry.id, target);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const count = stagnant.length;
  const bannerBody =
    count === 1
      ? `“${stagnant[0].text}” has been sitting in your to-do list for ${STAGNANT_CARRYOVER_COUNT} days — move it to the backlog for later?`
      : `${count} tasks have been sitting in your to-do list for ${STAGNANT_CARRYOVER_COUNT} days — move them to the backlog for later?`;

  return (
    <>
      {!modalOpen ? (
        <aside className={styles.banner} role="status" aria-live="polite">
          <div className={styles.copy}>
            <p className={styles.title}>Still hanging around</p>
            <p className={styles.body}>{bannerBody}</p>
          </div>
          <div className={styles.actions}>
            <Button
              type="button"
              variant="primary"
              onClick={() => setModalOpen(true)}
            >
              {count > 1 ? `Review ${count} tasks` : "Review task"}
            </Button>
            <Button type="button" variant="secondary" onClick={dismissBanner}>
              Not now
            </Button>
          </div>
        </aside>
      ) : null}

      {modalOpen && stagnant.length > 0 ? (
        <div
          className={styles.backdrop}
          role="presentation"
          onClick={closeModal}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stagnant-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <h2 id="stagnant-modal-title" className={styles.modalTitle}>
                Sitting for {STAGNANT_CARRYOVER_COUNT}+ days
              </h2>
              <p className={styles.modalSub}>
                Save each one in the backlog for later, or archive it.
              </p>
            </div>

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}

            <ul className={styles.list}>
              {stagnant.map((item) => (
                <li key={keyFor(item)} className={styles.row}>
                  <div className={styles.rowText}>
                    <span className={styles.taskName}>{item.text}</span>
                    <span className={styles.taskMeta}>
                      Carried {item.carryover_count} days
                    </span>
                  </div>
                  <div className={styles.rowActions}>
                    <Button
                      type="button"
                      variant="primary"
                      disabled={pending}
                      onClick={() => resolve(item, "backlog")}
                    >
                      Save in backlog
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => resolve(item, "archive")}
                    >
                      Archive
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={styles.close}
              onClick={closeModal}
              aria-label="Close"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
