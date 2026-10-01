"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CloseIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { ToastShell } from "@/components/ui/toast-shell";
import type { ToastAnchor } from "@/lib/ui/toast-anchor";
import {
  type LinkError,
  readLinkError,
  withoutLinkError,
} from "@/lib/supabase/link-error";
import styles from "./link-error-notice.module.css";

/** Read once per page load; the URL is cleaned right after. */
let fromUrl: LinkError | null | undefined;

function getSnapshot(): LinkError | null {
  if (fromUrl === undefined) {
    fromUrl = readLinkError(window.location.search, window.location.hash);
  }
  return fromUrl;
}

const subscribe = () => () => {};
const getServerSnapshot = () => null;

/** The notice itself — pure, so stories can render it. */
export function LinkErrorNoticeView({
  error,
  anchor,
  onDismiss,
}: {
  error: LinkError;
  anchor?: ToastAnchor;
  onDismiss: () => void;
}) {
  return (
    <ToastShell anchor={anchor} role="alert" className={styles.toast}>
      <span className={styles.copy}>
        <span className={styles.title}>{error.title}</span>
        <span className={styles.detail}>{error.detail}</span>
      </span>
      <IconButton
        tone="ghost"
        label="Dismiss"
        icon={<CloseIcon />}
        iconSize={20}
        className={styles.dismiss}
        onClick={onDismiss}
      />
    </ToastShell>
  );
}

/**
 * Mounted in the root layout. When Supabase sends someone back from a failed
 * confirmation link (`?error_code=otp_expired…`), says so instead of silently
 * landing them on Today, then tidies the error out of the address bar.
 */
export function LinkErrorNotice() {
  const error = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!error) return;
    const clean = withoutLinkError(window.location.href);
    if (clean !== window.location.href) {
      window.history.replaceState(window.history.state, "", clean);
    }
  }, [error]);

  if (!error || dismissed) return null;
  return (
    <LinkErrorNoticeView error={error} onDismiss={() => setDismissed(true)} />
  );
}
