"use client";

import { useMemo, useState } from "react";
import { groupBacklogItems } from "@/lib/backlog/group";
import type { BacklogItem } from "@/lib/types/database";
import { BacklogItemRow } from "./backlog-item-row";
import { ReviewPass } from "./review-pass";
import styles from "./backlog.module.css";

/** Review pass UI is temporarily hidden; keep wiring for a later return. */
const SHOW_REVIEW = false;

type Props = {
  listItems: BacklogItem[];
  reviewItems: BacklogItem[];
};

export function BacklogScreen({ listItems, reviewItems }: Props) {
  const [reviewing, setReviewing] = useState(false);
  const sections = useMemo(() => groupBacklogItems(listItems), [listItems]);

  const hasAny = listItems.length > 0;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Backlog</h1>
        {SHOW_REVIEW ? (
          <button
            type="button"
            className={styles.reviewLaunch}
            disabled={reviewItems.length === 0}
            onClick={() => setReviewing(true)}
          >
            Review
          </button>
        ) : null}
      </header>

      {!hasAny ? (
        <p className={styles.empty}>
          Nothing in the backlog yet. Captures that aren&apos;t placed on today
          land here, grouped by category as they&apos;re sorted.
        </p>
      ) : (
        <div className={styles.sections}>
          {sections.map((section) => (
            <section key={section.key} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <ul className={styles.list}>
                {section.items.map((item) => (
                  <BacklogItemRow
                    key={item.id}
                    item={item}
                    showTag={section.tag === null}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {SHOW_REVIEW && reviewing ? (
        <ReviewPass
          items={reviewItems}
          onClose={() => setReviewing(false)}
        />
      ) : null}
    </div>
  );
}
