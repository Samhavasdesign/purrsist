"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CatPortrait } from "@/components/collection/cat-portraits";
import { CloseIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { ToastShell } from "@/components/ui/toast-shell";
import type { RescueToastPayload } from "@/lib/collection/rescue-toast-types";
import styles from "./rescue-toast.module.css";

type Props = {
  rescue: RescueToastPayload;
};

/**
 * One-time, dismissible payoff when a stray was rescued last week.
 * Retrospective only — never a counter, streak, or urgency nudge.
 */
export function RescueToast({ rescue }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  if (!visible) return null;

  function dismiss() {
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 220);
  }

  function openCollection() {
    dismiss();
    router.push(`/collection?cat=${encodeURIComponent(rescue.catId)}`);
  }

  return (
    <ToastShell
      className={`${styles.toast} ${leaving ? styles.leaving : ""}`}
    >
      <button
        type="button"
        className={styles.main}
        onClick={openCollection}
        aria-label={`${rescue.catName} joined the Collection this week. View in Collection.`}
      >
        <span className={styles.portrait} aria-hidden="true">
          <CatPortrait name={rescue.imageKey} className={styles.portraitSvg} />
        </span>
        <span className={styles.copy}>
          <span className={styles.text}>
            🐾 {rescue.catName} joined the Collection this week.
          </span>
          <span className={styles.hint}>View in Collection</span>
        </span>
      </button>
      <IconButton
        tone="ghost"
        label="Dismiss"
        icon={<CloseIcon />}
        iconSize={20}
        className={styles.dismiss}
        onClick={(event) => {
          event.stopPropagation();
          dismiss();
        }}
      />
    </ToastShell>
  );
}
