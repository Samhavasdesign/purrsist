"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { FirstCaptureAha } from "@/components/capture/first-capture-aha";
import { captureItem } from "@/lib/capture/actions";
import type { Significance } from "@/lib/types/database";
import styles from "./quick-add.module.css";

const SIGNIFICANCE: {
  value: Significance;
  label: string;
}[] = [
  { value: "red", label: "Must-Do" },
  { value: "yellow", label: "Should-Do" },
  { value: "green", label: "Quick Win" },
];

type Props = {
  /** Empty day / first session — focus the capture box (PRD §5). */
  autoFocus?: boolean;
};

export function QuickAdd({ autoFocus = false }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [significance, setSignificance] = useState<Significance | null>(null);
  const [text, setText] = useState("");
  const [forceBacklog, setForceBacklog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstAha, setFirstAha] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!autoFocus) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [autoFocus]);

  function submit() {
    if (!significance) {
      setError("Tap Must-Do, Should-Do, or Quick Win, then type.");
      return;
    }
    if (!text.trim()) {
      setError("Type something first.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await captureItem({
        text,
        significance,
        forceBacklog,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setText("");
      setSignificance(null);
      setForceBacklog(false);

      if (result.isFirstCapture) {
        setFirstAha(result.reason);
      }

      router.refresh();
    });
  }

  return (
    <section className={styles.wrap} aria-label="Quick add">
      <div className={styles.sigRow} role="group" aria-label="Significance">
        {SIGNIFICANCE.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.sigBtn} ${styles[`sig_${option.value}`]} ${
              significance === option.value ? styles.sigSelected : ""
            }`}
            aria-pressed={significance === option.value}
            onClick={() => {
              setSignificance(option.value);
              setError(null);
              inputRef.current?.focus();
            }}
          >
            <span className={styles.sigDot} aria-hidden />
            <span className={styles.sigLabel}>{option.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder={
            significance
              ? forceBacklog
                ? "Add to Backlog…"
                : "What’s on your mind for today?"
              : "Tap a color, then type…"
          }
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          disabled={pending}
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.submit}
          onClick={submit}
          disabled={pending}
        >
          {pending ? "Sorting…" : "Add"}
        </button>
      </div>

      <label className={styles.backlogToggle}>
        <input
          type="checkbox"
          checked={forceBacklog}
          onChange={(event) => setForceBacklog(event.target.checked)}
          disabled={pending}
        />
        <span>This item isn&apos;t for today, add to backlog</span>
      </label>

      {error ? <p className={styles.error}>{error}</p> : null}

      {firstAha ? (
        <FirstCaptureAha
          reason={firstAha}
          onDismiss={() => setFirstAha(null)}
        />
      ) : null}
    </section>
  );
}
