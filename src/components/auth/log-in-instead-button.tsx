"use client";

import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./log-in-instead-button.module.css";

type Props = {
  children?: ReactNode;
  className?: string;
};

/**
 * Inline "log in" action for anonymous / trial sessions. Ends the trial
 * (clearing its unsaved data, after a confirm) and lands on /login so the
 * user can sign into an account they already have.
 */
export function LogInInsteadButton({ children = "Log in", className }: Props) {
  const router = useRouter();

  async function switchToLogin() {
    const confirmed = window.confirm(
      "Log in to an existing account? This trial's unsaved items will be cleared — save them first if you want to keep them.",
    );
    if (!confirmed) return;

    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      className={[styles.linkButton, className].filter(Boolean).join(" ")}
      onClick={switchToLogin}
    >
      {children}
    </button>
  );
}
