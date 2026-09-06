"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { removeExtraDailyItem, updateSlotText } from "@/lib/daily/actions";
import { isEditableEntry } from "@/lib/daily/entry-rules";
import { readExtraItems } from "@/lib/daily/extra-items";
import { createClient } from "@/lib/supabase/server";
import type {
  BacklogStatus,
  DailyEntry,
  DailySlot,
  Significance,
} from "@/lib/types/database";
import { slotTextColumn } from "@/lib/types/database";

/** A stagnant task to resolve, addressed the same way the dashboard renders it. */
export type StagnantTarget =
  | { source: "slot"; slot: DailySlot }
  | { source: "extra"; id: string };

type ResolveResult = { ok: true } | { ok: false; error: string };

/**
 * Databases that predate migration 20260811010000 still enforce NOT NULL on
 * significance — same guard the backlog capture path uses.
 */
function isSignificanceNotNullViolation(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) return false;
  return error.code === "23502" && /significance/i.test(error.message ?? "");
}

const FALLBACK_SIGNIFICANCE: Significance = "green";

async function loadEditableEntry(entryId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, error: "Entry not found." };
  const entry = data as DailyEntry;
  if (!isEditableEntry(entry)) {
    return { ok: false as const, error: "Past days are read-only." };
  }
  return { ok: true as const, supabase, entry };
}

function taskTextForTarget(entry: DailyEntry, target: StagnantTarget): string {
  if (target.source === "slot") {
    return String(entry[slotTextColumn(target.slot)] ?? "").trim();
  }
  const extra = readExtraItems(entry).find((item) => item.id === target.id);
  return (extra?.text ?? "").trim();
}

/**
 * Move a stagnant task off today's list and into the backlog. The backlog row
 * is written first so the task survives even if clearing the slot fails; then
 * the slot/extra is emptied via the same actions the dashboard uses.
 */
async function resolveStagnantTask(
  entryId: string,
  target: StagnantTarget,
  status: Extract<BacklogStatus, "active" | "archived">,
): Promise<ResolveResult> {
  const user = await requireUser();
  const loaded = await loadEditableEntry(entryId, user.id);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { supabase, entry } = loaded;

  const text = taskTextForTarget(entry, target);
  if (!text) return { ok: false, error: "Task not found." };

  const now = new Date().toISOString();
  const row = {
    user_id: user.id,
    text,
    normalized_text: text.toLowerCase(),
    significance: null as Significance | null,
    tag: "task" as const,
    target_date: null,
    ai_placement: null,
    promoted_to_entry_id: null,
    promoted_to_slot: null,
    status,
    last_touched_at: now,
  };

  let { error } = await supabase.from("backlog_items").insert(row);
  if (isSignificanceNotNullViolation(error)) {
    ({ error } = await supabase
      .from("backlog_items")
      .insert({ ...row, significance: FALLBACK_SIGNIFICANCE }));
  }
  if (error) return { ok: false as const, error: error.message };

  const cleared =
    target.source === "slot"
      ? await updateSlotText(entryId, target.slot, "")
      : await removeExtraDailyItem(entryId, target.id);

  if (!cleared.ok) return { ok: false as const, error: cleared.error };

  revalidatePath("/dashboard");
  revalidatePath("/backlog");
  return { ok: true as const };
}

/** "Save in backlog" — keep the stagnant task for later in the active backlog. */
export async function saveStagnantToBacklog(
  entryId: string,
  target: StagnantTarget,
) {
  return resolveStagnantTask(entryId, target, "active");
}

/** "Archive" — send the stagnant task straight to Backlog → Archived. */
export async function archiveStagnantTask(
  entryId: string,
  target: StagnantTarget,
) {
  return resolveStagnantTask(entryId, target, "archived");
}
