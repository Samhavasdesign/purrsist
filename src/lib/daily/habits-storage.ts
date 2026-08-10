import { createClient } from "@/lib/supabase/server";
import type { Habit, HabitWithCheckIn } from "@/lib/types/database";

const META_HABITS_KEY = "purrsist_habits";
export const NOTES_HABIT_CHECKS_KEY = "purrsist_habit_checks";

export function isMissingHabitsTable(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /Could not find the table ['"]?public\.habits/i.test(error.message ?? "") ||
    /Could not find the table ['"]?public\.habit_check_ins/i.test(
      error.message ?? "",
    )
  );
}

function parseMetaHabits(value: unknown, userId: string): Habit[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    if (typeof item.id !== "string" || typeof item.name !== "string") return [];
    return [
      {
        id: item.id,
        user_id: userId,
        name: item.name,
        active: item.active !== false,
        created_at:
          typeof item.created_at === "string"
            ? item.created_at
            : new Date().toISOString(),
        archived_at:
          typeof item.archived_at === "string" ? item.archived_at : null,
      },
    ];
  });
}

export function habitChecksFromNotes(
  notes: string | null | undefined,
): Record<string, boolean> {
  if (!notes?.trim()) return {};
  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    const checks = parsed?.[NOTES_HABIT_CHECKS_KEY];
    if (!checks || typeof checks !== "object" || Array.isArray(checks)) {
      return {};
    }
    const out: Record<string, boolean> = {};
    for (const [id, done] of Object.entries(checks as Record<string, unknown>)) {
      out[id] = Boolean(done);
    }
    return out;
  } catch {
    return {};
  }
}

export function notesPayloadWithHabitChecks(
  notes: string | null | undefined,
  checks: Record<string, boolean>,
): string {
  let base: Record<string, unknown> = {
    text: null,
    purrsist_extra_items: [],
  };

  if (notes?.trim()) {
    try {
      const parsed = JSON.parse(notes) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        base = { ...parsed };
      } else {
        base = { text: notes, purrsist_extra_items: [] };
      }
    } catch {
      base = { text: notes, purrsist_extra_items: [] };
    }
  }

  return JSON.stringify({
    ...base,
    [NOTES_HABIT_CHECKS_KEY]: checks,
  });
}

async function readMetaHabits(userId: string): Promise<Habit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return [];
  return parseMetaHabits(data.user.user_metadata?.[META_HABITS_KEY], userId);
}

async function writeMetaHabits(habits: Habit[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  const payload = habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    active: habit.active,
    created_at: habit.created_at,
    archived_at: habit.archived_at,
  }));
  const { error } = await supabase.auth.updateUser({
    data: { [META_HABITS_KEY]: payload },
  });
  if (error) return { error: error.message };
  return {};
}

export async function listHabitsForDateFallback(
  userId: string,
  date: string,
): Promise<HabitWithCheckIn[]> {
  const habits = (await readMetaHabits(userId)).filter((h) => h.active);
  if (!habits.length) return [];

  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("daily_entries")
    .select("notes")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  const checks = habitChecksFromNotes(entry?.notes ?? null);

  return habits
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((habit) => ({
      ...habit,
      done_today: Boolean(checks[habit.id]),
    }));
}

export async function addHabitFallback(
  userId: string,
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const habits = await readMetaHabits(userId);
  const next: Habit = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: name.trim(),
    active: true,
    created_at: new Date().toISOString(),
    archived_at: null,
  };
  const result = await writeMetaHabits([...habits, next]);
  if (result.error) return { ok: false, error: result.error };
  return { ok: true };
}

export async function renameHabitFallback(
  userId: string,
  habitId: string,
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const habits = await readMetaHabits(userId);
  const next = habits.map((habit) =>
    habit.id === habitId ? { ...habit, name } : habit,
  );
  const result = await writeMetaHabits(next);
  if (result.error) return { ok: false, error: result.error };
  return { ok: true };
}

export async function archiveHabitFallback(
  userId: string,
  habitId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const habits = await readMetaHabits(userId);
  const next = habits.map((habit) =>
    habit.id === habitId
      ? {
          ...habit,
          active: false,
          archived_at: new Date().toISOString(),
        }
      : habit,
  );
  const result = await writeMetaHabits(next);
  if (result.error) return { ok: false, error: result.error };
  return { ok: true };
}

export async function unarchiveHabitFallback(
  userId: string,
  habitId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const habits = await readMetaHabits(userId);
  const next = habits.map((habit) =>
    habit.id === habitId
      ? {
          ...habit,
          active: true,
          archived_at: null,
        }
      : habit,
  );
  const result = await writeMetaHabits(next);
  if (result.error) return { ok: false, error: result.error };
  return { ok: true };
}

export async function listHabitsFallback(
  userId: string,
  active: boolean,
): Promise<Habit[]> {
  return (await readMetaHabits(userId))
    .filter((habit) => habit.active === active)
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function removeHabitFallback(
  userId: string,
  habitId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const habits = await readMetaHabits(userId);
  const next = habits.filter((habit) => habit.id !== habitId);
  const result = await writeMetaHabits(next);
  if (result.error) return { ok: false, error: result.error };
  return { ok: true };
}

export async function setHabitCheckInFallback(
  userId: string,
  habitId: string,
  date: string,
  done: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: entry, error: loadError } = await supabase
    .from("daily_entries")
    .select("id, notes")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };

  let entryId = entry?.id as string | undefined;
  let notes = entry?.notes as string | null | undefined;

  if (!entryId) {
    const { data: created, error: createError } = await supabase
      .from("daily_entries")
      .insert({ user_id: userId, date })
      .select("id, notes")
      .single();
    if (createError || !created) {
      return {
        ok: false,
        error: createError?.message ?? "Could not create today's entry",
      };
    }
    entryId = created.id;
    notes = created.notes;
  }

  const checks = habitChecksFromNotes(notes);
  if (done) checks[habitId] = true;
  else delete checks[habitId];

  const { error } = await supabase
    .from("daily_entries")
    .update({ notes: notesPayloadWithHabitChecks(notes, checks) })
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
