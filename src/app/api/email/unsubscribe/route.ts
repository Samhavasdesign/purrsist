import { NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Turns the morning email off (or back on) without a login.
 * - Mail clients' one-click unsubscribe (RFC 8058) POSTs here with no body
 *   fields we read, so the default is "off".
 * - The /email/unsubscribe page posts `enabled` and `from=page`, and gets
 *   redirected back to show the result.
 * GET does nothing: link scanners prefetch URLs, and must not unsubscribe.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("u");
  const token = url.searchParams.get("t");

  if (!verifyUnsubscribeToken(userId, token)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  let enabled = false;
  let fromPage = false;
  try {
    const form = await request.formData();
    enabled = form.get("enabled") === "1";
    fromPage = form.get("from") === "page";
  } catch {
    // One-click posts may have a body we don't parse — treat as "off".
  }

  const { error } = await createAdminClient()
    .from("profiles")
    .upsert({ id: userId, digest_enabled: enabled });

  if (fromPage) {
    const back = new URL("/email/unsubscribe", url.origin);
    back.searchParams.set("u", userId);
    back.searchParams.set("t", token!);
    back.searchParams.set("status", error ? "error" : enabled ? "on" : "off");
    return NextResponse.redirect(back, 303);
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, enabled });
}
