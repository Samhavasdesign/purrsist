"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ConfirmEmailNotice } from "./confirm-email-notice";
import { DigestOptIn } from "./digest-opt-in";
import { PasswordField } from "./password-field";
import styles from "./auth-form.module.css";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    if (isLogin) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Read by handle_new_user() into profiles.digest_enabled.
        data: { digest_enabled: digestEnabled },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Confirm-email off → session exists; land immediately (PRD §5).
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setConfirmationSentTo(email);
    setLoading(false);
  }

  if (confirmationSentTo) {
    return (
      <div className={styles.form}>
        <ConfirmEmailNotice email={confirmationSentTo} />
        <p className={styles.switch}>
          <Link className={styles.link} href="/login">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className={styles.input}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <PasswordField
        id="password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete={isLogin ? "current-password" : "new-password"}
        minLength={6}
        hint={isLogin ? undefined : "At least 6 characters."}
      />

      {isLogin ? null : (
        <PasswordField
          id="confirm-password"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          invalid={confirmPassword.length > 0 && confirmPassword !== password}
        />
      )}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className={styles.message}>{message}</p> : null}

      {isLogin ? null : (
        <DigestOptIn
          id="digest-opt-in"
          checked={digestEnabled}
          onChange={setDigestEnabled}
        />
      )}

      <Button variant="primary" type="submit" disabled={loading} className={styles.submit}>
        {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
      </Button>

      <p className={styles.switch}>
        {isLogin ? (
          <>
            Need an account?{" "}
            <Link className={styles.link} href="/signup">
              Sign up
            </Link>
            {" · "}
            <Link className={styles.link} href="/">
              Try it first
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link className={styles.link} href="/login">
              Sign in
            </Link>
            {" · "}
            <Link className={styles.link} href="/">
              Try it first
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
