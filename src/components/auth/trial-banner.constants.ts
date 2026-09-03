/**
 * Shared between the client `TrialBanner` (sets it on dismiss) and the server
 * dashboard page (skips the banner when it's present). Kept in its own module so
 * the server can import it without pulling in the `"use client"` component.
 */
export const TRIAL_BANNER_DISMISSED_COOKIE = "purrsist_trial_banner_dismissed";
