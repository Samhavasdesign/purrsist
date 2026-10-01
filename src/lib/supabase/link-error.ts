/**
 * Supabase sends people back with the reason a confirmation or magic link
 * failed in the URL — in the query, the hash, or both — e.g.
 * `?error=access_denied&error_code=otp_expired&error_description=…`.
 * The app used to ignore these, so a dead link just dropped people on Today.
 */

export type LinkError = {
  title: string;
  detail: string;
};

const ERROR_KEYS = ["error", "error_code", "error_description"];

function readParams(search: string, hash: string): URLSearchParams {
  const params = new URLSearchParams(search);
  const fromHash = new URLSearchParams(hash.replace(/^#/, ""));
  for (const [key, value] of fromHash) {
    if (!params.has(key)) params.set(key, value);
  }
  return params;
}

/** The notice to show for a failed auth link, or null when the URL has none. */
export function readLinkError(search: string, hash: string): LinkError | null {
  const params = readParams(search, hash);
  const code = params.get("error_code");
  const error = params.get("error");
  if (!code && !error) return null;

  if (code === "otp_expired") {
    return {
      title: "That email link didn't work",
      detail:
        "It expired or was already used. Request a new one and open the newest email.",
    };
  }

  const description = params.get("error_description")?.trim();
  return {
    title: "Couldn't sign you in",
    detail: description || "Something went wrong with that link. Try again.",
  };
}

/** The same URL with the error params (and an error-only hash) removed. */
export function withoutLinkError(href: string): string {
  const url = new URL(href);
  for (const key of ERROR_KEYS) url.searchParams.delete(key);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  if (ERROR_KEYS.some((key) => hash.has(key))) url.hash = "";
  return url.toString();
}
