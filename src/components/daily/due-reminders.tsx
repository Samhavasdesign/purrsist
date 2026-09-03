"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  dismissDueReminder,
  landReminderOnToday,
} from "@/lib/backlog/actions";
import type { DueReminder } from "@/lib/backlog/due-reminders";
import { formatTargetDate } from "@/lib/backlog/group";
import { CloseIcon } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import styles from "./daily-dashboard.module.css";

type Props = {
  reminders: DueReminder[];
  readOnly?: boolean;
};

export function DueReminders({ reminders, readOnly = false }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (reminders.length === 0) return null;

  function run(
    id: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await action();
      setBusyId(null);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className={styles.dueBox} aria-label="Reminders scheduled for today">
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitleRow}>
          <div className={styles.sectionTitleCluster}>
            <div className={styles.sectionTitleMain}>
              <h2 className={styles.sectionTitle}>Reminders</h2>
              <p className={styles.sectionHint}>
                You gave these a date, and it&apos;s arrived.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <ul className={styles.dueList}>
        {reminders.map((reminder) => {
          const rowBusy = busyId === reminder.id && pending;
          return (
            <li key={reminder.id} className={styles.dueRow}>
              <p className={styles.dueText}>
                <span className={styles.dueKicker}>
                  {reminder.overdue ? "Overdue" : "Reminder"}
                </span>{" "}
                you said &ldquo;{reminder.text}&rdquo; for{" "}
                {formatTargetDate(reminder.target_date)}.
              </p>
              {!readOnly ? (
                <div className={styles.dueActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    className={styles.dueAddBtn}
                    disabled={rowBusy}
                    onClick={() =>
                      run(reminder.id, () => landReminderOnToday(reminder.id))
                    }
                  >
                    Add to today
                  </Button>
                  <IconButton
                    label="Dismiss reminder"
                    icon={<CloseIcon />}
                    iconSize={20}
                    tone="ghost"
                    disabled={rowBusy}
                    onClick={() =>
                      run(reminder.id, () => dismissDueReminder(reminder.id))
                    }
                    title="Dismiss reminder"
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
