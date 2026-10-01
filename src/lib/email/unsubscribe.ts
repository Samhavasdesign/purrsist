import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppUrl } from "@/lib/email/resend";

/**
 * Signed, login-free links for turning the morning email off from the email
 * itself. The token is an HMAC of the user id, so it can't be forged for
 * someone else and never expires (an old email's link still works).
 */
function secret(): string {
  const value = process.env.UNSUBSCRIBE_SECRET ?? process.env.CRON_SECRET;
  if (!value) throw new Error("Missing UNSUBSCRIBE_SECRET");
  return value;
}

export function unsubscribeToken(userId: string): string {
  return createHmac("sha256", secret())
    .update(`digest-unsubscribe:${userId}`)
    .digest("base64url");
}

export function verifyUnsubscribeToken(
  userId: string | null,
  token: string | null,
): userId is string {
  if (!userId || !token) return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(unsubscribeToken(userId));
  } catch {
    return false;
  }
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function query(userId: string): string {
  const params = new URLSearchParams({
    u: userId,
    t: unsubscribeToken(userId),
  });
  return params.toString();
}

/** Page a person lands on from the "Turn off" link — confirms before acting. */
export function unsubscribePageUrl(userId: string): string {
  return `${getAppUrl().replace(/\/$/, "")}/email/unsubscribe?${query(userId)}`;
}

/** RFC 8058 one-click endpoint for the List-Unsubscribe header. */
export function unsubscribeApiUrl(userId: string): string {
  return `${getAppUrl().replace(/\/$/, "")}/api/email/unsubscribe?${query(userId)}`;
}
