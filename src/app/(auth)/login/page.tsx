import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { PurrsistLogo } from "@/components/brand/purrsist-logo";
import styles from "../auth-shell.module.css";

export default function LoginPage() {
  return (
    <main className={styles.shell}>
      <section className={styles.panel}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logoLink} aria-label="Purrsist home">
            <PurrsistLogo decorative className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>
            Sign in to keep your day sorted and your habits on track.
          </p>
        </div>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
