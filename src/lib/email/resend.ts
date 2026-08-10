import { Resend } from "resend";

export function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("Missing RESEND_API_KEY");
  }
  return new Resend(key);
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? "Purrsist <onboarding@resend.dev>";
}
