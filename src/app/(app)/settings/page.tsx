import Link from "next/link";
import { requireUser } from "@/lib/auth";
import styles from "./settings.module.css";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>
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
          Today
        </Link>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Manage your account and app preferences.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="account-heading">
        <h2 id="account-heading" className={styles.sectionTitle}>
          Account
        </h2>
        <p className={styles.email}>{user.email}</p>
        <form action="/auth/signout" method="post">
          <button className={styles.signOut} type="submit">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
