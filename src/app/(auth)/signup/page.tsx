import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { PurrsistLogo } from "@/components/brand/purrsist-logo";
import styles from "../auth-shell.module.css";

export default function SignupPage() {
  return (
    <main className={styles.shell}>
      <section className={styles.panel}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logoLink} aria-label="Purrsist home">
            <PurrsistLogo decorative className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>
            Email and password — that&apos;s the only setup step.
          </p>
        </div>
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}
