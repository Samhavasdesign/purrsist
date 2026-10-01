"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Remember the browser's timezone so the morning email lands at the user's
 * own 7am. Called from TimezoneSync whenever the detected zone changes.
 */
export async function saveTimezone(timeZone: string) {
  const user = await requireUser();
  const zone = timeZone.trim();
  if (!zone || zone.length > 64 || !isValidTimeZone(zone)) {
    return { ok: false as const, error: "Unknown timezone." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, timezone: zone });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

/** Account settings switch for the 7am "Still on your list" email. */
export async function setDigestEnabled(enabled: boolean) {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, digest_enabled: enabled });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/settings");
  return { ok: true as const };
}
