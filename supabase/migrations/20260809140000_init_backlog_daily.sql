-- Purrsist v1.0 core tables (PRD §10)
-- Backlog + Daily Entry scaffolding for promote-to-today

create extension if not exists "pgcrypto";

create type public.significance as enum ('red', 'yellow', 'green');
create type public.backlog_tag as enum (
  'task',
  'errand',
  'reminder',
  'shopping',
  'uncategorized'
);
create type public.backlog_status as enum ('active', 'done', 'archived');
create type public.daily_slot as enum (
  'must_do',
  'should_do_1',
  'should_do_2',
  'quick_win_1',
  'quick_win_2',
  'quick_win_3'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  last_capture_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  must_do_text text,
  must_do_done boolean not null default false,
  must_do_carryover_count integer not null default 0,
  should_do_1_text text,
  should_do_1_done boolean not null default false,
  should_do_1_carryover_count integer not null default 0,
  should_do_2_text text,
  should_do_2_done boolean not null default false,
  should_do_2_carryover_count integer not null default 0,
  quick_win_1_text text,
  quick_win_1_done boolean not null default false,
  quick_win_1_carryover_count integer not null default 0,
  quick_win_2_text text,
  quick_win_2_done boolean not null default false,
  quick_win_2_carryover_count integer not null default 0,
  quick_win_3_text text,
  quick_win_3_done boolean not null default false,
  quick_win_3_carryover_count integer not null default 0,
  daily_reminder text,
  locked boolean not null default false,
  morning_digest_sent boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.backlog_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  normalized_text text not null,
  significance public.significance not null,
  tag public.backlog_tag not null default 'uncategorized',
  ai_placement public.daily_slot,
  target_date date,
  status public.backlog_status not null default 'active',
  created_at timestamptz not null default now(),
  last_touched_at timestamptz not null default now(),
  promoted_to_entry_id uuid references public.daily_entries (id) on delete set null,
  promoted_to_slot public.daily_slot
);

create index backlog_items_user_status_idx
  on public.backlog_items (user_id, status, created_at desc);
create index backlog_items_user_target_date_idx
  on public.backlog_items (user_id, target_date)
  where target_date is not null and status = 'active';
create index daily_entries_user_date_idx
  on public.daily_entries (user_id, date desc);

alter table public.profiles enable row level security;
alter table public.daily_entries enable row level security;
alter table public.backlog_items enable row level security;

create policy "profiles_select_own"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own"
  on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id);

create policy "daily_entries_select_own"
  on public.daily_entries for select using (auth.uid() = user_id);
create policy "daily_entries_insert_own"
  on public.daily_entries for insert with check (auth.uid() = user_id);
create policy "daily_entries_update_own"
  on public.daily_entries for update using (auth.uid() = user_id);

create policy "backlog_items_select_own"
  on public.backlog_items for select using (auth.uid() = user_id);
create policy "backlog_items_insert_own"
  on public.backlog_items for insert with check (auth.uid() = user_id);
create policy "backlog_items_update_own"
  on public.backlog_items for update using (auth.uid() = user_id);
create policy "backlog_items_delete_own"
  on public.backlog_items for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
