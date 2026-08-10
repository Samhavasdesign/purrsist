-- Purrsist habits (idempotent). Run in project evjzpucjjxstfxgyvczr SQL Editor.
-- You MUST see a final result with two rows: habits + habit_check_ins.

create extension if not exists "pgcrypto";

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.habit_check_ins (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  done boolean not null default false,
  unique (habit_id, date)
);

create index if not exists habits_user_active_idx on public.habits (user_id, active);
create index if not exists habit_check_ins_user_date_idx on public.habit_check_ins (user_id, date);

alter table public.habits enable row level security;
alter table public.habit_check_ins enable row level security;

drop policy if exists "habits_select_own" on public.habits;
drop policy if exists "habits_insert_own" on public.habits;
drop policy if exists "habits_update_own" on public.habits;
drop policy if exists "habits_delete_own" on public.habits;
drop policy if exists "habit_check_ins_select_own" on public.habit_check_ins;
drop policy if exists "habit_check_ins_insert_own" on public.habit_check_ins;
drop policy if exists "habit_check_ins_update_own" on public.habit_check_ins;
drop policy if exists "habit_check_ins_delete_own" on public.habit_check_ins;

create policy "habits_select_own"
  on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert_own"
  on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own"
  on public.habits for update using (auth.uid() = user_id);
create policy "habits_delete_own"
  on public.habits for delete using (auth.uid() = user_id);

create policy "habit_check_ins_select_own"
  on public.habit_check_ins for select using (auth.uid() = user_id);
create policy "habit_check_ins_insert_own"
  on public.habit_check_ins for insert with check (auth.uid() = user_id);
create policy "habit_check_ins_update_own"
  on public.habit_check_ins for update using (auth.uid() = user_id);
create policy "habit_check_ins_delete_own"
  on public.habit_check_ins for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';

-- Verification: this must return 2 rows. If it returns 0, tables are not in this project.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('habits', 'habit_check_ins')
order by table_name;
