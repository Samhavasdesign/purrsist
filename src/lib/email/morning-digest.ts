import {
  buildMorningDigestEmail,
  type DigestHabitLine,
  type MorningDigestData,
} from "@/lib/email/morning-digest-content";
import {
  getDigestTimezone,
  shiftDateKey,
  zonedDateKey,
} from "@/lib/email/dates";
import { listDueReminders } from "@/lib/backlog/due-reminders";
import { getEmailFrom, getResendClient } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DailyEntry } from "@/lib/types/database";

export type DigestSendResult = {
  userId: string;
  email: string | null;
  status: "sent" | "skipped" | "error";
  reason?: string;
};

async function getOrCreateTodayEntryAdmin(
  userId: string,
  todayKey: string,
): Promise<DailyEntry> {
  const admin = createAdminClient();

  const { data: existing, error: selectError } = await admin
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", todayKey)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as DailyEntry;

  const { data: created, error: insertError } = await admin
    .from("daily_entries")
    .insert({ user_id: userId, date: todayKey })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return created as DailyEntry;
}

async function loadYesterdayHabits(
  userId: string,
  yesterdayKey: string,
): Promise<DigestHabitLine[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("habit_check_ins")
    .select("done, habits(name)")
    .eq("user_id", userId)
    .eq("date", yesterdayKey);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const habits = row.habits as { name: string } | { name: string }[] | null;
    const name = Array.isArray(habits)
      ? (habits[0]?.name ?? "Habit")
      : (habits?.name ?? "Habit");
    return { name, done: Boolean(row.done) };
  });
}

export async function sendMorningDigestForUser(input: {
  userId: string;
  email: string;
  todayKey: string;
  yesterdayKey: string;
}): Promise<DigestSendResult> {
  const admin = createAdminClient();
  const { userId, email, todayKey, yesterdayKey } = input;

  try {
    const today = await getOrCreateTodayEntryAdmin(userId, todayKey);

    if (today.morning_digest_sent) {
      return {
        userId,
        email,
        status: "skipped",
        reason: "already_sent",
      };
    }

    const { data: yesterday, error: yesterdayError } = await admin
      .from("daily_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", yesterdayKey)
      .maybeSingle();

    if (yesterdayError) throw yesterdayError;

    const habitsYesterday = await loadYesterdayHabits(userId, yesterdayKey);
    const dueReminders = await listDueReminders(admin, userId, todayKey);

    const payload: MorningDigestData = {
      todayKey,
      yesterdayKey,
      yesterday: (yesterday as DailyEntry | null) ?? null,
      today,
      habitsYesterday,
      dueReminders: dueReminders.map((reminder) => ({
        text: reminder.text,
        target_date: reminder.target_date,
      })),
    };

    const { subject, text } = buildMorningDigestEmail(payload);
    const resend = getResendClient();
    const { error: sendError } = await resend.emails.send({
      from: getEmailFrom(),
      to: email,
      subject,
      text,
    });

    if (sendError) {
      return {
        userId,
        email,
        status: "error",
        reason: sendError.message,
      };
    }

    const { error: markError } = await admin
      .from("daily_entries")
      .update({ morning_digest_sent: true })
      .eq("id", today.id)
      .eq("user_id", userId);

    if (markError) {
      return {
        userId,
        email,
        status: "error",
        reason: `sent_but_mark_failed: ${markError.message}`,
      };
    }

    return { userId, email, status: "sent" };
  } catch (err) {
    return {
      userId,
      email,
      status: "error",
      reason: err instanceof Error ? err.message : "unknown_error",
    };
  }
}

export async function runMorningDigestJob(): Promise<{
  todayKey: string;
  yesterdayKey: string;
  timezone: string;
  results: DigestSendResult[];
}> {
  const timezone = getDigestTimezone();
  const todayKey = zonedDateKey(timezone);
  const yesterdayKey = shiftDateKey(todayKey, -1);
  const admin = createAdminClient();

  const results: DigestSendResult[] = [];
  let page = 1;
  const perPage = 100;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;
    const users = data.users;
    if (!users.length) break;

    for (const user of users) {
      if (user.is_anonymous) {
        results.push({
          userId: user.id,
          email: null,
          status: "skipped",
          reason: "anonymous",
        });
        continue;
      }

      const email = user.email;
      if (!email) {
        results.push({
          userId: user.id,
          email: null,
          status: "skipped",
          reason: "no_email",
        });
        continue;
      }

      const result = await sendMorningDigestForUser({
        userId: user.id,
        email,
        todayKey,
        yesterdayKey,
      });
      results.push(result);
    }

    if (users.length < perPage) break;
    page += 1;
  }

  return { todayKey, yesterdayKey, timezone, results };
}
