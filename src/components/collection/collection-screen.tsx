"use client";

import { useEffect, useRef, useState } from "react";
import { CatPortrait } from "./cat-portraits";
import styles from "./collection-screen.module.css";

export type MockCat = {
  id: string;
  sequenceOrder: number;
  name: string;
  /** Monday of the Mon–Sun week this cat was rescued for. */
  weekStartDate: string;
};

function formatWeekLabel(weekStartDate: string) {
  const [y, m, d] = weekStartDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : "short",
    day: "numeric",
  });
  return `${startLabel}–${endLabel}`;
}

/** Hardcoded demo rescues — replace with CatRescued data later. */
export const MOCK_RESCUED_CATS: MockCat[] = [
  {
    id: "cat-1",
    sequenceOrder: 1,
    name: "Mochi",
    weekStartDate: "2026-06-30",
  },
  {
    id: "cat-2",
    sequenceOrder: 2,
    name: "Biscuit",
    weekStartDate: "2026-07-07",
  },
  {
    id: "cat-3",
    sequenceOrder: 3,
    name: "Noodle",
    weekStartDate: "2026-07-14",
  },
  {
    id: "cat-4",
    sequenceOrder: 4,
    name: "Pickles",
    weekStartDate: "2026-07-21",
  },
  {
    id: "cat-5",
    sequenceOrder: 5,
    name: "Toast",
    weekStartDate: "2026-07-28",
  },
  {
    id: "cat-6",
    sequenceOrder: 6,
    name: "Bean",
    weekStartDate: "2026-08-04",
  },
];

const MOCK_ACTIVE_DAYS = 4;
const MOCK_WEEK_DAYS = 7;

/** Lifetime tallies — replace with real aggregates later. */
const MOCK_STATS = {
  catsRescued: 5,
  daysActiveAllTime: 34,
  itemsCheckedOff: 142,
} as const;

type Props = {
  /** Deep-link from the Today rescue toast — scroll + highlight this cat. */
  highlightCatId?: string | null;
};

export function CollectionScreen({ highlightCatId = null }: Props) {
  const [selected, setSelected] = useState<MockCat | null>(null);
  const highlightRef = useRef<HTMLLIElement | null>(null);

  const cats = [...MOCK_RESCUED_CATS].sort(
    (a, b) => b.sequenceOrder - a.sequenceOrder,
  );

  useEffect(() => {
    if (!selected) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  useEffect(() => {
    if (!highlightCatId) return;
    const node = highlightRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightCatId]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Collection</h1>
          <p className={styles.activeBadge} aria-live="polite">
            {MOCK_ACTIVE_DAYS}/{MOCK_WEEK_DAYS} days active this week
          </p>
        </div>

        <p className={styles.explainer}>
          Interact with Purrsist on 6+ days this week — capturing something
          counts, not just checking it off — and you&apos;ll rescue a new
          stray.
        </p>
      </header>

      <ul className={styles.stats} aria-label="Collection stats">
        <li className={styles.stat}>
          <span className={styles.statValue}>{MOCK_STATS.catsRescued}</span>
          <span className={styles.statLabel}>Cats Rescued</span>
        </li>
        <li className={styles.stat}>
          <span className={styles.statValue}>{MOCK_STATS.daysActiveAllTime}</span>
          <span className={styles.statLabel}>Days Active All-Time</span>
        </li>
        <li className={styles.stat}>
          <span className={styles.statValue}>{MOCK_STATS.itemsCheckedOff}</span>
          <span className={styles.statLabel}>Items Checked Off</span>
        </li>
      </ul>

      {cats.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No strays rescued yet</p>
          <p className={styles.emptyBody}>
            Keep showing up through the week. Cats you rescue land here for
            good — nothing to feed, nothing to lose.
          </p>
        </div>
      ) : (
        <ul className={styles.grid}>
          {cats.map((cat) => {
            const highlighted = highlightCatId === cat.id;
            return (
              <li
                key={cat.id}
                ref={highlighted ? highlightRef : undefined}
                className={highlighted ? styles.cardHighlightWrap : undefined}
              >
                <button
                  type="button"
                  className={`${styles.card} ${highlighted ? styles.cardHighlight : ""}`}
                  onClick={() => setSelected(cat)}
                  aria-label={`View ${cat.name}, week ${cat.sequenceOrder}`}
                >
                  <span className={styles.cardMedia}>
                    <CatPortrait name={cat.name} className={styles.cardImage} />
                    <span className={styles.weekBadge}>
                      Week {cat.sequenceOrder}
                    </span>
                  </span>
                  <span className={styles.cardMeta}>
                    <span className={styles.cardName}>{cat.name}</span>
                    <span className={styles.cardWeek}>
                      {formatWeekLabel(cat.weekStartDate)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected ? (
        <div
          className={styles.detailBackdrop}
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <div
            className={styles.detail}
            role="dialog"
            aria-modal="true"
            aria-labelledby="collection-cat-name"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.detailClose}
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              Close
            </button>
            <CatPortrait
              name={selected.name}
              className={styles.detailImage}
              title={selected.name}
            />
            <div className={styles.detailHeader}>
              <h2 id="collection-cat-name" className={styles.detailName}>
                {selected.name}
              </h2>
              <p className={styles.detailWeek}>
                {formatWeekLabel(selected.weekStartDate)}
              </p>
            </div>
            <p className={styles.detailMeta}>
              Rescued #{selected.sequenceOrder}
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
