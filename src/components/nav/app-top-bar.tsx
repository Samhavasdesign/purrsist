"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CatHeadIcon,
  ChevronLeftIcon,
  SettingsIcon,
} from "@/components/icons/icons";
import { IconButton } from "@/components/ui/icon-button";
import styles from "./app-top-bar.module.css";

type Props = {
  catCount?: number;
};

export function AppTopBar({ catCount = 0 }: Props) {
  const pathname = usePathname();
  const nestedSettings = pathname.startsWith("/settings/");
  const showBack =
    pathname.startsWith("/backlog") ||
    pathname.startsWith("/habits") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/collection");
  const collectionActive = pathname.startsWith("/collection");
  const settingsActive = pathname.startsWith("/settings");
  const backHref = nestedSettings ? "/settings" : "/dashboard";
  const backLabel = nestedSettings ? "Back to Settings" : "Back to Today";
  const catLabel =
    catCount === 1
      ? "1 cat rescued — view collection"
      : `${catCount} cats rescued — view collection`;

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          {showBack ? (
            <IconButton
              href={backHref}
              label={backLabel}
              icon={<ChevronLeftIcon />}
              iconSize={24}
              tone="ghost"
              className={styles.backBtn}
            />
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
            className={[
              styles.catCounter,
              collectionActive ? styles.catCounterActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={catLabel}
            aria-current={collectionActive ? "page" : undefined}
            title={catLabel}
          >
            <CatHeadIcon size={20} className={styles.catCounterIcon} />
            <span className={styles.catCounterValue} aria-hidden="true">
              {catCount}
            </span>
          </Link>
          <IconButton
            href="/settings"
            label="Open settings"
            icon={<SettingsIcon />}
            iconSize={20}
            active={settingsActive}
            aria-current={settingsActive ? "page" : undefined}
          />
        </div>
      </div>
    </header>
  );
}
