"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveTimezone } from "@/lib/profile/actions";
import { TIMEZONE_COOKIE } from "@/lib/profile/timezone-cookie";

const STORAGE_KEY = "purrsist:timezone";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/**
 * Tells the server the browser's timezone, two ways:
 * - a cookie, so server-rendered pages pick the user's own "today" rather than
 *   the server's UTC date. If the cookie was missing or stale, the page was
 *   rendered against the wrong day, so refresh once to re-render it.
 * - the profile, so the morning email arrives at the user's local 7am. Only
 *   calls the server when the zone differs from the last one this browser
 *   saved (first visit, travel, a new device).
 */
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    let zone: string;
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!zone) return;

    if (readCookie(TIMEZONE_COOKIE) !== zone) {
      document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(zone)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
      router.refresh();
    }

    try {
      if (window.localStorage.getItem(STORAGE_KEY) === zone) return;
    } catch {
      // storage blocked — save anyway, it's one small upsert
    }

    void saveTimezone(zone).then((result) => {
      if (!result.ok) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, zone);
      } catch {
        // best-effort
      }
    });
  }, [router]);

  return null;
}
