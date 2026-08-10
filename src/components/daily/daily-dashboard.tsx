"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  addExtraDailyItem,
  removeExtraDailyItem,
  updateExtraDailyItem,
  updateExtraDailyItemDone,
  updateSlotDone,
  updateSlotText,
} from "@/lib/daily/actions";
import { EndOfDayNudge } from "@/components/daily/end-of-day-nudge";
import { HabitManager } from "@/components/daily/habit-manager";
import { ReminderManager } from "@/components/daily/reminder-manager";
import { WinPayoff } from "@/components/daily/win-payoff";
import { isEditableEntry } from "@/lib/daily/entry-rules";
import {
  extrasForKind,
  newExtraItem,
  parseExtraItems,
  type DailyItemKind,
  type ExtraDailyItem,
} from "@/lib/daily/extra-items";
import { isSectionComplete } from "@/lib/daily/section-complete";
import {
  hintVisibleForKind,
  kindForSlot,
  sectionAtDefaultCapacity,
  type SectionHintFlags,
} from "@/lib/daily/section-hints";
import type {
  DailyEntry,
  DailySlot,
  HabitWithCheckIn,
} from "@/lib/types/database";
import {
  slotCarryoverColumn,
  slotDoneColumn,
  slotTextColumn,
} from "@/lib/types/database";
import styles from "./daily-dashboard.module.css";

type Props = {
  entry: DailyEntry;
  habits: HabitWithCheckIn[];
  sectionHints: SectionHintFlags;
  children?: React.ReactNode;
};

const GROUPS: {
  title: string;
  hint: string;
  kind: DailyItemKind;
  significance: "red" | "yellow" | "green";
  slots: DailySlot[];
  placeholder: string;
  addLabel: string;
  winLabel: string;
  winTooltip: string;
}[] = [
  {
    title: "Must-Dos",
    hint: "Starts with one — add more if you need to",
    kind: "must_do",
    significance: "red",
    slots: ["must_do"],
    placeholder: "Add today’s Must-Do…",
    addLabel: "Add another Must-Do",
    winLabel: "Must-Do checked — today counts as a win.",
    winTooltip: "Must-Do checked — today counts as a win. 🙌 🎉",
  },
  {
    title: "Should-Dos",
    hint: "Starts with two — add more if you need to",
    kind: "should_do",
    significance: "yellow",
    slots: ["should_do_1", "should_do_2"],
    placeholder: "Add a Should-Do…",
    addLabel: "Add another Should-Do",
    winLabel: "All Should-Dos checked.",
    winTooltip: "All Should-Dos checked. 🙌 🎉",
  },
  {
    title: "Quick Wins",
    hint: "Starts with three — add more if you need to",
    kind: "quick_win",
    significance: "green",
    slots: ["quick_win_1", "quick_win_2", "quick_win_3"],
    placeholder: "Add a Quick Win…",
    addLabel: "Add another Quick Win",
    winLabel: "All Quick Wins checked.",
    winTooltip: "All Quick Wins checked. 🙌 🎉",
  },
];

export function DailyDashboard({
  entry,
  habits,
  sectionHints: initialSectionHints,
  children,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [localEntry, setLocalEntry] = useState(() => ({
    ...entry,
    extra_items: parseExtraItems(entry.extra_items),
  }));
  const [sectionHints, setSectionHints] = useState(initialSectionHints);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [showWinPayoff, setShowWinPayoff] = useState(false);
  const [celebratingKind, setCelebratingKind] = useState<DailyItemKind | null>(
    null,
  );
  const [expandedCapacity, setExpandedCapacity] = useState(
    () => new Set<DailyItemKind>(),
  );
  const dirtySlots = useRef(new Set<DailySlot>());
  const dirtyExtras = useRef(new Set<string>());
  const prevComplete = useRef<Record<DailyItemKind, boolean> | null>(null);
  const slotInputRefs = useRef(new Map<DailySlot, HTMLInputElement>());
  const extraInputRefs = useRef(new Map<string, HTMLInputElement>());
  const focusEmptyKind = useRef<DailyItemKind | null>(null);
  const focusExtraId = useRef<string | null>(null);

  useEffect(() => {
    setLocalEntry((prev) => {
      if (prev.id !== entry.id) {
        return { ...entry, extra_items: parseExtraItems(entry.extra_items) };
      }

      const next = {
        ...entry,
        extra_items: parseExtraItems(entry.extra_items),
      } as DailyEntry;

      for (const slot of dirtySlots.current) {
        const col = slotTextColumn(slot);
        (next as Record<string, unknown>)[col] = prev[col];
      }

      if (dirtyExtras.current.size > 0) {
        const prevExtras = parseExtraItems(prev.extra_items);
        const serverExtras = parseExtraItems(next.extra_items);
        const kept = prevExtras.filter((item) => dirtyExtras.current.has(item.id));
        const keptIds = new Set(kept.map((item) => item.id));
        next.extra_items = [
          ...serverExtras.filter((item) => !keptIds.has(item.id)),
          ...kept,
        ];
      }

      return next;
    });
  }, [entry]);

  useEffect(() => {
    setSectionHints(initialSectionHints);
  }, [initialSectionHints]);

  const sectionCompleteByKind: Record<DailyItemKind, boolean> = {
    must_do: isSectionComplete(localEntry, "must_do"),
    should_do: isSectionComplete(localEntry, "should_do"),
    quick_win: isSectionComplete(localEntry, "quick_win"),
  };
  const editable = isEditableEntry(localEntry);

  useEffect(() => {
    if (prevComplete.current === null) {
      prevComplete.current = { ...sectionCompleteByKind };
      return;
    }

    for (const kind of Object.keys(sectionCompleteByKind) as DailyItemKind[]) {
      if (!prevComplete.current[kind] && sectionCompleteByKind[kind]) {
        setCelebratingKind(kind);
        setShowWinPayoff(true);
      }
    }

    prevComplete.current = { ...sectionCompleteByKind };
  }, [
    sectionCompleteByKind.must_do,
    sectionCompleteByKind.should_do,
    sectionCompleteByKind.quick_win,
  ]);

  // Reset payoff tracking when the calendar day / entry changes.
  useEffect(() => {
    const normalized = {
      ...entry,
      extra_items: parseExtraItems(entry.extra_items),
    };
    prevComplete.current = {
      must_do: isSectionComplete(normalized, "must_do"),
      should_do: isSectionComplete(normalized, "should_do"),
      quick_win: isSectionComplete(normalized, "quick_win"),
    };
    setShowWinPayoff(false);
    setCelebratingKind(null);
    setExpandedCapacity(new Set());
  }, [entry.id]);

  useEffect(() => {
    const extraId = focusExtraId.current;
    if (extraId) {
      focusExtraId.current = null;
      window.setTimeout(() => extraInputRefs.current.get(extraId)?.focus(), 30);
      return;
    }

    const kind = focusEmptyKind.current;
    if (!kind) return;
    focusEmptyKind.current = null;
    const group = GROUPS.find((g) => g.kind === kind);
    if (!group) return;
    const firstEmpty = group.slots.find(
      (slot) => !String(localEntry[slotTextColumn(slot)] ?? "").trim(),
    );
    if (!firstEmpty) return;
    window.setTimeout(() => slotInputRefs.current.get(firstEmpty)?.focus(), 30);
  }, [expandedCapacity, localEntry]);

  function expandKind(kind: DailyItemKind) {
    setExpandedCapacity((prev) => {
      if (prev.has(kind)) return prev;
      const next = new Set(prev);
      next.add(kind);
      return next;
    });
  }

  function setTextLocal(slot: DailySlot, text: string) {
    dirtySlots.current.add(slot);
    const col = slotTextColumn(slot);
    setLocalEntry((prev) => ({ ...prev, [col]: text }));
  }

  function setExtraLocal(itemId: string, text: string) {
    dirtyExtras.current.add(itemId);
    setLocalEntry((prev) => ({
      ...prev,
      extra_items: parseExtraItems(prev.extra_items).map((item) =>
        item.id === itemId ? { ...item, text } : item,
      ),
    }));
  }

  function saveText(slot: DailySlot, text: string) {
    if (!editable) return;
    setError(null);
    setSavingKey(slot);
    startTransition(async () => {
      const result = await updateSlotText(localEntry.id, slot, text);
      setSavingKey(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      dirtySlots.current.delete(slot);
      const col = slotTextColumn(slot);
      const trimmed = text.trim() || null;
      setLocalEntry((prev) => ({
        ...prev,
        [col]: trimmed,
        ...(!trimmed
          ? {
              [slotDoneColumn(slot)]: false,
              [slotCarryoverColumn(slot)]: 0,
            }
          : {}),
      }));
      if (result.sectionHints) {
        setSectionHints(result.sectionHints);
      } else if (trimmed) {
        const next = {
          ...localEntry,
          [col]: trimmed,
        } as DailyEntry;
        if (sectionAtDefaultCapacity(next, kindForSlot(slot))) {
          const kind = kindForSlot(slot);
          setSectionHints((flags) => {
            if (kind === "must_do" && !flags.hasFilledMustDoOnce) {
              return { ...flags, hasFilledMustDoOnce: true };
            }
            if (kind === "should_do" && !flags.hasFilledShouldDosOnce) {
              return { ...flags, hasFilledShouldDosOnce: true };
            }
            if (kind === "quick_win" && !flags.hasFilledQuickWinsOnce) {
              return { ...flags, hasFilledQuickWinsOnce: true };
            }
            return flags;
          });
        }
      }
    });
  }

  function toggleDone(slot: DailySlot, done: boolean) {
    if (!editable) return;
    const text = String(localEntry[slotTextColumn(slot)] ?? "").trim();
    if (!text) return;

    setError(null);
    const col = slotDoneColumn(slot);
    const countCol = slotCarryoverColumn(slot);
    setLocalEntry((prev) => ({
      ...prev,
      [col]: done,
      ...(done ? { [countCol]: 0 } : {}),
    }));
    startTransition(async () => {
      const result = await updateSlotDone(localEntry.id, slot, done);
      if (!result.ok) {
        setError(result.error);
        setLocalEntry((prev) => ({ ...prev, [col]: !done }));
      }
    });
  }

  function addExtra(kind: DailyItemKind) {
    if (!editable) return;
    setError(null);
    const optimistic = newExtraItem(kind);
    expandKind(kind);
    focusExtraId.current = optimistic.id;
    setLocalEntry((prev) => ({
      ...prev,
      extra_items: [...parseExtraItems(prev.extra_items), optimistic],
    }));
    dirtyExtras.current.add(optimistic.id);

    startTransition(async () => {
      const result = await addExtraDailyItem(
        localEntry.id,
        kind,
        optimistic,
      );
      if (!result.ok) {
        setError(result.error);
        setLocalEntry((prev) => ({
          ...prev,
          extra_items: parseExtraItems(prev.extra_items).filter(
            (item) => item.id !== optimistic.id,
          ),
        }));
        dirtyExtras.current.delete(optimistic.id);
      }
    });
  }

  function saveExtra(itemId: string, text: string) {
    if (!editable) return;
    setError(null);
    setSavingKey(itemId);
    startTransition(async () => {
      const result = await updateExtraDailyItem(localEntry.id, itemId, text);
      setSavingKey(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      dirtyExtras.current.delete(itemId);
      if (result.extras) {
        setLocalEntry((prev) => ({ ...prev, extra_items: result.extras }));
      }
    });
  }

  function toggleExtraDone(itemId: string, done: boolean) {
    if (!editable) return;
    setError(null);
    setLocalEntry((prev) => ({
      ...prev,
      extra_items: parseExtraItems(prev.extra_items).map((item) =>
        item.id === itemId
          ? { ...item, done, carryover_count: done ? 0 : item.carryover_count }
          : item,
      ),
    }));
    startTransition(async () => {
      const result = await updateExtraDailyItemDone(
        localEntry.id,
        itemId,
        done,
      );
      if (!result.ok) {
        setError(result.error);
        setLocalEntry((prev) => ({
          ...prev,
          extra_items: parseExtraItems(prev.extra_items).map((item) =>
            item.id === itemId ? { ...item, done: !done } : item,
          ),
        }));
      }
    });
  }

  function clearDefaultSlot(slot: DailySlot) {
    if (!editable) return;
    dirtySlots.current.add(slot);
    const col = slotTextColumn(slot);
    setLocalEntry((prev) => ({
      ...prev,
      [col]: "",
      [slotDoneColumn(slot)]: false,
      [slotCarryoverColumn(slot)]: 0,
    }));
    saveText(slot, "");
  }

  function removeExtra(itemId: string) {
    if (!editable) return;
    setError(null);
    setLocalEntry((prev) => ({
      ...prev,
      extra_items: parseExtraItems(prev.extra_items).filter(
        (item) => item.id !== itemId,
      ),
    }));
    dirtyExtras.current.delete(itemId);
    startTransition(async () => {
      const result = await removeExtraDailyItem(localEntry.id, itemId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Today</h1>
      </header>

      {editable ? <EndOfDayNudge entry={localEntry} /> : null}
      {!editable ? (
        <p className={styles.lockedNote}>
          This day is locked and view-only. Browse it in Archive.
        </p>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {children}

      <WinPayoff
        active={showWinPayoff}
        onDone={() => {
          setShowWinPayoff(false);
          setCelebratingKind(null);
        }}
      />

      {GROUPS.map((group) => {
        const extras = extrasForKind(localEntry, group.kind);
        const sectionComplete = sectionCompleteByKind[group.kind];
        const capacityExpanded = expandedCapacity.has(group.kind);
        const emptySlots = group.slots.filter(
          (slot) => !String(localEntry[slotTextColumn(slot)] ?? "").trim(),
        );
        const filledSlots = group.slots.filter(
          (slot) => String(localEntry[slotTextColumn(slot)] ?? "").trim(),
        );
        const filledExtras = extras.filter((item) => item.text.trim());
        const emptyExtras = extras.filter((item) => !item.text.trim());
        const visibleSlots = capacityExpanded ? group.slots : filledSlots;
        const visibleExtras = capacityExpanded ? extras : filledExtras;
        const hiddenEmptyCount = capacityExpanded
          ? 0
          : emptySlots.length + emptyExtras.length;
        const showMoreAffordance =
          editable && !capacityExpanded && hiddenEmptyCount > 0;

        function expandCapacity() {
          focusEmptyKind.current = group.kind;
          expandKind(group.kind);
        }

        return (
          <section key={group.title} className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionTitleRow}>
                <div className={styles.sectionTitleCluster}>
                  <h2 className={styles.sectionTitle}>
                    <span
                      className={`${styles.sectionDot} ${styles[`sectionDot_${group.significance}`]}`}
                      aria-hidden
                    />
                    {group.title}
                  </h2>
                  {sectionComplete ? (
                    <span
                      className={`${styles.badge} ${styles.badgeWin} ${celebratingKind === group.kind ? styles.badgeCelebrate : ""}`}
                      aria-label={group.winLabel}
                      aria-live="polite"
                    >
                      <svg
                        className={styles.badgeIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Win
                      <span className={styles.badgeTooltip} role="tooltip">
                        {group.winTooltip}
                      </span>
                    </span>
                  ) : null}
                </div>
                {editable ? (
                  <button
                    type="button"
                    className={styles.addSlotBtn}
                    onClick={() => addExtra(group.kind)}
                    disabled={pending}
                    aria-label={group.addLabel}
                    title={group.addLabel}
                  >
                    <span aria-hidden>+</span>
                  </button>
                ) : null}
              </div>
              {hintVisibleForKind(sectionHints, group.kind) ? (
                <p className={styles.sectionHint}>{group.hint}</p>
              ) : null}
            </div>
            <ul className={styles.slotList}>
              {visibleSlots.map((slot) => {
                const text = String(localEntry[slotTextColumn(slot)] ?? "");
                const done = Boolean(localEntry[slotDoneColumn(slot)]);
                const carry = Number(localEntry[slotCarryoverColumn(slot)] ?? 0);
                const isEmpty = !text.trim();
                const isSaving = savingKey === slot && pending;

                return (
                  <li
                    key={slot}
                    className={`${styles.slotRow} ${isEmpty && editable ? styles.slotEmpty : ""}`}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={done}
                      disabled={!editable || isEmpty || pending}
                      aria-label={`Mark ${group.title} done`}
                      onChange={(event) =>
                        toggleDone(slot, event.target.checked)
                      }
                    />
                    <div className={styles.slotFields}>
                      <input
                        ref={(node) => {
                          if (node) slotInputRefs.current.set(slot, node);
                          else slotInputRefs.current.delete(slot);
                        }}
                        className={`${styles.slotInput} ${done ? styles.slotDone : ""}`}
                        type="text"
                        value={text}
                        placeholder={group.placeholder}
                        disabled={!editable}
                        readOnly={!editable}
                        aria-label={group.placeholder}
                        onChange={(event) =>
                          setTextLocal(slot, event.target.value)
                        }
                        onBlur={(event) => saveText(slot, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                      />
                      {carry > 0 ? (
                        <p className={styles.carryHint}>
                          Carried {carry} day{carry === 1 ? "" : "s"}
                        </p>
                      ) : null}
                      {isSaving ? (
                        <p className={styles.savingHint}>Saving…</p>
                      ) : null}
                    </div>
                    {editable ? (
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => clearDefaultSlot(slot)}
                        disabled={isEmpty || pending}
                        aria-label={`Clear ${group.title}`}
                        title="Clear"
                      >
                        <span aria-hidden>×</span>
                      </button>
                    ) : null}
                  </li>
                );
              })}

              {visibleExtras.map((item: ExtraDailyItem) => {
                const isEmpty = !item.text.trim();
                const isSaving = savingKey === item.id && pending;
                return (
                  <li
                    key={item.id}
                    className={`${styles.slotRow} ${isEmpty && editable ? styles.slotEmpty : ""}`}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={item.done}
                      disabled={!editable || isEmpty || pending}
                      aria-label={`Mark extra ${group.title} done`}
                      onChange={(event) =>
                        toggleExtraDone(item.id, event.target.checked)
                      }
                    />
                    <div className={styles.slotFields}>
                      <input
                        ref={(node) => {
                          if (node) extraInputRefs.current.set(item.id, node);
                          else extraInputRefs.current.delete(item.id);
                        }}
                        className={`${styles.slotInput} ${item.done ? styles.slotDone : ""}`}
                        type="text"
                        value={item.text}
                        placeholder={group.placeholder}
                        disabled={!editable}
                        readOnly={!editable}
                        aria-label={group.placeholder}
                        onChange={(event) =>
                          setExtraLocal(item.id, event.target.value)
                        }
                        onBlur={(event) =>
                          saveExtra(item.id, event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                      />
                      {item.carryover_count > 0 ? (
                        <p className={styles.carryHint}>
                          Carried {item.carryover_count} day
                          {item.carryover_count === 1 ? "" : "s"}
                        </p>
                      ) : null}
                      {isSaving ? (
                        <p className={styles.savingHint}>Saving…</p>
                      ) : null}
                    </div>
                    {editable ? (
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => removeExtra(item.id)}
                        disabled={pending}
                        aria-label={`Remove ${group.title}`}
                        title="Remove"
                      >
                        <span aria-hidden>×</span>
                      </button>
                    ) : null}
                  </li>
                );
              })}

              {showMoreAffordance ? (
                <li className={styles.moreCapacityRow}>
                  <button
                    type="button"
                    className={styles.moreCapacityBtn}
                    onClick={expandCapacity}
                    aria-label={`Show ${hiddenEmptyCount} more empty ${group.title} slot${hiddenEmptyCount === 1 ? "" : "s"}`}
                  >
                    + {hiddenEmptyCount} more
                  </button>
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}

      <HabitManager
        date={localEntry.date}
        habits={habits}
        readOnly={!editable}
      />

      <ReminderManager entry={localEntry} readOnly={!editable} />
    </div>
  );
}
