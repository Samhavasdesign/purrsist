"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unarchiveBacklogItem } from "@/lib/backlog/actions";
import type { BacklogItem } from "@/lib/types/database";
import styles from "./backlog.module.css";

type Props = {
  archivedItems: BacklogItem[];
};

export function BacklogArchivedPanel({ archivedItems }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(archivedItems);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(archivedItems);
  }, [archivedItems]);

  function onUnarchive(item: BacklogItem) {
    setError(null);
    setItems((prev) => prev.filter((row) => row.id !== item.id));
    startTransition(async () => {
      try {
        await unarchiveBacklogItem(item.id);
        router.refresh();
      } catch (err) {
        setItems(archivedItems);
        setError(
          err instanceof Error ? err.message : "Couldn't unarchive that item.",
        );
      }
    });
  }

  return (
    <div className={styles.archivedPanel}>
      <section
        className={styles.section}
        aria-labelledby="archived-items-heading"
      >
        <div className={styles.sectionHead}>
          <h2 id="archived-items-heading" className={styles.cardTitle}>
            Archived items
          </h2>
        </div>
        {error ? (
          <p className={styles.itemError} role="alert">
            {error}
          </p>
        ) : null}
        {items.length === 0 ? (
          <p className={styles.empty}>
            No archived backlog items. Archiving an item from the Active tab
            moves it here without counting it as done, and items left untouched
            for 30 days land here on their own.
          </p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => (
              <li
                key={item.id}
                className={`${styles.item} ${styles.itemArchived}`}
              >
                <div className={styles.itemTop}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemBody}>
                      <p className={styles.itemText}>{item.text}</p>
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      disabled={pending}
                      onClick={() => onUnarchive(item)}
                    >
                      Unarchive
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
