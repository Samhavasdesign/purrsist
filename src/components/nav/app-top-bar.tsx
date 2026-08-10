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
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="5.1" cy="5.35" r="1.2" />
              <circle cx="7.55" cy="3.85" r="1.2" />
              <circle cx="10.35" cy="3.85" r="1.2" />
              <circle cx="12.8" cy="5.35" r="1.2" />
              <path d="M8.95 6.9c-2.2 0-4 1.4-4 3.25 0 1.7 1.4 2.85 4 2.85s4-1.15 4-2.85c0-1.85-1.8-3.25-4-3.25z" />
              <circle cx="11.2" cy="14.85" r="1.2" />
              <circle cx="13.65" cy="13.35" r="1.2" />
              <circle cx="16.45" cy="13.35" r="1.2" />
              <circle cx="18.9" cy="14.85" r="1.2" />
              <path d="M15.05 16.4c-2.2 0-4 1.4-4 3.25 0 1.7 1.4 2.85 4 2.85s4-1.15 4-2.85c0-1.85-1.8-3.25-4-3.25z" />
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
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.078 2.25h1.844c.784 0 1.475.507 1.706 1.25l.29.93a1.875 1.875 0 0 0 2.385 1.196l.89-.334a1.875 1.875 0 0 1 2.356.86l.922 1.597a1.875 1.875 0 0 1-.68 2.49l-.78.45a1.875 1.875 0 0 0 0 3.222l.78.45a1.875 1.875 0 0 1 .68 2.49l-.922 1.597a1.875 1.875 0 0 1-2.356.86l-.89-.334a1.875 1.875 0 0 0-2.385 1.196l-.29.93a1.875 1.875 0 0 1-1.706 1.25h-1.844a1.875 1.875 0 0 1-1.706-1.25l-.29-.93a1.875 1.875 0 0 0-2.385-1.196l-.89.334a1.875 1.875 0 0 1-2.356-.86l-.922-1.597a1.875 1.875 0 0 1 .68-2.49l.78-.45a1.875 1.875 0 0 0 0-3.222l-.78-.45a1.875 1.875 0 0 1-.68-2.49l.922-1.597a1.875 1.875 0 0 1 2.356-.86l.89.334a1.875 1.875 0 0 0 2.385-1.196l.29-.93a1.875 1.875 0 0 1 1.706-1.25ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
