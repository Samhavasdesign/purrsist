"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "./first-capture-aha.module.css";

type Props = {
  reason: string;
  onDismiss: () => void;
};

/**
 * One-time first-capture payoff (PRD §5) — not a tutorial modal.
 * Shows where AI placed the item and why, then fades.
 */
export function FirstCaptureAha({ reason, onDismiss }: Props) {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    timer.current = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(onDismiss, 280);
    }, 6500);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [onDismiss]);

  return (
    <div
      className={`${styles.aha} ${leaving ? styles.leaving : ""}`}
      role="status"
      aria-live="polite"
    >
      <p className={styles.eyebrow}>First capture</p>
      <p className={styles.reason}>{reason}</p>
      <p className={styles.sub}>
        That&apos;s the whole idea — you dump it, Purrsist files it.
      </p>
      <Button
        type="button"
        variant="secondary"
        className={styles.dismiss}
        onClick={() => {
          setLeaving(true);
          window.setTimeout(onDismiss, 200);
        }}
      >
        Got it
      </Button>
    </div>
  );
}
