"use client";

import { useState, useTransition } from "react";
import { startTrial } from "@/lib/auth/try-it";
import styles from "./try-it-button.module.css";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export function TryItButton({ className, children = "Try it" }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleTry() {
    setError(null);
    startTransition(async () => {
      const result = await startTrial();
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <span className={styles.wrap}>
      <button
        type="button"
        className={className}
        onClick={handleTry}
        disabled={pending}
      >
        {pending ? "Starting…" : children}
      </button>
      {error ? <span className={styles.error}>{error}</span> : null}
    </span>
  );
}
