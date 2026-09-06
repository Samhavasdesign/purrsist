-- Carryover never actually ran: past days were locked (ensurePastDaysLocked)
-- before applyCarryoverFromYesterday could read them, so it always bailed on
-- `yesterday.locked`. The new sweep pulls unresolved tasks forward from every
-- recent past day, and this flag marks a day as consumed so it is pulled
-- forward exactly once — including the already-locked backlog of days that
-- accumulated while carryover was broken.

alter table public.daily_entries
  add column if not exists carryover_swept boolean not null default false;
