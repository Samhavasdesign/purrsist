"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import styles from "./app-nav.module.css";

const LINKS = [
  { href: "/dashboard", label: "Today", match: "/dashboard" },
  { href: "/backlog", label: "Backlog", match: "/backlog" },
  { href: "/habits", label: "Habits", match: "/habits" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Primary">
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.match);
        return (
          <Button
            key={link.href}
            href={link.href}
            variant="nav"
            selected={active}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Button>
        );
      })}
    </nav>
  );
}
