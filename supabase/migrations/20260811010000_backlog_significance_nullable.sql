-- Allow backlog captures without a significance until promote-to-today.
alter table public.backlog_items
  alter column significance drop not null;
