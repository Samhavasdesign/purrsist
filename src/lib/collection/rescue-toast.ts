import { createClient } from "@/lib/supabase/server";
import { dateKey, shiftDateKey } from "@/lib/daily/carryover";
import type { RescueToastPayload } from "@/lib/collection/rescue-toast-types";
import type { Cat, CatRescued, CatRescuedWithCat } from "@/lib/types/database";

export type { RescueToastPayload } from "@/lib/collection/rescue-toast-types";

function isMissingRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /Could not find the table/i.test(error.message ?? "")
  );
}

/** Monday (YYYY-MM-DD) of the Mon–Sun week containing `dateKeyValue`. */
export function mondayOfWeek(dateKeyValue: string): string {
  const [y, m, d] = dateKeyValue.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.getDay(); // 0 Sun … 6 Sat
  const offset = weekday === 0 ? 6 : weekday - 1;
  date.setDate(date.getDate() - offset);
  return dateKey(date);
}

/** Monday of the prior Mon–Sun week (always seven days before this week's Monday). */
export function lastWeekMonday(todayKey = dateKey(new Date())): string {
  return shiftDateKey(mondayOfWeek(todayKey), -7);
}

/**
 * Week the rescue toast may report on.
 * - Mon–Sat: last week's Monday (the week Sunday's recap already covered).
 * - Sunday: this week's Monday — Weekly Recap runs Sunday evening for the
 *   Mon–Sun week that ends today, so a same-day Today visit should still see it.
 */
export function eligibleRescueWeekStart(
  todayKey = dateKey(new Date()),
): string {
  const thisMonday = mondayOfWeek(todayKey);
  const [y, m, d] = todayKey.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  if (weekday === 0) return thisMonday;
  return shiftDateKey(thisMonday, -7);
}

function toPayload(rescue: CatRescued, cat: Cat): RescueToastPayload {
  return {
    rescueId: rescue.id,
    catId: cat.id,
    catName: cat.name,
    imageKey: cat.image_key || cat.name,
    weekStartDate: rescue.week_start_date,
  };
}

async function fetchCatById(catId: string): Promise<Cat | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cats")
    .select("id, sequence_order, name, image_key")
    .eq("id", catId)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) return null;
    console.error("fetchCatById:", error.message);
    return null;
  }
  return data as Cat | null;
}

/**
 * Prepare the one-time rescue toast for Today.
 *
 * - Shows at most one banner: the single most recent unacknowledged rescue
 *   for the eligible closed week (see eligibleRescueWeekStart).
 * - Older unacknowledged rescues are marked acknowledged without displaying
 *   (no stacking / no backfill).
 * - If that week has no CatRescued row, returns null — silence, never a miss message.
 * - Sets banner_shown_at on the shown rescue immediately so it never reappears.
 */
export async function prepareRescueToast(
  userId: string,
  todayKey = dateKey(new Date()),
): Promise<RescueToastPayload | null> {
  const supabase = await createClient();
  const eligibleWeek = eligibleRescueWeekStart(todayKey);

  const { data, error } = await supabase
    .from("cat_rescued")
    .select("id, user_id, cat_id, week_start_date, banner_shown_at, created_at")
    .eq("user_id", userId)
    .is("banner_shown_at", null)
    .lte("week_start_date", eligibleWeek)
    .order("week_start_date", { ascending: false });

  if (error) {
    if (isMissingRelation(error)) return null;
    console.error("prepareRescueToast:", error.message);
    return null;
  }

  const rows = (data ?? []) as CatRescued[];
  if (rows.length === 0) return null;

  const now = new Date().toISOString();
  const mostRecent = rows[0];
  const olderIds = rows.slice(1).map((row) => row.id);

  // Auto-ack older unacknowledged weeks without displaying them.
  if (olderIds.length > 0) {
    const { error: olderError } = await supabase
      .from("cat_rescued")
      .update({ banner_shown_at: now })
      .in("id", olderIds)
      .eq("user_id", userId)
      .is("banner_shown_at", null);
    if (olderError && !isMissingRelation(olderError)) {
      console.error("prepareRescueToast older ack:", olderError.message);
    }
  }

  // Only the eligible closed week — never backfill an older week as the toast.
  if (mostRecent.week_start_date !== eligibleWeek) {
    const { error: staleError } = await supabase
      .from("cat_rescued")
      .update({ banner_shown_at: now })
      .eq("id", mostRecent.id)
      .eq("user_id", userId)
      .is("banner_shown_at", null);
    if (staleError && !isMissingRelation(staleError)) {
      console.error("prepareRescueToast stale ack:", staleError.message);
    }
    return null;
  }

  const cat = await fetchCatById(mostRecent.cat_id);
  if (!cat) return null;

  // Acknowledge on first display so a refresh never re-shows this rescue.
  const { error: ackError } = await supabase
    .from("cat_rescued")
    .update({ banner_shown_at: now })
    .eq("id", mostRecent.id)
    .eq("user_id", userId)
    .is("banner_shown_at", null);

  if (ackError) {
    if (isMissingRelation(ackError)) return null;
    console.error("prepareRescueToast ack:", ackError.message);
    // Still show once this session — worse to swallow the payoff than risk a rare double.
  }

  return toPayload(mostRecent, cat);
}

/** Lifetime rescued-cat count for chrome (top-bar counter). */
export async function countRescuedCats(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("cat_rescued")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (isMissingRelation(error)) return 0;
    console.error("countRescuedCats:", error.message);
    return 0;
  }

  return count ?? 0;
}

/** Join helper for Collection / recap — not used by the toast path. */
export async function listRescuesWithCats(
  userId: string,
): Promise<CatRescuedWithCat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cat_rescued")
    .select("id, user_id, cat_id, week_start_date, banner_shown_at, created_at")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false });

  if (error) {
    if (isMissingRelation(error)) return [];
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CatRescued[];
  if (rows.length === 0) return [];

  const catIds = [...new Set(rows.map((row) => row.cat_id))];
  const { data: catsData, error: catsError } = await supabase
    .from("cats")
    .select("id, sequence_order, name, image_key")
    .in("id", catIds);

  if (catsError) {
    if (isMissingRelation(catsError)) return [];
    throw new Error(catsError.message);
  }

  const catsById = new Map(
    ((catsData ?? []) as Cat[]).map((cat) => [cat.id, cat]),
  );

  return rows.flatMap((row) => {
    const cat = catsById.get(row.cat_id);
    if (!cat) return [];
    return [{ ...row, cat }];
  });
}
