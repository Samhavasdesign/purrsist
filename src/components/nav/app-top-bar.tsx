"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./app-top-bar.module.css";

export function AppTopBar() {
  const pathname = usePathname();
  const showBack =
    pathname.startsWith("/backlog") ||
    pathname.startsWith("/archive") ||
    pathname.startsWith("/habits") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/collection");
  const collectionActive = pathname.startsWith("/collection");
  const settingsActive = pathname.startsWith("/settings");

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          {showBack ? (
            <Link
              href="/dashboard"
              className={styles.backLink}
              aria-label="Back to Today"
            >
              <svg
                className={styles.backIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
          ) : null}
        </div>

        <Link
          href="/dashboard"
          className={styles.brand}
          aria-label="Home — Today"
        >
          Purrsist
        </Link>

        <div className={styles.right}>
          <Link
            href="/collection"
            className={`${styles.iconLink} ${collectionActive ? styles.iconLinkActive : ""}`}
            aria-label="Collection"
            aria-current={collectionActive ? "page" : undefined}
          >
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7.4 2.9L4.6 8.4C2.9 10.6 2.7 14.4 5.2 17.5 7.4 20.2 16.6 20.2 18.8 17.5 21.3 14.4 21.1 10.6 19.4 8.4L16.6 2.9l-2.3 5.1c-.7-.5-1.5-.8-2.3-.8s-1.6.3-2.3.8L7.4 2.9z" />
            </svg>
          </Link>

          <Link
            href="/settings"
            className={`${styles.iconLink} ${settingsActive ? styles.iconLinkActive : ""}`}
            aria-label="Settings"
            aria-current={settingsActive ? "page" : undefined}
          >
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
