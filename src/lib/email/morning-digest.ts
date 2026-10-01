import { listDueReminders } from "@/lib/backlog/due-reminders";
import { CARRYOVER_LOOKBACK_DAYS } from "@/lib/daily/carryover";
import { readReminders } from "@/lib/daily/reminders";
import { getDigestTimezone, shiftDateKey, zonedDateKey } from "@/lib/email/dates";
import { buildMorningDigestEmail } from "@/lib/email/morning-digest-content";
import { getAppUrl, getEmailFrom, getResendClient } from "@/lib/email/resend";
import {
  unsubscribeApiUrl,
  unsubscribePageUrl,
} from "@/lib/email/unsubscribe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DailyEntry } from "@/lib/types/database";
import { listUncheckedFilledItems } from "@/lib/types/database";

export type DigestSendResult = {
  userId: string;
  email: string | null;
  status: "sent" | "skipped" | "error";
  reason?: string;
};

/** Local hour the email goes out. */
const SEND_HOUR = 7;
/**
 * Keep trying until this local hour, so a late or skipped cron run still
 * delivers that morning. `last_digest_on` stops a second send.
 */
const SEND_UNTIL_HOUR = 10;

type ProfileRow = {
  id: string;
  timezone: string | null;
  last_digest_on: string | null;
  digest_enabled: boolean | null;
};

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function localHour(timeZone: string, now: Date): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  })
    .formatToParts(now)
    .find((part) => part.type === "hour")?.value;
  return Number(hour ?? 0);
}

/**
 * The user's most recent day, up to their local today. Days are stored under
 * the server's date, so for users west of UTC last night's list can sit under
 * today's key — taking the latest row (not strictly "yesterday") covers both.
 */
async function loadRecentEntries(userId: string, localToday: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .lte("date", localToday)
    .gte("date", shiftDateKey(localToday, -CARRYOVER_LOOKBACK_DAYS))
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DailyEntry[];
}

function latestDailyReminder(entries: DailyEntry[]): string | null {
  for (const entry of entries) {
    const texts = readReminders(entry)
      .map((item) => item.text.trim())
      .filter(Boolean);
    // Newest entry first; within a day the last one written wins.
    if (texts.length > 0) return texts[texts.length - 1];
  }
  return null;
}

export async function sendMorningDigestForUser(input: {
  userId: string;
  email: string;
  localToday: string;
}): Promise<DigestSendResult> {
  const admin = createAdminClient();
  const { userId, email, localToday } = input;

  try {
    const entries = await loadRecentEntries(userId, localToday);
    const latest = entries[0] ?? null;
    const dueReminders = await listDueReminders(admin, userId, localToday);

    const { subject, text, html } = buildMorningDigestEmail({
      todayKey: localToday,
      stillOpen: latest ? listUncheckedFilledItems(latest) : [],
      latestDailyReminder: latestDailyReminder(entries),
      dueReminders: dueReminders.map((reminder) => ({
        text: reminder.text,
        target_date: reminder.target_date,
      })),
      appUrl: getAppUrl(),
      unsubscribeUrl: unsubscribePageUrl(userId),
    });

    // Claim the day before sending so overlapping runs can't double-send.
    const { error: markError } = await admin
      .from("profiles")
      .upsert({ id: userId, last_digest_on: localToday });
    if (markError) {
      return { userId, email, status: "error", reason: markError.message };
    }

    const { error: sendError } = await getResendClient().emails.send({
      from: getEmailFrom(),
      to: email,
      subject,
      text,
      html,
      // One-click unsubscribe in Gmail / Apple Mail (RFC 8058).
      headers: {
        "List-Unsubscribe": `<${unsubscribeApiUrl(userId)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (sendError) {
      // Release the claim so the next hourly run retries.
      await admin
        .from("profiles")
        .update({ last_digest_on: null })
        .eq("id", userId)
        .eq("last_digest_on", localToday);
      return { userId, email, status: "error", reason: sendError.message };
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

/**
 * Hourly: email every signed-up user whose local time is between 7am and
 * 10am and who hasn't had today's email yet. Timezone comes from the profile
 * (saved by the browser), falling back to DIGEST_TIMEZONE.
 */
export async function runMorningDigestJob(now = new Date()): Promise<{
  fallbackTimezone: string;
  results: DigestSendResult[];
}> {
  const fallbackTimezone = getDigestTimezone();
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

    const { data: profileRows, error: profileError } = await admin
      .from("profiles")
      .select("id, timezone, last_digest_on, digest_enabled")
      .in(
        "id",
        users.map((user) => user.id),
      );
    if (profileError) throw profileError;
    const profiles = new Map(
      ((profileRows ?? []) as ProfileRow[]).map((row) => [row.id, row]),
    );

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

      const profile = profiles.get(user.id);
      if (profile?.digest_enabled === false) {
        results.push({
          userId: user.id,
          email,
          status: "skipped",
          reason: "turned_off",
        });
        continue;
      }

      const timeZone =
        profile?.timezone && isValidTimeZone(profile.timezone)
          ? profile.timezone
          : fallbackTimezone;
      const hour = localHour(timeZone, now);
      if (hour < SEND_HOUR || hour >= SEND_UNTIL_HOUR) {
        results.push({
          userId: user.id,
          email,
          status: "skipped",
          reason: "outside_send_window",
        });
        continue;
      }

      const localToday = zonedDateKey(timeZone, now);
      if (profile?.last_digest_on === localToday) {
        results.push({
          userId: user.id,
          email,
          status: "skipped",
          reason: "already_sent",
        });
        continue;
      }

      results.push(
        await sendMorningDigestForUser({
          userId: user.id,
          email,
          localToday,
        }),
      );
    }

    if (users.length < perPage) break;
    page += 1;
  }

  return { fallbackTimezone, results };
}
