"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToastShell } from "@/components/ui/toast-shell";
import { ACTION_COMPLETE_EVENT } from "@/lib/pwa/action-signal";
import {
  type DeviceInfo,
  type Instructions,
  type StandaloneProbe,
  detectIphoneBrowser,
  evaluatePromptEligibility,
  instructionsFor,
  isStandalone,
  readActiveDays,
  readDismissedAt,
  recordActiveDay,
  recordDismissal,
} from "@/lib/pwa/home-screen-prompt";
import styles from "./home-screen-prompt.module.css";

/** Wait out any celebratory toast / confetti before surfacing the prompt. */
const SETTLE_MS = 3500;
/** Never surface within this long of the page mounting (avoid load-time noise). */
const MIN_UPTIME_MS = 8000;

function readDeviceInfo(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform ?? "",
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  };
}

/**
 * Dismissible "Add to Home Screen" prompt.
 *
 * Renders nothing until every condition holds: iPhone, in-browser (not
 * standalone), Purrsist opened on ≥3 distinct calendar days, and not dismissed
 * within the last 7 days. It appears a few seconds after the user completes an
 * action — never on load, never during onboarding.
 */
export function HomeScreenPrompt() {
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState<Instructions>(() =>
    instructionsFor("safari"),
  );

  const titleId = useId();
  const bodyId = useId();
  const stepsId = useId();

  const cardRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const mountedAt = useRef(0);
  const shownThisSession = useRef(false);
  const settleTimer = useRef<number | null>(null);

  // Count today as an active day (distinct local calendar days, local only).
  useEffect(() => {
    mountedAt.current = Date.now();
    try {
      recordActiveDay(window.localStorage);
    } catch {
      /* best-effort */
    }
  }, []);

  const maybeShow = useCallback(() => {
    if (shownThisSession.current || open) return;

    // Dev-only preview hatch (mirrors <ToastShell>'s `anchor` test override):
    // `?a2hsPreview=1` skips every gate — visibility, timing, eligibility — so
    // the card can be inspected on any device while developing. `NODE_ENV` is
    // inlined at build time, so this whole branch is dead code in production.
    const preview =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).get("a2hsPreview") === "1";

    const device = readDeviceInfo();
    if (preview) {
      setInstructions(instructionsFor(detectIphoneBrowser(device.userAgent)));
      shownThisSession.current = true;
      setOpen(true);
      return;
    }

    if (document.visibilityState !== "visible") return;
    if (Date.now() - mountedAt.current < MIN_UPTIME_MS) return;

    const verdict = evaluatePromptEligibility({
      device,
      standalone: isStandalone(window as unknown as StandaloneProbe),
      activeDays: readActiveDays(window.localStorage),
      dismissedAt: readDismissedAt(window.localStorage),
    });
    if (!verdict.eligible) return;

    setInstructions(instructionsFor(detectIphoneBrowser(device.userAgent)));
    shownThisSession.current = true;
    setOpen(true);
  }, [open]);

  // Dev-only: `?a2hsPreview=1` surfaces the card without waiting for an action.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (new URLSearchParams(window.location.search).get("a2hsPreview") !== "1") {
      return;
    }
    const timer = window.setTimeout(maybeShow, 400);
    return () => window.clearTimeout(timer);
  }, [maybeShow]);

  // Surface at a natural pause: a short beat after an action completes.
  useEffect(() => {
    function onActionComplete() {
      if (settleTimer.current != null) return;
      settleTimer.current = window.setTimeout(() => {
        settleTimer.current = null;
        maybeShow();
      }, SETTLE_MS);
    }
    window.addEventListener(ACTION_COMPLETE_EVENT, onActionComplete);
    return () => {
      window.removeEventListener(ACTION_COMPLETE_EVENT, onActionComplete);
      if (settleTimer.current != null) {
        window.clearTimeout(settleTimer.current);
        settleTimer.current = null;
      }
    };
  }, [maybeShow]);

  const close = useCallback(() => {
    setOpen(false);
    const el = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (el && typeof el.focus === "function") {
      el.focus({ preventScroll: true });
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      recordDismissal(window.localStorage);
    } catch {
      /* best-effort */
    }
    close();
  }, [close]);

  // Non-modal dialog: move focus in on open, Escape closes, focus is restored.
  // Focus is not trapped — the user can keep working behind the card.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    cardRef.current?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        dismiss();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <ToastShell anchor="bottom" role="presentation" aria-live="off">
      <div
        ref={cardRef}
        className={styles.card}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={`${bodyId} ${stepsId}`}
        tabIndex={-1}
      >
        <div className={styles.copy}>
          <p id={titleId} className={styles.title}>
            Make Purrsist easier to reach
          </p>
          <p id={bodyId} className={styles.body}>
            Add Purrsist to your iPhone Home Screen and open it like an app.
          </p>
          <p id={stepsId} className={styles.steps}>
            {instructions.text}
          </p>
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={dismiss}>
            Maybe later
          </Button>
        </div>
      </div>
    </ToastShell>
  );
}
