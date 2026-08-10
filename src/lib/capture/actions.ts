"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sortCapture } from "@/lib/ai/sort";
import {
  categoryLabelForSignificance,
  findOpenSlotForSignificance,
  kindForSignificance,
  openSlotsForSignificance,
} from "@/lib/capture/placement";
import { formatCaptureReason } from "@/lib/capture/reason";
import {
  getOrCreateTodayEntry,
  writeSlot,
} from "@/lib/daily/entry";
import {
  isMissingExtraItemsColumn,
  newExtraItem,
  notesPayloadWithExtras,
  readExtraItems,
} from "@/lib/daily/extra-items";
import { createClient } from "@/lib/supabase/server";
import type { DailySlot, Significance } from "@/lib/types/database";

export type CaptureResult = {
  ok: true;
  itemId: string;
  tag: string;
  placement: DailySlot | null;
  placedAsExtra: boolean;
  target_date: string | null;
  reason: string;
  usedAi: boolean;
  isFirstCapture: boolean;
};

async function appendExtraWithText(
  entryId: string,
  userId: string,
  significance: Significance,
  text: string,
  notes: string | null,
) {
  const kind = kindForSignificance(significance);
  const item = { ...newExtraItem(kind), text };
  const supabase = await createClient();
  const { data: entry, error: loadError } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (loadError || !entry) {
    return { ok: false as const, error: loadError?.message ?? "Entry not found" };
  }

  const extras = [...readExtraItems(entry), item];
  const { error } = await supabase
    .from("daily_entries")
    .update({ extra_items: extras })
    .eq("id", entryId)
    .eq("user_id", userId)
    .eq("locked", false);

  if (error && isMissingExtraItemsColumn(error)) {
    const { error: notesError } = await supabase
      .from("daily_entries")
      .update({ notes: notesPayloadWithExtras(notes, extras) })
      .eq("id", entryId)
      .eq("user_id", userId)
      .eq("locked", false);
    if (notesError) return { ok: false as const, error: notesError.message };
    return { ok: true as const };
  }

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function captureItem(input: {
  text: string;
  significance: Significance;
  /** Explicitly skip today and file to Backlog. */
  forceBacklog?: boolean;
}): Promise<CaptureResult | { ok: false; error: string }> {
  const user = await requireUser();
  const text = input.text.trim();
  if (!text) return { ok: false, error: "Type something first." };

  const forceBacklog = Boolean(input.forceBacklog);
  const supabase = await createClient();

  const { count: priorCount, error: countError } = await supabase
    .from("backlog_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    return { ok: false, error: countError.message };
  }

  const isFirstCapture = (priorCount ?? 0) === 0;

  const entry = await getOrCreateTodayEntry(user.id);
  const openSlots = forceBacklog
    ? []
    : openSlotsForSignificance(entry, input.significance);

  const sort = await sortCapture({
    text,
    significance: input.significance,
    openSlots,
    forceBacklog,
  });

  let placement = sort.placement;
  let placedAsExtra = false;

  if (forceBacklog) {
    placement = null;
  } else if (sort.target_date) {
    placement = null;
  } else {
    // Prefer significance-mapped open slot; otherwise overflow as an extra today item.
    const openInGroup =
      placement && openSlots.includes(placement)
        ? placement
        : findOpenSlotForSignificance(entry, input.significance);

    if (openInGroup) {
      placement = openInGroup;
    } else {
      placement = null;
      placedAsExtra = true;
    }
  }

  const category = categoryLabelForSignificance(input.significance);
  const reason = forceBacklog
    ? formatCaptureReason({
        tag: sort.tag,
        placement: null,
        target_date: sort.target_date,
      })
    : placedAsExtra
      ? `Sorted as ${sort.tag === "uncategorized" ? "Item" : sort.tag} → added to today's ${category}`
      : formatCaptureReason({
          tag: sort.tag,
          placement,
          target_date: sort.target_date,
        });

  const { data: item, error } = await supabase
    .from("backlog_items")
    .insert({
      user_id: user.id,
      text,
      normalized_text: text.toLowerCase().trim(),
      significance: input.significance,
      tag: sort.tag === "uncategorized" ? "task" : sort.tag,
      target_date: sort.target_date,
      ai_placement: placement,
      promoted_to_entry_id: placement || placedAsExtra ? entry.id : null,
      promoted_to_slot: placement,
    })
    .select("id")
    .single();

  if (error || !item) {
    return { ok: false, error: error?.message ?? "Could not save capture." };
  }

  if (placement) {
    await writeSlot(entry.id, placement, text);
  } else if (placedAsExtra) {
    const extraResult = await appendExtraWithText(
      entry.id,
      user.id,
      input.significance,
      text,
      entry.notes,
    );
    if (!extraResult.ok) {
      return { ok: false, error: extraResult.error };
    }
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    last_capture_at: new Date().toISOString(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/backlog");

  return {
    ok: true,
    itemId: item.id,
    tag: sort.tag,
    placement,
    placedAsExtra,
    target_date: sort.target_date,
    reason,
    usedAi: sort.usedAi,
    isFirstCapture,
  };
}
