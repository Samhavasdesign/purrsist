"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { PlusIcon } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import { addToBacklog } from "@/lib/backlog/actions";
import styles from "./add-to-backlog.module.css";

export function AddToBacklog() {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasText = Boolean(text.trim());

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, 40);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el || !open) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text, open]);

  function collapse() {
    if (pending) return;
    setOpen(false);
    setText("");
    setError(null);
  }

  function submit() {
    if (pending || !hasText) return;

    const trimmed = text.trim();
    setError(null);
    startTransition(async () => {
      const result = await addToBacklog(trimmed);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setText("");
      setOpen(false);
      setError(null);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <div className={styles.wrap}>
        <button
          type="button"
          className={styles.link}
          onClick={() => setOpen(true)}
        >
          <PlusIcon size={20} className={styles.linkIcon} />
          Add to backlog
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.panel} aria-label="Add to backlog">
        <div className={styles.inputRow}>
          <textarea
            ref={inputRef}
            className={styles.input}
            rows={1}
            placeholder="What's on your mind?"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                collapse();
              }
            }}
            onBlur={(event) => {
              const next = event.relatedTarget as Node | null;
              if (event.currentTarget.parentElement?.contains(next)) return;
              if (!text.trim() && !pending) collapse();
            }}
            disabled={pending}
            autoComplete="off"
            aria-describedby={error ? "add-to-backlog-error" : undefined}
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
            disabled={pending || !hasText}
            title={
              pending
                ? "Saving…"
                : !hasText
                  ? "Enter a task description"
                  : "Add to backlog"
            }
          >
            {pending ? "Adding…" : "Add"}
          </Button>
        </div>

        {error ? (
          <p id="add-to-backlog-error" className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
