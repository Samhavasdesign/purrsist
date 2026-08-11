-- Weekly Stray Cat Rescue (PRD §7 / §10)
-- Cat: fixed pre-made set. CatRescued: append-only per user/week.
-- banner_shown_at: one-time Today "rescue toast" acknowledgement.

create extension if not exists "pgcrypto";

create table if not exists public.cats (
  id text primary key,
  sequence_order integer not null unique,
  name text not null unique,
  -- Key into in-app CatPortrait map (same as name for the MVP set).
  image_key text not null
);

create table if not exists public.cat_rescued (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cat_id text not null references public.cats (id),
  week_start_date date not null,
  banner_shown_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, week_start_date),
  unique (user_id, cat_id)
);

create index if not exists cat_rescued_user_week_idx
  on public.cat_rescued (user_id, week_start_date desc);

create index if not exists cat_rescued_user_banner_idx
  on public.cat_rescued (user_id, banner_shown_at)
  where banner_shown_at is null;

alter table public.cats enable row level security;
alter table public.cat_rescued enable row level security;

drop policy if exists "cats_select_all" on public.cats;
drop policy if exists "cat_rescued_select_own" on public.cat_rescued;
drop policy if exists "cat_rescued_update_own" on public.cat_rescued;

-- Catalog is global read-only for authenticated users.
-- Inserts (rescues) are written by service-role Weekly Recap jobs, not clients.
create policy "cats_select_all"
  on public.cats for select
  to authenticated
  using (true);

create policy "cat_rescued_select_own"
  on public.cat_rescued for select
  using (auth.uid() = user_id);

-- Users may only acknowledge the banner (set banner_shown_at); they cannot
-- invent rescues. Restrict updates via RLS + column check is imperfect in
-- Postgres RLS alone — app code only updates banner_shown_at.
create policy "cat_rescued_update_own"
  on public.cat_rescued for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.cats (id, sequence_order, name, image_key) values
  ('cat-1', 1, 'Mochi', 'Mochi'),
  ('cat-2', 2, 'Biscuit', 'Biscuit'),
  ('cat-3', 3, 'Noodle', 'Noodle'),
  ('cat-4', 4, 'Pickles', 'Pickles'),
  ('cat-5', 5, 'Toast', 'Toast'),
  ('cat-6', 6, 'Bean', 'Bean')
on conflict (id) do update set
  sequence_order = excluded.sequence_order,
  name = excluded.name,
  image_key = excluded.image_key;

notify pgrst, 'reload schema';

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('cats', 'cat_rescued')
order by table_name;
