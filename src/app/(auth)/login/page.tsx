import { AuthForm } from "@/components/auth/auth-form";
import styles from "../auth-shell.module.css";

export default function LoginPage() {
  return (
    <main className={styles.shell}>
      <section className={styles.panel}>
        <div className={styles.brand}>
          <p className={styles.mark}>Purrsist</p>
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
