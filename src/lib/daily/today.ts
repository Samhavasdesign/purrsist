import { cache } from "react";
import { cookies } from "next/headers";
import { zonedDateKey } from "@/lib/email/dates";
import { createClient } from "@/lib/supabase/server";
import { TIMEZONE_COOKIE } from "@/lib/profile/timezone-cookie";

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * The user's IANA timezone for deciding which calendar day "today" is.
 *
 * The server runs in UTC, so its own clock rolls over to tomorrow hours before
 * (or after) the user's does. Order: the browser's timezone cookie (set by
 * TimezoneSync, freshest), then the saved profile zone, then UTC.
 */
export const getUserTimeZone = cache(async function getUserTimeZone(
  userId: string,
): Promise<string> {
  const fromCookie = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  if (fromCookie && isValidTimeZone(fromCookie)) return fromCookie;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  const saved = data?.timezone;
  if (saved && isValidTimeZone(saved)) return saved;

  return "UTC";
});

/** Today's YYYY-MM-DD in the user's own timezone. */
export async function getUserTodayKey(userId: string): Promise<string> {
  return zonedDateKey(await getUserTimeZone(userId));
}
