-- The "Still on your list" email goes out at 7am in each user's own timezone.
-- `timezone` is the browser's IANA zone, saved on app load; null falls back to
-- DIGEST_TIMEZONE. `last_digest_on` is the user-local date the email last went
-- out, so the hourly cron sends at most once per local day. `digest_enabled`
-- is the user's on/off switch (Account settings, or the link in the email).

alter table public.profiles
  add column if not exists timezone text,
  add column if not exists last_digest_on date,
  add column if not exists digest_enabled boolean not null default true;
