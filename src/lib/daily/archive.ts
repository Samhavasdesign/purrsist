import { createClient } from "@/lib/supabase/server";
import { normalizeDailyEntry } from "@/lib/daily/extra-items";
import { getUserTodayKey } from "@/lib/daily/today";
import type { DailyEntry } from "@/lib/types/database";

export type ArchiveDateOption = {
  date: string;
  locked: boolean;
  must_do_done: boolean;
  must_do_text: string | null;
};

export type ArchiveHabitCheck = {
  habit_id: string;
  name: string;
  done: boolean;
};

/** Lock every DailyEntry whose calendar date is before today (PRD §6 / §8). */
export async function ensurePastDaysLocked(
  userId: string,
  todayKey?: string,
): Promise<void> {
  const supabase = await createClient();
  const today = todayKey ?? (await getUserTodayKey(userId));

  const { error } = await supabase
    .from("daily_entries")
    .update({ locked: true })
    .eq("user_id", userId)
    .eq("locked", false)
    .lt("date", today);

  if (error) throw error;
}

export async function listArchiveDates(
  userId: string,
  todayKey?: string,
): Promise<ArchiveDateOption[]> {
  const supabase = await createClient();
  const today = todayKey ?? (await getUserTodayKey(userId));

  const { data, error } = await supabase
    .from("daily_entries")
    .select("date, locked, must_do_done, must_do_text")
    .eq("user_id", userId)
    .lt("date", today)
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ArchiveDateOption[];
}

export async function getDailyEntryByDate(
  userId: string,
  date: string,
): Promise<DailyEntry | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return normalizeDailyEntry(data as DailyEntry);
}

export async function listHabitChecksForDate(
  userId: string,
  date: string,
): Promise<ArchiveHabitCheck[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("habit_check_ins")
    .select("habit_id, done, habits(name)")
    .eq("user_id", userId)
    .eq("date", date);

  if (error) {
    if (
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      /Could not find the table/i.test(error.message)
    ) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const habits = row.habits as { name: string } | { name: string }[] | null;
    const name = Array.isArray(habits)
      ? (habits[0]?.name ?? "Habit")
      : (habits?.name ?? "Habit");
    return {
      habit_id: row.habit_id as string,
      name,
      done: Boolean(row.done),
    };
  });
}
