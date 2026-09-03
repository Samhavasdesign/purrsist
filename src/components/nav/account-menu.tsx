"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./account-menu.module.css";

type Props = {
  /** Display name shown as the dropdown heading and used for the avatar initial. */
  displayName: string;
  /** Account email, or null for anonymous / trial sessions. */
  email: string | null;
};

function initialFrom(name: string): string {
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

export function AccountMenu({ displayName, email }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={[styles.avatar, open ? styles.avatarOpen : ""]
          .filter(Boolean)
          .join(" ")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account — ${displayName}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{initialFrom(displayName)}</span>
      </button>

      {open ? (
        <div className={styles.menu} id={menuId} role="menu">
          <div className={styles.identity}>
            <p className={styles.name}>{displayName}</p>
            {email ? <p className={styles.email}>{email}</p> : null}
          </div>

          <div className={styles.divider} role="separator" />

          <Link
            href="/settings"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Account Settings
          </Link>

          <form action="/auth/signout" method="post" className={styles.signOutForm}>
            <button type="submit" className={styles.item} role="menuitem">
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
