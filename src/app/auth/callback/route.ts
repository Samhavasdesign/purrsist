import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Keep the reason so LinkErrorNotice can explain it on /login.
    const failed = new URLSearchParams({
      error: "exchange_failed",
      error_code: error.code ?? "exchange_failed",
      error_description: error.message,
    });
    return NextResponse.redirect(`${origin}/login?${failed}`);
  }

  // Supabase sends `error`, `error_code` and `error_description` here when the
  // link itself was rejected (e.g. otp_expired); pass them through.
  const forwarded = new URLSearchParams();
  for (const key of ["error", "error_code", "error_description"]) {
    const value = searchParams.get(key);
    if (value) forwarded.set(key, value);
  }
  const query = forwarded.size ? `?${forwarded}` : "";
  return NextResponse.redirect(`${origin}/login${query}`);
}
