"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  clearSlot,
  findOpenSlot,
  getOrCreateTodayEntry,
  writeSlot,
} from "@/lib/daily/entry";
import { createClient } from "@/lib/supabase/server";
import type { BacklogTag, DailyEntry, DailySlot } from "@/lib/types/database";
import { slotTextColumn } from "@/lib/types/database";

function isSlotEmpty(entry: DailyEntry, slot: DailySlot): boolean {
  return !entry[slotTextColumn(slot)];
}

export async function updateBacklogItemText(itemId: string, text: string) {
  const user = await requireUser();
  const trimmed = text.trim();

  if (!trimmed) {
    return { ok: false as const, error: "Text can’t be empty." };
  }

  const supabase = await createClient();

  const { data: item, error: itemError } = await supabase
    .from("backlog_items")
    .select("promoted_to_entry_id, promoted_to_slot")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (itemError || !item) {
    return { ok: false as const, error: "Item not found." };
  }

  const { error } = await supabase
    .from("backlog_items")
    .update({
      text: trimmed,
      normalized_text: trimmed.toLowerCase(),
      last_touched_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (item.promoted_to_entry_id && item.promoted_to_slot) {
    await writeSlot(item.promoted_to_entry_id, item.promoted_to_slot, trimmed);
  }

  revalidatePath("/backlog");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function checkOffInPlace(itemId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("backlog_items")
    .select("promoted_to_entry_id, promoted_to_slot")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (item?.promoted_to_entry_id && item.promoted_to_slot) {
    await clearSlot(item.promoted_to_entry_id, item.promoted_to_slot);
  }

  const { error } = await supabase
    .from("backlog_items")
    .update({
      status: "done",
      last_touched_at: new Date().toISOString(),
      promoted_to_entry_id: null,
      promoted_to_slot: null,
      ai_placement: null,
    })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) throw error;
  revalidatePath("/backlog");
  revalidatePath("/dashboard");
}

export async function promoteToToday(itemId: string, preferredSlot?: DailySlot) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: item, error: itemError } = await supabase
    .from("backlog_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (itemError || !item) {
    return { ok: false as const, error: "Item not found." };
  }

  const entry = await getOrCreateTodayEntry(user.id);

  if (
    item.promoted_to_entry_id &&
    item.promoted_to_slot &&
    (item.promoted_to_entry_id !== entry.id ||
      item.promoted_to_slot !== preferredSlot)
  ) {
    await clearSlot(item.promoted_to_entry_id, item.promoted_to_slot);
  }

  const fresh = await getOrCreateTodayEntry(user.id);
  let target: DailySlot | null = null;

  if (preferredSlot && isSlotEmpty(fresh, preferredSlot)) {
    target = preferredSlot;
  } else {
    target = findOpenSlot(fresh, preferredSlot);
  }

  if (!target) {
    return { ok: false as const, error: "Today's dashboard slots are full." };
  }

  await writeSlot(entry.id, target, item.text);

  const { error: updateError } = await supabase
    .from("backlog_items")
    .update({
      promoted_to_entry_id: entry.id,
      promoted_to_slot: target,
      ai_placement: target,
      last_touched_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (updateError) {
    return { ok: false as const, error: updateError.message };
  }

  revalidatePath("/backlog");
  revalidatePath("/dashboard");
  return { ok: true as const, slot: target };
}

export async function retagItem(itemId: string, tag: BacklogTag) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("backlog_items")
    .update({
      tag,
      last_touched_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) throw error;
  revalidatePath("/backlog");
}

export async function moveToSlot(itemId: string, slot: DailySlot) {
  return promoteToToday(itemId, slot);
}

export async function sendBackToBacklog(itemId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: item, error: itemError } = await supabase
    .from("backlog_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (itemError || !item) throw itemError ?? new Error("Item not found");

  if (item.promoted_to_entry_id && item.promoted_to_slot) {
    await clearSlot(item.promoted_to_entry_id, item.promoted_to_slot);
  }

  const { error } = await supabase
    .from("backlog_items")
    .update({
      promoted_to_entry_id: null,
      promoted_to_slot: null,
      ai_placement: null,
      last_touched_at: new Date().toISOString(),
      status: "active",
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/backlog");
  revalidatePath("/dashboard");
}
