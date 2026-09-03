"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PurrsistLogo } from "@/components/brand/purrsist-logo";
import {
  CatHeadIcon,
  ChevronLeftIcon,
  InfoIcon,
} from "@/components/icons/icons";
import { IconButton } from "@/components/ui/icon-button";
import { AccountMenu } from "./account-menu";
import styles from "./app-top-bar.module.css";

type Props = {
  catCount?: number;
  isGuest: boolean;
  displayName: string;
  email: string | null;
};

export function AppTopBar({
  catCount = 0,
  isGuest,
  displayName,
  email,
}: Props) {
  const pathname = usePathname();
  // Lift a faint shadow onto the bar once the page scrolls away from the top,
  // so it reads as floating over content without a hard edge at rest.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // How-it-works lives under /settings/ in the route tree, but it's reached from
  // the global top-bar info button, not from Settings — so its back button
  // should return to Today, not Settings.
  const nestedSettings =
    pathname.startsWith("/settings/") &&
    !pathname.startsWith("/settings/how-it-works");
  const showBack =
    pathname.startsWith("/backlog") ||
    pathname.startsWith("/habits") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/collection") ||
    pathname.startsWith("/archive");
  const collectionActive = pathname.startsWith("/collection");
  const infoActive = pathname.startsWith("/settings/how-it-works");
  const backHref = nestedSettings ? "/settings" : "/dashboard";
  const backLabel = nestedSettings ? "Back to Settings" : "Back to Today";
  const catLabel =
    catCount === 1
      ? "1 cat rescued — view collection"
      : `${catCount} cats rescued — view collection`;

  return (
    <header
      className={[styles.bar, scrolled ? styles.barScrolled : ""]
        .filter(Boolean)
        .join(" ")}
    >
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
          <Link
            href="/dashboard"
            className={styles.brand}
            aria-label="Home — Today"
          >
            <PurrsistLogo decorative className={styles.brandLogo} />
          </Link>
        </div>

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
            href="/settings/how-it-works"
            label="About Purrsist"
            icon={<InfoIcon />}
            iconSize={20}
            active={infoActive}
            aria-current={infoActive ? "page" : undefined}
            className={styles.navControl}
          />
          {isGuest ? (
            <Link href="/settings" className={styles.saveAccountCta}>
              Save account
            </Link>
          ) : (
            <AccountMenu displayName={displayName} email={email} />
          )}
        </div>
      </div>
    </header>
  );
}
