import Link from "next/link";
import { TryItButton } from "@/components/auth/try-it-button";
import { PurrsistLogo } from "@/components/brand/purrsist-logo";
import { TodayPreview } from "@/components/marketing/today-preview";
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <PurrsistLogo className={styles.logo} />
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1 className={styles.title}>Make your to&#8288;-&#8288;do list feel doable.</h1>
          <p className={styles.subtitle}>
            Purrsist uses AI to turn everything on your mind into a realistic
            plan for today — without making productivity another job.
          </p>
          <div className={styles.actions}>
            <TryItButton className={styles.cta}>Try Purrsist</TryItButton>
            <Link className={styles.secondary} href="/signup">
              Create an account
            </Link>
          </div>
          <p className={styles.reassurance}>
            No account needed to try it. Already have one?{" "}
            <Link className={styles.reassuranceLink} href="/login">
              Log in
            </Link>
            .
          </p>
        </div>

        <div className={styles.heroPreview}>
          <TodayPreview />
        </div>
      </section>
    </main>
  );
}
