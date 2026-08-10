"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./app-nav.module.css";

const LINKS = [
  { href: "/dashboard", label: "Today", match: "/dashboard" },
  { href: "/backlog", label: "Backlog", match: "/backlog" },
  { href: "/archive", label: "Archive", match: "/archive" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Primary">
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.match);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.link} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
