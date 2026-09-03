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

/**
 * Databases that predate migration 20260811010000 still enforce NOT NULL on
 * significance, which rejects quiet captures outright.
 */
function isSignificanceNotNullViolation(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) return false;
  return error.code === "23502" && /significance/i.test(error.message ?? "");
}

/** Least-urgent bucket, used only when the column cannot hold NULL. */
const FALLBACK_SIGNIFICANCE: Significance = "green";

/** Quiet backlog capture — no significance, no today placement. */
export async function addToBacklog(text: string) {
  const user = await requireUser();
  const trimmed = text.trim();

  if (!trimmed) {
    return { ok: false as const, error: "Type something first." };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const row = {
    user_id: user.id,
    text: trimmed,
    normalized_text: trimmed.toLowerCase(),
    significance: null as Significance | null,
    tag: "task" as const,
    target_date: null,
    ai_placement: null,
    promoted_to_entry_id: null,
    promoted_to_slot: null,
    last_touched_at: now,
  };

  let { error } = await supabase.from("backlog_items").insert(row);

  if (isSignificanceNotNullViolation(error)) {
    ({ error } = await supabase
      .from("backlog_items")
      .insert({ ...row, significance: FALLBACK_SIGNIFICANCE }));
  }

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

/** Manual per-row archive — move an active backlog item into the Archive tab. */
export async function archiveBacklogItem(itemId: string) {
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
      status: "archived",
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

/** Reverse of archiveBacklogItem — move an archived item back to the Active tab. */
export async function unarchiveBacklogItem(itemId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("backlog_items")
    .update({
      status: "active",
      last_touched_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("status", "archived");

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

/**
 * A date-triggered reminder came due — drop it into today's first open slot,
 * trying Must-Do, then Should-Do, then Quick Win. Clears the target_date via
 * promoteToToday (which nulls ai_placement and re-homes the row onto the day).
 */
export async function landReminderOnToday(itemId: string) {
  const kinds: DailyItemKind[] = ["must_do", "should_do", "quick_win"];
  for (const kind of kinds) {
    const result = await promoteToToday(itemId, {
      significance: significanceForKind(kind),
      kind,
    });
    if (result.ok) return result;
  }
  return {
    ok: false as const,
    error: "Today's list is full — free up a slot, then add this.",
  };
}

/**
 * Dismiss a due reminder from the dashboard box: drop its target_date so it
 * rejoins the normal backlog under its tag instead of nagging every morning.
 */
export async function dismissDueReminder(itemId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("backlog_items")
    .update({
      target_date: null,
      last_touched_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/backlog");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
