import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Current user from the cookie session, or null if signed out.
 *
 * Wrapped in React `cache()` so the layout and the page it renders share a
 * single `auth.getUser()` round-trip per request instead of hitting the
 * Supabase auth server two or three times.
 */
export const getUser = cache(async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Require a signed-in user; redirect to /login otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** True for Supabase anonymous (try-before-signup) sessions. */
export function isAnonymousUser(user: User): boolean {
  return user.is_anonymous === true;
}
