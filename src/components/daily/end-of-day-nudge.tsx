"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateExtraDailyItemDone, updateSlotDone } from "@/lib/daily/actions";
import { eveningHourLocal } from "@/lib/daily/time";
import type { DailyEntry } from "@/lib/types/database";
import { listUncheckedFilledItems } from "@/lib/types/database";
import styles from "./end-of-day-nudge.module.css";

type NudgeState = {
  count: number;
  dismissed: boolean;
  lastShownAt: number | null;
};

const MAX_NUDGES = 2;
const SECOND_NUDGE_MS = 45 * 60 * 1000; // ~45 minutes between the couple of nudges

function storageKey(date: string) {
  return `purrsist:eod-nudge:${date}`;
}

function readState(date: string): NudgeState {
  try {
    const raw = window.localStorage.getItem(storageKey(date));
    if (!raw) return { count: 0, dismissed: false, lastShownAt: null };
    return JSON.parse(raw) as NudgeState;
  } catch {
    return { count: 0, dismissed: false, lastShownAt: null };
  }
}

function writeState(date: string, state: NudgeState) {
  window.localStorage.setItem(storageKey(date), JSON.stringify(state));
}

type Props = {
  entry: DailyEntry;
};

export function EndOfDayNudge({ entry }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [pending, startTransition] = useTransition();
  const unchecked = useMemo(
    () => listUncheckedFilledItems(entry),
    [entry],
  );

  useEffect(() => {
    function evaluate() {
      if (!eveningHourLocal() || unchecked.length === 0) {
        setVisible(false);
        return;
      }

      const state = readState(entry.date);
      if (state.dismissed) {
        setVisible(false);
        return;
      }

      const now = Date.now();
      const canShowFirst = state.count === 0;
      const canShowSecond =
        state.count === 1 &&
        state.lastShownAt != null &&
        now - state.lastShownAt >= SECOND_NUDGE_MS;

      if (canShowFirst || canShowSecond) {
        const next = {
          count: state.count + 1,
          dismissed: false,
          lastShownAt: now,
        };
        writeState(entry.date, next);
        setVisible(true);
        return;
      }

      // Still within the nudge window after showing — keep banner if not dismissed
      // and we haven't exhausted both nudges without them acting.
      if (state.count > 0 && state.count <= MAX_NUDGES && !state.dismissed) {
        setVisible(true);
      }
    }

    evaluate();
    const timer = window.setInterval(evaluate, 60_000);
    return () => window.clearInterval(timer);
  }, [entry.date, unchecked.length]);

  // If the calendar day flips while the app is open, refresh so carryover can run.
  useEffect(() => {
    const expected = entry.date;
    const timer = window.setInterval(() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${d}`;
      if (key !== expected) {
        router.refresh();
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [entry.date, router]);

  if (!visible || unchecked.length === 0) return null;

  function dismiss() {
    writeState(entry.date, {
      ...readState(entry.date),
      dismissed: true,
    });
    setVisible(false);
  }

  function checkAll() {
    startTransition(async () => {
      for (const item of unchecked) {
        if (item.source === "slot") {
          await updateSlotDone(entry.id, item.slot, true);
        } else {
          await updateExtraDailyItemDone(entry.id, item.id, true);
        }
      }
      dismiss();
      router.refresh();
    });
  }

  return (
    <aside className={styles.banner} role="status" aria-live="polite">
      <div className={styles.copy}>
        <p className={styles.title}>Day&apos;s almost done</p>
        <p className={styles.body}>
          {unchecked.length === 1
            ? `“${unchecked[0].text}” is still open. Check it off, or it will carry into tomorrow.`
            : `${unchecked.length} items are still open. Check them off, or they’ll carry into tomorrow’s matching slots.`}
        </p>
        <ul className={styles.list}>
          {unchecked.map((item) => (
            <li key={item.source === "slot" ? item.slot : item.id}>
              <span className={styles.slot}>{item.label}</span>
              <span className={styles.text}>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.actions}>
        <Button
          type="button"
          variant="primary"
          disabled={pending}
          onClick={checkAll}
        >
          Check all off
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={dismiss}
        >
          Not now
        </Button>
      </div>
    </aside>
  );
}
