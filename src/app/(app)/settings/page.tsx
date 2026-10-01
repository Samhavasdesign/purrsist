import { SaveAccountForm } from "@/components/auth/save-account-form";
import { DigestToggle } from "@/components/profile/digest-toggle";
import { isAnonymousUser, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import styles from "./settings.module.css";

export default async function SettingsPage() {
  const user = await requireUser();
  const anonymous = isAnonymousUser(user);

  let digestEnabled = true;
  if (!anonymous) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("digest_enabled")
      .eq("id", user.id)
      .maybeSingle();
    digestEnabled = data?.digest_enabled ?? true;
  }

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

      {anonymous ? null : (
        <section className={styles.section} aria-labelledby="email-heading">
          <h2 id="email-heading" className={styles.sectionTitle}>
            Email
          </h2>
          <DigestToggle initialEnabled={digestEnabled} />
        </section>
      )}
    </main>
  );
}
