import { describe, expect, it } from "vitest";
import { readLinkError, withoutLinkError } from "@/lib/supabase/link-error";

const EXPIRED_QUERY =
  "?error=access_denied&error_code=otp_expired&error_description=Email%20link%20is%20invalid%20or%20has%20expired";
const EXPIRED_HASH =
  "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired&sb=";

describe("readLinkError", () => {
  it("explains an expired or used link", () => {
    expect(readLinkError(EXPIRED_QUERY, EXPIRED_HASH)?.title).toBe(
      "That email link didn't work",
    );
  });

  it("reads errors that only arrive in the hash", () => {
    expect(readLinkError("", EXPIRED_HASH)?.title).toBe(
      "That email link didn't work",
    );
  });

  it("falls back to Supabase's description for other errors", () => {
    expect(
      readLinkError("?error=server_error&error_description=Database+error", ""),
    ).toEqual({ title: "Couldn't sign you in", detail: "Database error" });
  });

  it("ignores ordinary URLs", () => {
    expect(readLinkError("?next=/dashboard", "")).toBeNull();
  });
});

describe("withoutLinkError", () => {
  it("strips the error params and hash, keeping the rest", () => {
    expect(
      withoutLinkError(
        `https://www.purrsist.co/dashboard${EXPIRED_QUERY}&tab=today${EXPIRED_HASH}`,
      ),
    ).toBe("https://www.purrsist.co/dashboard?tab=today");
  });
});
