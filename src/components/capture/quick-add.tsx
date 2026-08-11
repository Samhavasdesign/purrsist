"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { FirstCaptureAha } from "@/components/capture/first-capture-aha";
import { useSectionPulse } from "@/components/daily/section-pulse-context";
import { Button } from "@/components/ui/button";
import { captureItem } from "@/lib/capture/actions";
import { kindForSignificance } from "@/lib/capture/placement";
import { KIND_LABELS } from "@/lib/daily/extra-items";
import { kindForSlot } from "@/lib/daily/section-hints";
import type { Significance } from "@/lib/types/database";
import styles from "./quick-add.module.css";

const SIGNIFICANCE: {
  value: Significance;
  label: string;
}[] = [
  { value: "red", label: KIND_LABELS.must_do },
  { value: "yellow", label: KIND_LABELS.should_do },
  { value: "green", label: KIND_LABELS.quick_win },
];

const CATEGORY_REQUIRED_ERROR = "Select a category above";

type Props = {
  /** Empty day / first session — focus the capture box (PRD §5). */
  autoFocus?: boolean;
};

export function QuickAdd({ autoFocus = false }: Props) {
  const router = useRouter();
  const sectionPulse = useSectionPulse();
  const inputRef = useRef<HTMLInputElement>(null);
  const [significance, setSignificance] = useState<Significance | null>(null);
  const [text, setText] = useState("");
  const [forceBacklog, setForceBacklog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstAha, setFirstAha] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasText = Boolean(text.trim());
  const showCategoryError = error === CATEGORY_REQUIRED_ERROR;

  useEffect(() => {
    if (!autoFocus) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [autoFocus]);

  function submit() {
    if (pending || !hasText) {
      return;
    }

    if (!significance) {
      setError(CATEGORY_REQUIRED_ERROR);
      return;
    }

    const capturedSignificance = significance;
    setError(null);
    startTransition(async () => {
      const result = await captureItem({
        text,
        significance: capturedSignificance,
        forceBacklog,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setText("");
      setSignificance(null);
      setForceBacklog(false);

      if (result.placement) {
        sectionPulse?.pulseSection(kindForSlot(result.placement));
      } else if (result.placedAsExtra) {
        sectionPulse?.pulseSection(
          kindForSignificance(capturedSignificance),
        );
      }

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
          <Button
            key={option.value}
            type="button"
            variant="category"
            category={option.value}
            selected={significance === option.value}
            aria-pressed={significance === option.value}
            onClick={() => {
              setSignificance(option.value);
              setError(null);
              inputRef.current?.focus();
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className={styles.field}>
        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            className={
              showCategoryError
                ? `${styles.input} ${styles.inputError}`
                : styles.input
            }
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
            aria-invalid={showCategoryError}
            aria-describedby={error ? "quick-add-error" : undefined}
          />
          <Button
            type="button"
            variant="primary"
            className={
              hasText && !pending
                ? `${styles.submit} ${styles.submitReady}`
                : `${styles.submit} ${styles.submitIdle}`
            }
            onClick={submit}
            disabled={pending}
            title={
              pending
                ? "Sorting…"
                : !hasText
                  ? "Enter a task description"
                  : "Add item"
            }
          >
            {pending ? "Sorting…" : "Add"}
          </Button>
        </div>

        {error ? (
          <p id="quick-add-error" className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
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

      {firstAha ? (
        <FirstCaptureAha
          reason={firstAha}
          onDismiss={() => setFirstAha(null)}
        />
      ) : null}
    </section>
  );
}
