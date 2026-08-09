import { AuthForm } from "@/components/auth/auth-form";
import styles from "../auth-shell.module.css";

export default function SignupPage() {
  return (
    <main className={styles.shell}>
      <section className={styles.panel}>
        <div className={styles.brand}>
          <p className={styles.mark}>Purrsist</p>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>
            Email and password only — simple, private, ready when you are.
          </p>
        </div>
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}
