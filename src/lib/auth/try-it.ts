"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type TryItResult = { error: string };

/** Start an anonymous session and enter the app (demo / try-before-signup). */
export async function startTrial(): Promise<TryItResult | void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
