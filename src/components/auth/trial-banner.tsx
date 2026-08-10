import Link from "next/link";
import styles from "./trial-banner.module.css";

export function TrialBanner() {
  return (
    <aside className={styles.banner} role="status">
      <p className={styles.text}>
        Trying Purrsist —{" "}
        <Link className={styles.link} href="/settings">
          save an account
        </Link>{" "}
        anytime to keep your data.
      </p>
    </aside>
  );
}
