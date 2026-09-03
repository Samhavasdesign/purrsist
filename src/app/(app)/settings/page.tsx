import { SaveAccountForm } from "@/components/auth/save-account-form";
import { isAnonymousUser, requireUser } from "@/lib/auth";
import styles from "./settings.module.css";

export default async function SettingsPage() {
  const user = await requireUser();
  const anonymous = isAnonymousUser(user);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account</h1>
      </header>

      <section className={styles.section} aria-labelledby="account-heading">
        <h2 id="account-heading" className={styles.sectionTitle}>
          Account
        </h2>

        {anonymous ? (
          <SaveAccountForm />
        ) : (
          <p className={styles.email}>{user.email}</p>
        )}

        {anonymous ? null : (
          <form action="/auth/signout" method="post">
            <button className={styles.signOut} type="submit">
              Sign out
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
