"use client";

import { useState, useTransition } from "react";
import { setDigestEnabled } from "@/lib/profile/actions";
import styles from "./digest-toggle.module.css";

type Props = {
  initialEnabled: boolean;
};

/** On/off switch for the 7am "Still on your list" email. Saves on tap. */
export function DigestToggle({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      const result = await setDigestEnabled(next);
      if (!result.ok) {
        setEnabled(!next);
        setError("Couldn't save that. Try again.");
      }
    });
  }

  return (
    <div className={styles.row}>
      <div className={styles.copy}>
        <span id="digest-label" className={styles.label}>
          Morning email
        </span>
        <span id="digest-hint" className={styles.hint}>
          A 7am email with what&apos;s still on your list and reminders that
          are due.
        </span>
        {error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby="digest-label"
        aria-describedby="digest-hint"
        className={styles.switch}
        disabled={pending}
        onClick={toggle}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </button>
    </div>
  );
}
