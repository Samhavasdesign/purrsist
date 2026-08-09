import Link from "next/link";
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.mark}>Purrsist</p>
        <nav className={styles.nav}>
          <Link className={styles.navLink} href="/login">
            Sign in
          </Link>
          <Link className={styles.cta} href="/signup">
            Get started
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.title}>Purrsist</h1>
        <p className={styles.subtitle}>
          A calm place to capture what matters, sort it with AI, and stay
          consistent — morning to week&apos;s end.
        </p>
        <div className={styles.actions}>
          <Link className={styles.cta} href="/signup">
            Create account
          </Link>
          <Link className={styles.secondary} href="/login">
            I already have one
          </Link>
        </div>
      </section>
    </main>
  );
}
