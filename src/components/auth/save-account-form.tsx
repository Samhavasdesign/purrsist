"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { setDigestEnabled as saveDigestEnabled } from "@/lib/profile/actions";
import { createClient } from "@/lib/supabase/client";
import authStyles from "./auth-form.module.css";
import { DigestOptIn } from "./digest-opt-in";
import { LogInInsteadButton } from "./log-in-instead-button";
import styles from "./save-account-form.module.css";

function isEmailAlreadyRegistered(error: {
  code?: string;
  message?: string;
}): boolean {
  if (error.code === "email_exists" || error.code === "user_already_exists") {
    return true;
  }
  return /already (been )?(registered|in use)|already exists/i.test(
    error.message ?? "",
  );
}

export function SaveAccountForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEmailTaken(false);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: updateError } = await supabase.auth.updateUser(
      {
        email,
        password,
      },
      {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    );

    if (updateError) {
      if (isEmailAlreadyRegistered(updateError)) {
        setEmailTaken(true);
      } else {
        setError(updateError.message);
      }
      setLoading(false);
      return;
    }

    // The trial's profile row already exists (default on), so only an
    // opt-out needs saving.
    if (!digestEnabled) await saveDigestEnabled(false);

    if (data.user && !data.user.is_anonymous) {
      router.refresh();
      return;
    }

    setMessage(
      "Check your email to confirm — once you do, this trial becomes your account and your data stays.",
    );
    setLoading(false);
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.blurb}>
        You&apos;re trying Purrsist without an account. Add an email and
        password to keep your captures across devices — same data, no restart.
      </p>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="save-email">
          Email
        </label>
        <input
          id="save-email"
          className={authStyles.input}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className={authStyles.field}>
        <label className={authStyles.label} htmlFor="save-password">
          Password
        </label>
        <input
          id="save-password"
          className={authStyles.input}
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? <p className={authStyles.error}>{error}</p> : null}
      {emailTaken ? (
        <p className={styles.takenNote}>
          That email already has an account.{" "}
          <LogInInsteadButton>Log in instead</LogInInsteadButton>.
        </p>
      ) : null}
      {message ? <p className={authStyles.message}>{message}</p> : null}

      <DigestOptIn
        id="save-digest-opt-in"
        checked={digestEnabled}
        onChange={setDigestEnabled}
      />

      <Button variant="primary" type="submit" disabled={loading} className={authStyles.submit}>
        {loading ? "Saving…" : "Save my account"}
      </Button>

      <p className={authStyles.switch}>
        Already have an account? <LogInInsteadButton />
      </p>
    </form>
  );
}
