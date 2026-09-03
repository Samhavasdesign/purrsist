"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons/icons";
import { IconButton } from "@/components/ui/icon-button";
import { ViewTabs } from "@/components/ui/view-tabs";
import { groupBacklogItems } from "@/lib/backlog/group";
import {
  BACKLOG_GROUP_COPY,
  SECTION_SUBCOPY,
} from "@/lib/daily/section-subcopy";
import type { BacklogItem, DailyEntry, DailySlot } from "@/lib/types/database";
import { slotTextColumn } from "@/lib/types/database";
import { BacklogArchivedPanel } from "./backlog-archived-panel";
import { BacklogDraftRow } from "./backlog-draft-row";
import { BacklogItemRow } from "./backlog-item-row";
import { ReviewPass } from "./review-pass";
import styles from "./backlog.module.css";

/** Review pass UI is temporarily hidden; keep wiring for a later return. */
const SHOW_REVIEW = false;

/** Local-only key for an unsaved row — never reaches the server. */
function newDraftId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type BacklogTab = "active" | "archived";

type Props = {
  tab: BacklogTab;
  listItems: BacklogItem[];
  reviewItems: BacklogItem[];
  archivedItems: BacklogItem[];
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
  todayEntry,
}: Props) {
  const router = useRouter();
  const [reviewing, setReviewing] = useState(false);
  /** Ids of the empty rows the plus has added, in the order they appear. */
  const [draftIds, setDraftIds] = useState<string[]>([]);
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
      router.push("/backlog?tab=archived");
      return;
    }
    router.push("/backlog");
  }

  function addDraft() {
    setDraftIds((prev) => [...prev, newDraftId()]);
  }

  function removeDraft(draftId: string) {
    setDraftIds((prev) => prev.filter((id) => id !== draftId));
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
            ? "Items you archived without doing them. Unarchive one to move it back to Active."
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
        <BacklogArchivedPanel archivedItems={archivedItems} />
      ) : (
        <section className={styles.section} aria-label="Backlog items">
          {!hasAny ? (
            <div className={styles.cardActions}>
              <IconButton
                label="Add backlog item"
                icon={<PlusIcon />}
                iconSize={20}
                className={styles.addBtn}
                title="Add backlog item"
                onClick={addDraft}
              />
            </div>
          ) : null}

          {!hasAny && draftIds.length === 0 ? (
            <p className={styles.empty}>
              Nothing in the backlog yet. Captures that aren&apos;t placed on
              today land here, grouped by category as they&apos;re sorted.
            </p>
          ) : (
            <div className={styles.cardBody}>
              {hasAny ? (
                <div className={styles.groups}>
                  {sections.map((section, index) => {
                    const copy = BACKLOG_GROUP_COPY[section.key];
                    return (
                      <div key={section.key} className={styles.group}>
                        <div className={styles.groupHead}>
                          <div className={styles.groupHeadText}>
                            <h2 className={styles.groupTitle}>
                              {copy?.title ?? section.title}
                            </h2>
                            {copy ? (
                              <p className={styles.groupHint}>{copy.hint}</p>
                            ) : null}
                          </div>
                          {index === 0 ? (
                            <IconButton
                              label="Add backlog item"
                              icon={<PlusIcon />}
                              iconSize={20}
                              className={styles.addBtn}
                              title="Add backlog item"
                              onClick={addDraft}
                            />
                          ) : null}
                        </div>
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
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {draftIds.length > 0 ? (
                <ul className={`${styles.list} ${styles.draftList}`}>
                  {draftIds.map((id) => (
                    <BacklogDraftRow
                      key={id}
                      onSaved={() => removeDraft(id)}
                      onDiscard={() => removeDraft(id)}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </section>
      )}

      {SHOW_REVIEW && reviewing ? (
        <ReviewPass items={reviewItems} onClose={() => setReviewing(false)} />
      ) : null}
    </div>
  );
}
