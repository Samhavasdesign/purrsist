"use client";

import { useState } from "react";
import Link from "next/link";
import { CloseIcon } from "@/components/icons/icons";
import { IconButton } from "@/components/ui/icon-button";
import { TRIAL_BANNER_DISMISSED_COOKIE } from "./trial-banner.constants";
import { LogInInsteadButton } from "./log-in-instead-button";
import styles from "./trial-banner.module.css";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function dismiss() {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie =
      `${TRIAL_BANNER_DISMISSED_COOKIE}=1; path=/; max-age=${ONE_YEAR_SECONDS}` +
      `; samesite=lax${secure}`;
    setDismissed(true);
  }

  return (
    <aside className={styles.banner} role="status">
      <p className={styles.text}>
        You&rsquo;re using Purrsist as a guest.{" "}
        <Link className={styles.link} href="/settings">
          Save an account
        </Link>{" "}
        to keep your to-dos.{" "}
        <LogInInsteadButton className={styles.link} />
      </p>
      <IconButton
        label="Dismiss"
        icon={<CloseIcon />}
        iconSize={20}
        tone="ghost"
        className={styles.dismiss}
        onClick={dismiss}
        title="Dismiss"
      />
    </aside>
  );
}
