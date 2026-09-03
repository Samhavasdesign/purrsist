"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
