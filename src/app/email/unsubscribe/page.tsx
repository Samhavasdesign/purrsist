import Link from "next/link";
import { PurrsistLogo } from "@/components/brand/purrsist-logo";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { createAdminClient } from "@/lib/supabase/admin";
import shell from "../../(auth)/auth-shell.module.css";
import styles from "./unsubscribe.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Landing page for "Turn off these emails" in the morning email. Signed link,
 * no login. Shows the current setting and acts only on an explicit button
 * press, so link-preview scanners can't unsubscribe anyone.
 */
export default async function EmailUnsubscribePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const userId = first(params.u);
  const token = first(params.t);
  const status = first(params.status);
  const valid = verifyUnsubscribeToken(userId, token);

  let enabled = true;
  if (valid) {
    const { data } = await createAdminClient()
      .from("profiles")
      .select("digest_enabled")
      .eq("id", userId)
      .maybeSingle();
    enabled = data?.digest_enabled ?? true;
  }

  const action = valid
    ? `/api/email/unsubscribe?${new URLSearchParams({ u: userId, t: token! })}`
    : "";

  const title = !valid
    ? "This link isn't valid"
    : status === "error"
      ? "Something went wrong"
      : enabled
        ? "Morning emails are on"
        : "Morning emails are off";

  const body = !valid
    ? "It may have been copied incompletely, or it's from an old email."
    : status === "error"
      ? "Your setting didn't save. Try again."
      : enabled
        ? "You get a 7am email with what's still on your list and any reminders that are due."
        : "You won't get the 7am “Still on your list” email anymore. Your tasks and reminders still show up in the app.";

  return (
    <main className={shell.shell}>
      <section className={shell.panel}>
        <div className={shell.brand}>
          <Link href="/" className={shell.logoLink} aria-label="Purrsist home">
            <PurrsistLogo decorative className={shell.logo} />
          </Link>
          <h1 className={shell.title}>{title}</h1>
          <p className={shell.subtitle} role={status ? "status" : undefined}>
            {body}
          </p>
        </div>

        {valid ? (
          <form action={action} method="post" className={styles.actions}>
            <input type="hidden" name="from" value="page" />
            <input type="hidden" name="enabled" value={enabled ? "0" : "1"} />
            <button
              type="submit"
              className={enabled ? styles.primary : styles.secondary}
            >
              {enabled ? "Turn off morning emails" : "Turn them back on"}
            </button>
          </form>
        ) : null}

        <p className={styles.footnote}>
          You can also change this anytime in{" "}
          <Link className={styles.link} href="/settings">
            Account settings
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
