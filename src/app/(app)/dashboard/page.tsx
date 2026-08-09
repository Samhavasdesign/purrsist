import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.mark}>Purrsist</p>
        <form action="/auth/signout" method="post">
          <button className={styles.signOut} type="submit">
            Sign out
          </button>
        </form>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.title}>Your day starts here</h1>
        <p className={styles.subtitle}>
          Signed in as {user.email}. Morning Digest and Weekly Recap land next —
          for now, the foundation is live.
        </p>
        <Link className={styles.link} href="/">
          Back to home
        </Link>
      </section>
    </main>
  );
}
