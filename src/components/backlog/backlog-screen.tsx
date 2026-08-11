"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ViewTabs } from "@/components/ui/view-tabs";
import type {
  ArchiveDateOption,
  ArchiveHabitCheck,
} from "@/lib/daily/archive";
import { groupBacklogItems } from "@/lib/backlog/group";
import { SECTION_SUBCOPY } from "@/lib/daily/section-subcopy";
import type {
  BacklogItem,
  DailyEntry,
  DailySlot,
} from "@/lib/types/database";
import { slotTextColumn } from "@/lib/types/database";
import { BacklogArchivedPanel } from "./backlog-archived-panel";
import { BacklogItemRow } from "./backlog-item-row";
import { ReviewPass } from "./review-pass";
import styles from "./backlog.module.css";

/** Review pass UI is temporarily hidden; keep wiring for a later return. */
const SHOW_REVIEW = false;

export type BacklogTab = "active" | "archived";

type Props = {
  tab: BacklogTab;
  listItems: BacklogItem[];
  reviewItems: BacklogItem[];
  archivedItems: BacklogItem[];
  archiveDates: ArchiveDateOption[];
  selectedArchiveDate: string | null;
  archiveEntry: DailyEntry | null;
  archiveHabits: ArchiveHabitCheck[];
  todayEntry: DailyEntry;
};

const TAB_OPTIONS = [
  { value: "active" as const, label: "Active" },
  { value: "archived" as const, label: "Archive" },
];

export function BacklogScreen({
  tab,
  listItems,
  reviewItems,
  archivedItems,
  archiveDates,
  selectedArchiveDate,
  archiveEntry,
  archiveHabits,
  todayEntry,
}: Props) {
  const router = useRouter();
  const [reviewing, setReviewing] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [exitingIds, setExitingIds] = useState<Set<string>>(() => new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const [entrySnapshot, setEntrySnapshot] = useState(todayEntry);

  useEffect(() => {
    setEntrySnapshot(todayEntry);
  }, [todayEntry]);

  const visibleItems = useMemo(
    () => listItems.filter((item) => !removedIds.has(item.id)),
    [listItems, removedIds],
  );
  const sections = useMemo(
    () => groupBacklogItems(visibleItems),
    [visibleItems],
  );

  const hasAny = visibleItems.length > 0;

  function setTab(next: BacklogTab) {
    if (next === "archived") {
      const params = new URLSearchParams({ tab: "archived" });
      if (selectedArchiveDate) {
        params.set("date", selectedArchiveDate);
      }
      router.push(`/backlog?${params.toString()}`);
      return;
    }
    router.push("/backlog");
  }

  function handlePromoted(payload: {
    itemId: string;
    slot: DailySlot;
    text: string;
  }) {
    setPromotingId(null);
    setExitingIds((prev) => {
      const next = new Set(prev);
      next.add(payload.itemId);
      return next;
    });
    // Keep capacity honest for the next promote without waiting on refresh.
    setEntrySnapshot((prev) => ({
      ...prev,
      [slotTextColumn(payload.slot)]: payload.text,
    }));
  }

  function handleExitComplete(itemId: string) {
    setExitingIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    router.refresh();
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Backlog</h1>
          <ViewTabs
            value={tab}
            options={TAB_OPTIONS}
            ariaLabel="Backlog view"
            onChange={setTab}
          />
        </div>
        <p className={styles.subtitle}>
          {tab === "archived"
            ? "Past locked days and archived items — view only."
            : SECTION_SUBCOPY.backlog}
        </p>
        {SHOW_REVIEW && tab === "active" ? (
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

      {tab === "archived" ? (
        <BacklogArchivedPanel
          dates={archiveDates}
          selectedDate={selectedArchiveDate}
          entry={archiveEntry}
          habits={archiveHabits}
          archivedItems={archivedItems}
        />
      ) : !hasAny ? (
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
                    todayEntry={entrySnapshot}
                    showTag={section.tag === null}
                    promoteOpen={promotingId === item.id}
                    exiting={exitingIds.has(item.id)}
                    onPromoteOpen={() => setPromotingId(item.id)}
                    onPromoteClose={() =>
                      setPromotingId((current) =>
                        current === item.id ? null : current,
                      )
                    }
                    onPromoted={handlePromoted}
                    onExitComplete={() => handleExitComplete(item.id)}
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
