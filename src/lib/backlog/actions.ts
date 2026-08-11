"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  openSlotsForSignificance,
  significanceForKind,
} from "@/lib/capture/placement";
import {
  clearSlot,
  getOrCreateTodayEntry,
  writeSlot,
} from "@/lib/daily/entry";
import { createClient } from "@/lib/supabase/server";
import type {
  BacklogTag,
  DailyItemKind,
  DailySlot,
  Significance,
} from "@/lib/types/database";

/** Quiet backlog capture — no significance, no today placement. */
export async function addToBacklog(text: string) {
  const user = await requireUser();
  const trimmed = text.trim();

  if (!trimmed) {
    return { ok: false as const, error: "Type something first." };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("backlog_items").insert({
    user_id: user.id,
    text: trimmed,
    normalized_text: trimmed.toLowerCase(),
    significance: null,
    tag: "task",
    target_date: null,
    ai_placement: null,
    promoted_to_entry_id: null,
    promoted_to_slot: null,
    last_touched_at: now,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    last_capture_at: now,
  });

  revalidatePath("/backlog");
  revalidatePath("/dashboard");
  return { ok: true as const };
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

export async function promoteToToday(
  itemId: string,
  input: {
    significance: Significance;
    kind: DailyItemKind;
  },
) {
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

  if (item.promoted_to_entry_id && item.promoted_to_slot) {
    await clearSlot(item.promoted_to_entry_id, item.promoted_to_slot);
  }

  const fresh = await getOrCreateTodayEntry(user.id);
  const target =
    openSlotsForSignificance(fresh, significanceForKind(input.kind))[0] ??
    null;

  if (!target) {
    const label =
      input.kind === "must_do"
        ? "Must-Do"
        : input.kind === "should_do"
          ? "Should-Do"
          : "Quick Win";
    return {
      ok: false as const,
      error: `${label} is full today.`,
    };
  }

  await writeSlot(entry.id, target, item.text);

  const { error: updateError } = await supabase
    .from("backlog_items")
    .update({
      significance: input.significance,
      promoted_to_entry_id: entry.id,
      promoted_to_slot: target,
      ai_placement: null,
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
  const kind =
    slot === "must_do"
      ? ("must_do" as const)
      : slot.startsWith("should_do")
        ? ("should_do" as const)
        : ("quick_win" as const);
  return promoteToToday(itemId, {
    significance: significanceForKind(kind),
    kind,
  });
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
