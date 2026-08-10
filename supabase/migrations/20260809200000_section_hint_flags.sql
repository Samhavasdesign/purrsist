-- Persistent per-user flags: hide Daily Dashboard section subcopy after
-- the user has filled that section to default capacity once (not reset daily).

alter table public.profiles
  add column if not exists has_filled_must_do_once boolean not null default false;

alter table public.profiles
  add column if not exists has_filled_should_dos_once boolean not null default false;

alter table public.profiles
  add column if not exists has_filled_quick_wins_once boolean not null default false;
