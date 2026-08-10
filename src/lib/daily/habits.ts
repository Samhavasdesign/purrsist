import { createClient } from "@/lib/supabase/server";
import {
  listHabitsFallback,
  listHabitsForDateFallback,
} from "@/lib/daily/habits-storage";
import type { Habit, HabitWithCheckIn } from "@/lib/types/database";

function isMissingRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /Could not find the table/i.test(error.message ?? "")
  );
}

export async function listHabits(
  userId: string,
  active: boolean,
): Promise<Habit[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("active", active)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingRelation(error)) {
      return listHabitsFallback(userId, active);
    }
    throw new Error(error.message);
  }

  return (data ?? []) as Habit[];
}

export async function listHabitsForDate(
  userId: string,
  date: string,
): Promise<HabitWithCheckIn[]> {
  const supabase = await createClient();

  const { data: habits, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingRelation(error)) {
      return listHabitsForDateFallback(userId, date);
    }
    throw new Error(error.message);
  }
  if (!habits?.length) return [];

  const ids = habits.map((h) => h.id);
  const { data: checkIns, error: checkError } = await supabase
    .from("habit_check_ins")
    .select("habit_id, done")
    .eq("user_id", userId)
    .eq("date", date)
    .in("habit_id", ids);

  if (checkError) {
    if (isMissingRelation(checkError)) {
      return listHabitsForDateFallback(userId, date);
    }
    throw new Error(checkError.message);
  }

  const doneMap = new Map(
    (checkIns ?? []).map((row) => [row.habit_id, Boolean(row.done)]),
  );

  return habits.map((habit) => ({
    ...(habit as HabitWithCheckIn),
    done_today: doneMap.get(habit.id) ?? false,
  }));
}
