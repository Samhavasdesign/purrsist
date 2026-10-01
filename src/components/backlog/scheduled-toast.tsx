"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, SparkleIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { ToastShell } from "@/components/ui/toast-shell";
import { formatTargetDate } from "@/lib/backlog/group";
import type { ToastAnchor } from "@/lib/ui/toast-anchor";
import {
  type ScheduledToastPayload,
  subscribeScheduledToast,
} from "@/lib/ui/scheduled-toast-store";
import styles from "./scheduled-toast.module.css";

const VISIBLE_MS = 5000;
const EXIT_MS = 220;

function addDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

function headline({ date, todayKey }: ScheduledToastPayload): string {
  if (date === todayKey) return "Added to today's Reminders";
  if (date === addDay(todayKey)) return "Scheduled for tomorrow";
  return `Scheduled for ${formatTargetDate(date)}`;
}

function hint({ date, todayKey, fromAi }: ScheduledToastPayload): string {
  if (fromAi) return "AI picked this date from your note";
  return date === todayKey
    ? "It's at the top of Today"
    : "Shows up in Reminders that morning";
}

/** The toast itself — pure, so stories can render any state. */
export function ScheduledToastView({
  toast,
  leaving = false,
  anchor,
  onDismiss,
}: {
  toast: ScheduledToastPayload;
  leaving?: boolean;
  anchor?: ToastAnchor;
  onDismiss: () => void;
}) {
  return (
    <ToastShell
      anchor={anchor}
      className={`${styles.toast} ${leaving ? styles.leaving : ""}`}
    >
      <span
        className={`${styles.badge} ${toast.fromAi ? styles.badgeAi : ""}`}
        aria-hidden="true"
      >
        {toast.fromAi ? <SparkleIcon size={20} /> : <CalendarDot />}
      </span>
      <span className={styles.copy}>
        <span className={styles.text}>{headline(toast)}</span>
        <span className={styles.hint}>{hint(toast)}</span>
      </span>
      <IconButton
        tone="ghost"
        label="Dismiss"
        icon={<CloseIcon />}
        iconSize={20}
        className={styles.dismiss}
        onClick={onDismiss}
      />
    </ToastShell>
  );
}

function CalendarDot() {
  return <span className={styles.dot} />;
}

/**
 * Mounted once in the app layout. Shows "Scheduled for…" when a backlog note
 * picks up a date, with a sparkle when the AI worked the date out.
 */
export function ScheduledToastHost() {
  const [toast, setToast] = useState<ScheduledToastPayload | null>(null);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<number[]>([]);

  function clearTimers() {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }

  function dismiss() {
    clearTimers();
    setLeaving(true);
    timers.current.push(
      window.setTimeout(() => {
        setToast(null);
        setLeaving(false);
      }, EXIT_MS),
    );
  }

  useEffect(() => {
    const unsubscribe = subscribeScheduledToast((payload) => {
      clearTimers();
      setLeaving(false);
      setToast(payload);
      timers.current.push(window.setTimeout(dismiss, VISIBLE_MS));
    });
    return () => {
      unsubscribe();
      clearTimers();
    };
    // dismiss/clearTimers only touch refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!toast) return null;
  return (
    <ScheduledToastView toast={toast} leaving={leaving} onDismiss={dismiss} />
  );
}
