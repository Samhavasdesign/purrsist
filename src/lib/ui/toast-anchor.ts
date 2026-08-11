"use client";

import { useEffect, useState } from "react";

/**
 * Where ephemeral toasts/snackbars anchor.
 * - Desktop: bottom-right (app convention)
 * - Desktop top-right: under sticky top bar (celebration / win payoff)
 * - iOS mobile: top banner (system-notification feel)
 * - Android / other mobile: bottom snackbar, above tab/nav chrome
 */
export type ToastAnchor = "bottom-right" | "top-right" | "top" | "bottom";

function isCoarseMobileViewport(): boolean {
  return window.matchMedia("(max-width: 639px)").matches;
}

function isAppleMobile(): boolean {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS desktop UA with touch
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function resolveToastAnchor(): ToastAnchor {
  if (typeof window === "undefined") return "bottom-right";
  if (!isCoarseMobileViewport()) return "bottom-right";
  if (isAppleMobile()) return "top";
  return "bottom";
}

/** Live toast anchor — updates on resize/orientation. */
export function useToastAnchor(): ToastAnchor {
  const [anchor, setAnchor] = useState<ToastAnchor>("bottom-right");

  useEffect(() => {
    function sync() {
      setAnchor(resolveToastAnchor());
    }
    sync();
    const mq = window.matchMedia("(max-width: 639px)");
    mq.addEventListener("change", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return anchor;
}
