"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isEditableEntry } from "@/lib/daily/entry-rules";
import {
  isMissingExtraItemsColumn,
  newExtraItem,
  notesPayloadWithExtras,
  readExtraItems,
  type DailyItemKind,
  type ExtraDailyItem,
} from "@/lib/daily/extra-items";
import {
  notesPayloadWithReminders,
  primaryReminderText,
} from "@/lib/daily/reminders";
import { markSectionFilledOnceIfNeeded } from "@/lib/daily/section-hints";
import {
  addHabitFallback,
  archiveHabitFallback,
  isMissingHabitsTable,
  removeHabitFallback,
  renameHabitFallback,
  setHabitCheckInFallback,
  unarchiveHabitFallback,
} from "@/lib/daily/habits-storage";
import { createClient } from "@/lib/supabase/server";
import type { DailyEntry, DailySlot } from "@/lib/types/database";
import {
  slotCarryoverColumn,
  slotDoneColumn,
  slotTextColumn,
} from "@/lib/types/database";

function revalidateDashboard() {
  revalidatePath("/dashboard");
  revalidatePath("/archive");
}

function revalidateHabits() {
  revalidateDashboard();
  revalidatePath("/habits");
}

async function requireEditableEntry(entryId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Entry not found");
  const entry = data as DailyEntry;
  if (!isEditableEntry(entry)) {
    throw new Error("Past days are read-only.");
  }
  return { supabase, entry };
}

async function saveExtraItems(
  entryId: string,
  userId: string,
  extras: ExtraDailyItem[],
  currentNotes?: string | null,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("daily_entries")
    .update({ extra_items: extras })
    .eq("id", entryId)
    .eq("user_id", userId)
    .eq("locked", false);

  if (error && isMissingExtraItemsColumn(error)) {
    // Migration not applied yet — persist in unused notes column.
    const { error: notesError } = await supabase
      .from("daily_entries")
      .update({ notes: notesPayloadWithExtras(currentNotes, extras) })
      .eq("id", entryId)
      .eq("user_id", userId)
      .eq("locked", false);

    if (notesError) return { ok: false as const, error: notesError.message };
    revalidateDashboard();
    return { ok: true as const, extras };
  }

  if (error) return { ok: false as const, error: error.message };
  revalidateDashboard();
  return { ok: true as const, extras };
}

export async function updateSlotText(
  entryId: string,
  slot: DailySlot,
  text: string,
) {
  const user = await requireUser();
  const { supabase, entry } = await requireEditableEntry(entryId, user.id);
  const col = slotTextColumn(slot);
  const trimmed = text.trim() || null;
  const countCol = slotCarryoverColumn(slot);

  const { error } = await supabase
    .from("daily_entries")
    .update({
      [col]: trimmed,
      ...(trimmed
        ? {}
        : { [slotDoneColumn(slot)]: false, [countCol]: 0 }),
    })
    .eq("id", entryId)
    .eq("user_id", user.id)
    .eq("locked", false);

  if (error) return { ok: false as const, error: error.message };

  let sectionHints = null;
  if (trimmed) {
    const nextEntry = { ...entry, [col]: trimmed } as DailyEntry;
    sectionHints = await markSectionFilledOnceIfNeeded(
      supabase,
      user.id,
      nextEntry,
      slot,
    );
  }

  revalidateDashboard();
  return { ok: true as const, sectionHints };
}

export async function updateSlotDone(
  entryId: string,
  slot: DailySlot,
  done: boolean,
) {
  const user = await requireUser();
  const { supabase } = await requireEditableEntry(entryId, user.id);
  const col = slotDoneColumn(slot);
  const countCol = slotCarryoverColumn(slot);

  const { error } = await supabase
    .from("daily_entries")
    .update({
      [col]: done,
      ...(done ? { [countCol]: 0 } : {}),
    })
    .eq("id", entryId)
    .eq("user_id", user.id)
    .eq("locked", false);

  if (error) return { ok: false as const, error: error.message };
  revalidateDashboard();
  return { ok: true as const };
}

export async function updateDailyReminders(
  entryId: string,
  reminders: { id: string; text: string }[],
) {
  const user = await requireUser();
  const { supabase, entry } = await requireEditableEntry(entryId, user.id);

  const next = reminders
    .map((item) => ({ id: item.id, text: item.text.trim() }))
    .filter((item) => item.text.length > 0);

  const primary = primaryReminderText(next);

  const { error } = await supabase
    .from("daily_entries")
    .update({
      daily_reminder: primary,
      notes: notesPayloadWithReminders(entry.notes, next),
    })
    .eq("id", entryId)
    .eq("user_id", user.id)
    .eq("locked", false);

  if (error) return { ok: false as const, error: error.message };
  revalidateDashboard();
  return { ok: true as const, reminders: next };
}

/** Append an overflow row beyond the default 1/2/3 slots. */
export async function addExtraDailyItem(
  entryId: string,
  kind: DailyItemKind,
  clientItem?: ExtraDailyItem,
) {
  const user = await requireUser();
  const { entry } = await requireEditableEntry(entryId, user.id);
  const item =
    clientItem && clientItem.kind === kind
      ? {
          ...clientItem,
          kind,
          text: clientItem.text ?? "",
          done: Boolean(clientItem.done),
          carryover_count: Number(clientItem.carryover_count ?? 0) || 0,
        }
      : newExtraItem(kind);
  const extras = [...readExtraItems(entry), item];
  return saveExtraItems(entryId, user.id, extras, entry.notes);
}

export async function updateExtraDailyItem(
  entryId: string,
  itemId: string,
  text: string,
) {
  const user = await requireUser();
  const { entry } = await requireEditableEntry(entryId, user.id);
  const trimmed = text.trim();
  let extras = readExtraItems(entry);

  if (!trimmed) {
    extras = extras.filter((item) => item.id !== itemId);
  } else {
    extras = extras.map((item) =>
      item.id === itemId
        ? { ...item, text: trimmed, done: item.done && Boolean(trimmed) }
        : item,
    );
  }

  return saveExtraItems(entryId, user.id, extras, entry.notes);
}

export async function updateExtraDailyItemDone(
  entryId: string,
  itemId: string,
  done: boolean,
) {
  const user = await requireUser();
  const { entry } = await requireEditableEntry(entryId, user.id);
  const extras = readExtraItems(entry).map((item) =>
    item.id === itemId
      ? { ...item, done, carryover_count: done ? 0 : item.carryover_count }
      : item,
  );
  return saveExtraItems(entryId, user.id, extras, entry.notes);
}

export async function removeExtraDailyItem(entryId: string, itemId: string) {
  const user = await requireUser();
  const { entry } = await requireEditableEntry(entryId, user.id);
  const extras = readExtraItems(entry).filter((item) => item.id !== itemId);
  return saveExtraItems(entryId, user.id, extras, entry.notes);
}

export async function addHabit(name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false as const, error: "Name required" };

  const supabase = await createClient();
  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name: trimmed,
    active: true,
  });

  if (error) {
    if (isMissingHabitsTable(error)) {
      const fallback = await addHabitFallback(user.id, trimmed);
      if (!fallback.ok) return fallback;
      revalidateHabits();
      return { ok: true as const };
    }
    return { ok: false as const, error: error.message };
  }
  revalidateHabits();
  return { ok: true as const };
}

export async function renameHabit(habitId: string, name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false as const, error: "Name required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("habits")
    .update({ name: trimmed })
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) {
    if (isMissingHabitsTable(error)) {
      const fallback = await renameHabitFallback(user.id, habitId, trimmed);
      if (!fallback.ok) return fallback;
      revalidateHabits();
      return { ok: true as const };
    }
    return { ok: false as const, error: error.message };
  }
  revalidateHabits();
  return { ok: true as const };
}

export async function archiveHabit(habitId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("habits")
    .update({ active: false, archived_at: new Date().toISOString() })
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) {
    if (isMissingHabitsTable(error)) {
      const fallback = await archiveHabitFallback(user.id, habitId);
      if (!fallback.ok) return { ok: false as const, error: fallback.error };
      revalidateHabits();
      return { ok: true as const };
    }
    return { ok: false as const, error: error.message };
  }
  revalidateHabits();
  return { ok: true as const };
}

/** Restore an archived habit to today's checklist. Past check-ins are unchanged. */
export async function unarchiveHabit(habitId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("habits")
    .update({ active: true, archived_at: null })
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) {
    if (isMissingHabitsTable(error)) {
      const fallback = await unarchiveHabitFallback(user.id, habitId);
      if (!fallback.ok) return { ok: false as const, error: fallback.error };
      revalidateHabits();
      return { ok: true as const };
    }
    return { ok: false as const, error: error.message };
  }
  revalidateHabits();
  return { ok: true as const };
}

/** Permanently remove a habit. Past check-ins cascade-delete. Prefer archive. */
export async function removeHabit(habitId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) {
    if (isMissingHabitsTable(error)) {
      const fallback = await removeHabitFallback(user.id, habitId);
      if (!fallback.ok) return { ok: false as const, error: fallback.error };
      revalidateHabits();
      return { ok: true as const };
    }
    return { ok: false as const, error: error.message };
  }
  revalidateHabits();
  return { ok: true as const };
}

export async function setHabitCheckIn(
  habitId: string,
  date: string,
  done: boolean,
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("habit_check_ins").upsert(
    {
      habit_id: habitId,
      user_id: user.id,
      date,
      done,
    },
    { onConflict: "habit_id,date" },
  );

  if (error) {
    if (isMissingHabitsTable(error)) {
      const fallback = await setHabitCheckInFallback(
        user.id,
        habitId,
        date,
        done,
      );
      if (!fallback.ok) throw new Error(fallback.error);
      revalidateHabits();
      return;
    }
    throw error;
  }
  revalidateHabits();
}
