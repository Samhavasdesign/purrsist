"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  addExtraDailyItem,
  removeExtraDailyItem,
  reorderDailyItems,
  updateExtraDailyItem,
  updateExtraDailyItemDone,
  updateSlotDone,
  updateSlotText,
  type ReorderExtraEntry,
  type ReorderSlotEntry,
} from "@/lib/daily/actions";
import { AddToBacklog } from "@/components/daily/add-to-backlog";
import { DueReminders } from "@/components/daily/due-reminders";
import { EndOfDayNudge } from "@/components/daily/end-of-day-nudge";
import { HabitManager } from "@/components/daily/habit-manager";
import { ReminderManager } from "@/components/daily/reminder-manager";
import { RescueToast } from "@/components/daily/rescue-toast";
import { SectionPulseContext } from "@/components/daily/section-pulse-context";
import { SortableTodoRow, TodoRow } from "@/components/daily/todo-row";
import {
  WinPayoff,
  type WinPayoffVariant,
} from "@/components/daily/win-payoff";
import { PlusIcon } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import type { DueReminder } from "@/lib/backlog/due-reminders";
import type { RescueToastPayload } from "@/lib/collection/rescue-toast-types";
import { isEditableEntry, formatShortDate } from "@/lib/daily/entry-rules";
import {
  extrasForKind,
  KIND_LABELS,
  KIND_LABELS_PLURAL,
  newExtraItem,
  parseExtraItems,
  type DailyItemKind,
} from "@/lib/daily/extra-items";
import {
  isHabitsComplete,
  isSectionComplete,
  isSheetComplete,
} from "@/lib/daily/section-complete";
import {
  hintVisibleForKind,
  kindForSlot,
  sectionAtDefaultCapacity,
  type SectionHintFlags,
} from "@/lib/daily/section-hints";
import { SECTION_SUBCOPY } from "@/lib/daily/section-subcopy";
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
  /** Date-triggered backlog items whose target date has arrived. */
  dueReminders?: DueReminder[];
  /** One-time stray rescue payoff — never a counter or streak. */
  rescueToast?: RescueToastPayload | null;
};

const GROUPS: {
  title: string;
  itemLabel: string;
  hint: string;
  kind: DailyItemKind;
  significance: "red" | "yellow" | "green";
  slots: DailySlot[];
  addLabel: string;
}[] = [
  {
    title: KIND_LABELS_PLURAL.must_do,
    itemLabel: KIND_LABELS.must_do,
    hint: SECTION_SUBCOPY.mustDo,
    kind: "must_do",
    significance: "red",
    slots: ["must_do"],
    addLabel: "Add Must-Do",
  },
  {
    title: KIND_LABELS_PLURAL.should_do,
    itemLabel: KIND_LABELS.should_do,
    hint: SECTION_SUBCOPY.shouldDos,
    kind: "should_do",
    significance: "yellow",
    slots: ["should_do_1", "should_do_2"],
    addLabel: "Add Should-Do",
  },
  {
    title: KIND_LABELS_PLURAL.quick_win,
    itemLabel: KIND_LABELS.quick_win,
    hint: SECTION_SUBCOPY.quickWins,
    kind: "quick_win",
    significance: "green",
    slots: ["quick_win_1", "quick_win_2", "quick_win_3"],
    addLabel: "Add Quick Win",
  },
];

/** Shared placeholder for empty / editable slot inputs. */
function slotPlaceholder(_kind: DailyItemKind, _index: number): string {
  return "Type here...";
}

/** A filled default slot or extra, in current display order — the unit that drag-reorder moves. */
type OrderableItem =
  | { key: string; kind: "slot"; slot: DailySlot; text: string; done: boolean; carry: number }
  | { key: string; kind: "extra"; id: string; text: string; done: boolean; carry: number };

/**
 * Which slots/extras count as "filled", based on server-committed data only.
 * Rows are grouped into the draggable list vs. the empty-placeholder list by
 * this, not by the live typing buffer — otherwise the first keystroke into an
 * empty field flips it into a differently-keyed row and remounts the input
 * mid-edit, dropping focus after one character.
 */
function computeFilledSlots(source: DailyEntry): Set<DailySlot> {
  const allSlots = GROUPS.flatMap((group) => group.slots);
  return new Set(
    allSlots.filter((slot) => String(source[slotTextColumn(slot)] ?? "").trim()),
  );
}

function computeFilledExtraIds(source: DailyEntry): Set<string> {
  return new Set(
    parseExtraItems(source.extra_items)
      .filter((item) => item.text.trim())
      .map((item) => item.id),
  );
}

export function DailyDashboard({
  entry,
  habits,
  sectionHints: initialSectionHints,
  dueReminders = [],
  rescueToast = null,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [localEntry, setLocalEntry] = useState(() => ({
    ...entry,
    extra_items: parseExtraItems(entry.extra_items),
  }));
  const [sectionHints, setSectionHints] = useState(initialSectionHints);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [winPayoff, setWinPayoff] = useState<WinPayoffVariant | null>(null);
  const [habitsComplete, setHabitsComplete] = useState(() =>
    isHabitsComplete(habits),
  );
  const [pulsingKind, setPulsingKind] = useState<DailyItemKind | null>(null);
  const pulseClearTimer = useRef<number | null>(null);
  const [expandedCapacity, setExpandedCapacity] = useState(
    () => new Set<DailyItemKind>(),
  );
  /** Empty default slots the user dismissed with X — restored by + before adding extras. */
  const [suppressedEmptySlots, setSuppressedEmptySlots] = useState(
    () => new Set<DailySlot>(),
  );
  // Slot names and extra item ids share this set — only the checkbox
  // actually being saved shows a pending state, not every checkbox on the page.
  const [pendingDoneKeys, setPendingDoneKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [committedFilledSlots, setCommittedFilledSlots] = useState(() =>
    computeFilledSlots(entry),
  );
  const [committedFilledExtraIds, setCommittedFilledExtraIds] = useState(() =>
    computeFilledExtraIds(entry),
  );
  const dirtySlots = useRef(new Set<DailySlot>());
  const dirtyDoneSlots = useRef(new Set<DailySlot>());
  const dirtyExtras = useRef(new Set<string>());
  const prevComplete = useRef<Record<DailyItemKind, boolean> | null>(null);
  const slotInputRefs = useRef(new Map<DailySlot, HTMLInputElement>());
  const extraInputRefs = useRef(new Map<string, HTMLInputElement>());
  const focusEmptyKind = useRef<DailyItemKind | null>(null);
  const focusExtraId = useRef<string | null>(null);
  const focusSlot = useRef<DailySlot | null>(null);
  // Frozen at drag start so a concurrent update elsewhere (typing, a toggle,
  // a server revalidation) mid-gesture can't shift what onDragEnd redistributes.
  const dragSnapshot = useRef<OrderableItem[] | null>(null);
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

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

      for (const slot of dirtyDoneSlots.current) {
        const doneCol = slotDoneColumn(slot);
        const countCol = slotCarryoverColumn(slot);
        (next as Record<string, unknown>)[doneCol] = prev[doneCol];
        (next as Record<string, unknown>)[countCol] = prev[countCol];
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
    setCommittedFilledSlots(computeFilledSlots(entry));
    setCommittedFilledExtraIds(computeFilledExtraIds(entry));
  }, [entry]);

  useEffect(() => {
    setSectionHints(initialSectionHints);
  }, [initialSectionHints]);

  useEffect(() => {
    return () => {
      if (pulseClearTimer.current !== null) {
        window.clearTimeout(pulseClearTimer.current);
      }
    };
  }, []);

  function pulseSection(kind: DailyItemKind) {
    if (pulseClearTimer.current !== null) {
      window.clearTimeout(pulseClearTimer.current);
      pulseClearTimer.current = null;
    }
    // Drop the class first so a second capture into the same section restarts.
    setPulsingKind(null);
    requestAnimationFrame(() => {
      setPulsingKind(kind);
      pulseClearTimer.current = window.setTimeout(() => {
        setPulsingKind(null);
        pulseClearTimer.current = null;
      }, 280);
    });
  }

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

    let sectionJustCompleted = false;
    for (const kind of Object.keys(sectionCompleteByKind) as DailyItemKind[]) {
      if (!prevComplete.current[kind] && sectionCompleteByKind[kind]) {
        sectionJustCompleted = true;
      }
    }

    prevComplete.current = { ...sectionCompleteByKind };

    if (!sectionJustCompleted) return;

    const sheetDone = isSheetComplete(localEntry, {
      count: habits.length,
      complete: habitsComplete,
    });
    setWinPayoff(sheetDone ? "sheet" : "module");
  }, [
    sectionCompleteByKind.must_do,
    sectionCompleteByKind.should_do,
    sectionCompleteByKind.quick_win,
    localEntry,
    habits.length,
    habitsComplete,
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
    setHabitsComplete(isHabitsComplete(habits));
    setWinPayoff(null);
    setExpandedCapacity(new Set());
    setSuppressedEmptySlots(new Set());
  }, [entry.id]);

  useEffect(() => {
    const extraId = focusExtraId.current;
    if (extraId) {
      focusExtraId.current = null;
      window.setTimeout(() => extraInputRefs.current.get(extraId)?.focus(), 30);
      return;
    }

    const slot = focusSlot.current;
    if (slot) {
      focusSlot.current = null;
      window.setTimeout(() => slotInputRefs.current.get(slot)?.focus(), 30);
      return;
    }

    const kind = focusEmptyKind.current;
    if (!kind) return;
    focusEmptyKind.current = null;
    const group = GROUPS.find((g) => g.kind === kind);
    if (!group) return;
    const firstEmpty = group.slots.find(
      (s) =>
        !suppressedEmptySlots.has(s) &&
        !String(localEntry[slotTextColumn(s)] ?? "").trim(),
    );
    if (!firstEmpty) return;
    window.setTimeout(() => slotInputRefs.current.get(firstEmpty)?.focus(), 30);
  }, [expandedCapacity, localEntry, suppressedEmptySlots]);

  function markDonePending(key: string) {
    setPendingDoneKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  function clearDonePending(key: string) {
    setPendingDoneKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  // Scoped to the one row actually saving/toggling — never the whole page.
  function isRowBusy(key: string) {
    return (savingKey === key && pending) || pendingDoneKeys.has(key);
  }

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
    if (text.trim()) {
      setSuppressedEmptySlots((prev) => {
        if (!prev.has(slot)) return prev;
        const next = new Set(prev);
        next.delete(slot);
        return next;
      });
    }
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
    dirtyDoneSlots.current.add(slot);
    markDonePending(slot);
    setLocalEntry((prev) => ({
      ...prev,
      [col]: done,
      ...(done ? { [countCol]: 0 } : {}),
    }));
    startTransition(async () => {
      const result = await updateSlotDone(localEntry.id, slot, done);
      dirtyDoneSlots.current.delete(slot);
      clearDonePending(slot);
      if (!result.ok) {
        setError(result.error);
        setLocalEntry((prev) => ({ ...prev, [col]: !done }));
      }
    });
  }

  function addExtra(kind: DailyItemKind) {
    if (!editable) return;
    setError(null);

    const group = GROUPS.find((g) => g.kind === kind);
    const restored = group?.slots.find((slot) =>
      suppressedEmptySlots.has(slot),
    );
    if (restored) {
      setSuppressedEmptySlots((prev) => {
        const next = new Set(prev);
        next.delete(restored);
        return next;
      });
      focusSlot.current = restored;
      return;
    }

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

  function suppressEmptySlot(slot: DailySlot) {
    if (!editable) return;
    const text = String(localEntry[slotTextColumn(slot)] ?? "").trim();
    if (text) {
      clearDefaultSlot(slot);
      return;
    }
    setSuppressedEmptySlots((prev) => {
      const next = new Set(prev);
      next.add(slot);
      return next;
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
    dirtyExtras.current.add(itemId);
    markDonePending(itemId);
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
      dirtyExtras.current.delete(itemId);
      clearDonePending(itemId);
      if (!result.ok) {
        setError(result.error);
        setLocalEntry((prev) => ({
          ...prev,
          extra_items: parseExtraItems(prev.extra_items).map((item) =>
            item.id === itemId ? { ...item, done: !done } : item,
          ),
        }));
      } else if (result.extras) {
        setLocalEntry((prev) => ({ ...prev, extra_items: result.extras }));
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

  function clearExtra(itemId: string) {
    if (!editable) return;
    setExtraLocal(itemId, "");
    saveExtra(itemId, "");
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

  function handleDragEnd(fallbackItems: OrderableItem[], event: DragEndEvent) {
    if (!editable) return;
    const items = dragSnapshot.current ?? fallbackItems;
    dragSnapshot.current = null;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.key === active.id);
    const newIndex = items.findIndex((item) => item.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Containers (slot columns / extra ids) keep their position — only the
    // task content they hold gets reshuffled into the new priority order.
    const contents = items.map((item) => ({
      text: item.text,
      done: item.done,
      carry: item.carry,
    }));
    const reordered = arrayMove(contents, oldIndex, newIndex);

    const slotUpdates: ReorderSlotEntry[] = [];
    const extraUpdates: ReorderExtraEntry[] = [];
    items.forEach((container, index) => {
      const content = reordered[index];
      if (container.kind === "slot") {
        slotUpdates.push({
          slot: container.slot,
          text: content.text,
          done: content.done,
          carryover_count: content.carry,
        });
      } else {
        extraUpdates.push({
          id: container.id,
          text: content.text,
          done: content.done,
          carryover_count: content.carry,
        });
      }
    });

    setError(null);
    const snapshot = localEntry;
    for (const row of slotUpdates) {
      dirtySlots.current.add(row.slot);
      dirtyDoneSlots.current.add(row.slot);
    }
    for (const row of extraUpdates) {
      dirtyExtras.current.add(row.id);
    }

    setLocalEntry((prev) => {
      const next = { ...prev } as Record<string, unknown> as DailyEntry;
      for (const row of slotUpdates) {
        (next as Record<string, unknown>)[slotTextColumn(row.slot)] = row.text;
        (next as Record<string, unknown>)[slotDoneColumn(row.slot)] = row.done;
        (next as Record<string, unknown>)[slotCarryoverColumn(row.slot)] =
          row.carryover_count;
      }
      if (extraUpdates.length > 0) {
        const patchById = new Map(extraUpdates.map((row) => [row.id, row]));
        next.extra_items = parseExtraItems(prev.extra_items).map((item) => {
          const patch = patchById.get(item.id);
          if (!patch) return item;
          return {
            ...item,
            text: patch.text,
            done: patch.done,
            carryover_count: patch.carryover_count,
          };
        });
      }
      return next;
    });

    startTransition(async () => {
      const result = await reorderDailyItems(
        snapshot.id,
        slotUpdates,
        extraUpdates,
      );
      for (const row of slotUpdates) {
        dirtySlots.current.delete(row.slot);
        dirtyDoneSlots.current.delete(row.slot);
      }
      for (const row of extraUpdates) {
        dirtyExtras.current.delete(row.id);
      }
      if (!result.ok) {
        setError(result.error);
        setLocalEntry(snapshot);
      }
    });
  }

  return (
    <SectionPulseContext.Provider value={{ pulseSection }}>
    <div className={styles.dashboard}>
      {rescueToast ? <RescueToast rescue={rescueToast} /> : null}

      <header className={styles.header}>
        <span className={styles.dateTag}>{formatShortDate(localEntry.date)}</span>
        <h1 className={styles.title}>Today&apos;s To-Dos</h1>
      </header>

      {editable ? <AddToBacklog /> : null}

      {editable ? <EndOfDayNudge entry={localEntry} /> : null}
      {!editable ? (
        <p className={styles.lockedNote}>
          This day is locked and view-only. Browse it in{" "}
          <Link className={styles.lockedLink} href="/backlog?tab=archived">
            Backlog → Archived
          </Link>
          .
        </p>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <WinPayoff
        active={winPayoff !== null}
        variant={winPayoff ?? "module"}
        onDone={() => {
          setWinPayoff(null);
        }}
      />

      <DueReminders reminders={dueReminders} readOnly={!editable} />

      {/* eslint-disable-next-line react-hooks/refs -- registerInputNode callbacks
          are passed to TodoRow/SortableTodoRow as props and attached to `ref`
          there; the compiler rule doesn't trace ref-callbacks across a
          component boundary, but this is the standard, correct pattern for
          collecting DOM node refs owned by the parent (focus-after-add). */}
      {GROUPS.map((group) => {
        const extras = extrasForKind(localEntry, group.kind);
        const sectionComplete = sectionCompleteByKind[group.kind];
        const capacityExpanded = expandedCapacity.has(group.kind);
        const emptySlots = group.slots.filter(
          (slot) =>
            !committedFilledSlots.has(slot) && !suppressedEmptySlots.has(slot),
        );
        const filledExtras = extras.filter((item) =>
          committedFilledExtraIds.has(item.id),
        );
        const emptyExtras = extras.filter(
          (item) => !committedFilledExtraIds.has(item.id),
        );
        const hiddenEmptyCount = capacityExpanded ? 0 : emptyExtras.length;
        const showMoreAffordance =
          editable && !capacityExpanded && hiddenEmptyCount > 0;

        function placeholderForSlot(slot: DailySlot): string {
          return slotPlaceholder(group.kind, group.slots.indexOf(slot) + 1);
        }

        function placeholderForExtra(id: string): string {
          const extraIndex = extras.findIndex((item) => item.id === id);
          return slotPlaceholder(
            group.kind,
            group.slots.length + Math.max(extraIndex, 0) + 1,
          );
        }

        // Filled items (defaults + extras), in priority order — draggable.
        // Empty slots/drafts render separately below, for adding new items.
        const orderableItems: OrderableItem[] = [
          ...group.slots
            .filter((slot) => committedFilledSlots.has(slot))
            .map((slot) => ({
              key: `slot:${slot}`,
              kind: "slot" as const,
              slot,
              text: String(localEntry[slotTextColumn(slot)] ?? ""),
              done: Boolean(localEntry[slotDoneColumn(slot)]),
              carry: Number(localEntry[slotCarryoverColumn(slot)] ?? 0),
            })),
          ...filledExtras.map((item) => ({
            key: `extra:${item.id}`,
            kind: "extra" as const,
            id: item.id,
            text: item.text,
            done: item.done,
            carry: item.carryover_count,
          })),
        ];

        const visibleEmptyExtras = capacityExpanded ? emptyExtras : [];
        const sectionRowCount =
          orderableItems.length + emptySlots.length + visibleEmptyExtras.length;
        const canClearRow = sectionRowCount > 1;

        function expandCapacity() {
          focusEmptyKind.current = group.kind;
          expandKind(group.kind);
        }

        return (
          <section
            key={group.title}
            className={[
              styles.section,
              styles[`section_${group.significance}`],
              sectionComplete ? styles.sectionComplete : "",
              pulsingKind === group.kind ? styles.sectionPulse : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className={styles.sectionHead}>
              <div className={styles.sectionTitleRow}>
                <div className={styles.sectionTitleCluster}>
                  <div className={styles.sectionTitleMain}>
                    <h2 className={styles.sectionTitle}>{group.title}</h2>
                    {hintVisibleForKind(sectionHints, group.kind) ? (
                      <p className={styles.sectionHint}>{group.hint}</p>
                    ) : null}
                  </div>
                </div>
                {editable ? (
                  <IconButton
                    label={group.addLabel}
                    icon={<PlusIcon />}
                    iconSize={20}
                    className={styles.addSlotBtn}
                    onClick={() => addExtra(group.kind)}
                    title={group.addLabel}
                  />
                ) : null}
              </div>
            </div>
            <ul className={styles.slotList}>
              <DndContext
                id={`dnd-${group.kind}`}
                sensors={dragSensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragStart={() => {
                  dragSnapshot.current = orderableItems;
                }}
                onDragEnd={(event) => handleDragEnd(orderableItems, event)}
              >
                <SortableContext
                  items={orderableItems.map((item) => item.key)}
                  strategy={verticalListSortingStrategy}
                >
                  {orderableItems.map((item) => (
                    <SortableTodoRow
                      key={item.key}
                      id={item.key}
                      dragDisabled={orderableItems.length <= 1}
                      text={item.text}
                      done={item.done}
                      carry={item.carry}
                      isEmpty={false}
                      isSaving={
                        item.kind === "slot"
                          ? savingKey === item.slot && pending
                          : savingKey === item.id && pending
                      }
                      editable={editable}
                      checkboxDisabled={!editable}
                      checkboxLabel={
                        item.kind === "slot"
                          ? `Mark ${group.itemLabel} done`
                          : `Mark extra ${group.itemLabel} done`
                      }
                      placeholder={
                        item.kind === "slot"
                          ? placeholderForSlot(item.slot)
                          : placeholderForExtra(item.id)
                      }
                      inputLabel={
                        item.kind === "slot"
                          ? placeholderForSlot(item.slot)
                          : placeholderForExtra(item.id)
                      }
                      registerInputNode={(node) => {
                        if (item.kind === "slot") {
                          if (node) slotInputRefs.current.set(item.slot, node);
                          else slotInputRefs.current.delete(item.slot);
                        } else {
                          if (node) extraInputRefs.current.set(item.id, node);
                          else extraInputRefs.current.delete(item.id);
                        }
                      }}
                      onToggle={(checked) =>
                        item.kind === "slot"
                          ? toggleDone(item.slot, checked)
                          : toggleExtraDone(item.id, checked)
                      }
                      onTextChange={(text) =>
                        item.kind === "slot"
                          ? setTextLocal(item.slot, text)
                          : setExtraLocal(item.id, text)
                      }
                      onTextBlur={(text) =>
                        item.kind === "slot"
                          ? saveText(item.slot, text)
                          : saveExtra(item.id, text)
                      }
                      onRemove={() => {
                        if (item.kind === "slot") {
                          clearDefaultSlot(item.slot);
                          return;
                        }
                        if (canClearRow) removeExtra(item.id);
                        else clearExtra(item.id);
                      }}
                      removeDisabled={isRowBusy(
                        item.kind === "slot" ? item.slot : item.id,
                      )}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {emptySlots.map((slot) => (
                <TodoRow
                  key={slot}
                  text={String(localEntry[slotTextColumn(slot)] ?? "")}
                  done={false}
                  carry={0}
                  isEmpty
                  isSaving={savingKey === slot && pending}
                  editable={editable}
                  checkboxDisabled
                  checkboxLabel={`Mark ${group.itemLabel} done`}
                  placeholder={placeholderForSlot(slot)}
                  inputLabel={placeholderForSlot(slot)}
                  registerInputNode={(node) => {
                    if (node) slotInputRefs.current.set(slot, node);
                    else slotInputRefs.current.delete(slot);
                  }}
                  onToggle={() => {}}
                  onTextChange={(text) => setTextLocal(slot, text)}
                  onTextBlur={(text) => saveText(slot, text)}
                  onRemove={() => {
                    if (canClearRow) suppressEmptySlot(slot);
                    else clearDefaultSlot(slot);
                  }}
                  removeDisabled={isRowBusy(slot)}
                />
              ))}

              {capacityExpanded
                ? emptyExtras.map((item) => (
                    <TodoRow
                      key={item.id}
                      text={item.text}
                      done={false}
                      carry={0}
                      isEmpty
                      isSaving={savingKey === item.id && pending}
                      editable={editable}
                      checkboxDisabled
                      checkboxLabel={`Mark extra ${group.itemLabel} done`}
                      placeholder={placeholderForExtra(item.id)}
                      inputLabel={placeholderForExtra(item.id)}
                      registerInputNode={(node) => {
                        if (node) extraInputRefs.current.set(item.id, node);
                        else extraInputRefs.current.delete(item.id);
                      }}
                      onToggle={() => {}}
                      onTextChange={(text) => setExtraLocal(item.id, text)}
                      onTextBlur={(text) => saveExtra(item.id, text)}
                      onRemove={() => {
                        if (canClearRow) removeExtra(item.id);
                        else clearExtra(item.id);
                      }}
                      removeDisabled={isRowBusy(item.id)}
                    />
                  ))
                : null}

              {showMoreAffordance ? (
                <li className={styles.moreCapacityRow}>
                  <Button
                    type="button"
                    variant="secondary"
                    className={styles.moreCapacityBtn}
                    onClick={expandCapacity}
                    aria-label={`Show ${hiddenEmptyCount} more empty ${group.itemLabel} slot${hiddenEmptyCount === 1 ? "" : "s"}`}
                  >
                    + {hiddenEmptyCount} more
                  </Button>
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}

      <hr className={styles.sectionRule} />

      <HabitManager
        date={localEntry.date}
        habits={habits}
        readOnly={!editable}
        onHabitsCompleteChange={setHabitsComplete}
        onSectionWin={() => {
          const sheetDone = isSheetComplete(localEntry, {
            count: habits.length,
            complete: true,
          });
          setWinPayoff(sheetDone ? "sheet" : "module");
        }}
      />

      <hr className={styles.sectionRule} />

      <ReminderManager entry={localEntry} readOnly={!editable} />

      <Link href="/archive" className={styles.archiveLink}>
        View past days
      </Link>
    </div>
    </SectionPulseContext.Provider>
  );
}
