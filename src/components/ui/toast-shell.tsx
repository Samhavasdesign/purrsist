"use client";

import type { ToastAnchor } from "@/lib/ui/toast-anchor";
import { useToastAnchor } from "@/lib/ui/toast-anchor";
import styles from "./toast-shell.module.css";

const ANCHOR_CLASS: Record<ToastAnchor, string> = {
  "bottom-right": styles.bottomRight,
  "top-right": styles.topRight,
  top: styles.top,
  bottom: styles.bottom,
};

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Override auto platform detection (tests / story previews). */
  anchor?: ToastAnchor;
  role?: React.AriaRole;
  "aria-live"?: "polite" | "assertive" | "off";
};

/**
 * Fixed toast host: bottom-right on desktop, iOS top banner /
 * Android bottom snackbar on narrow viewports.
 */
export function ToastShell({
  children,
  className,
  anchor: anchorProp,
  role = "status",
  "aria-live": ariaLive = "polite",
}: Props) {
  const detected = useToastAnchor();
  const anchor = anchorProp ?? detected;
  const fromTop = anchor === "top" || anchor === "top-right";

  return (
    <aside
      className={[
        styles.shell,
        ANCHOR_CLASS[anchor],
        fromTop ? styles.fromTop : styles.fromBottom,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      role={role}
      aria-live={ariaLive}
    >
      {children}
    </aside>
  );
}
