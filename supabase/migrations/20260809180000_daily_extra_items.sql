-- Extra daily items beyond the default 1 Must-Do / 2 Should-Dos / 3 Quick Wins.
-- Shape: [{ id, kind: 'must_do'|'should_do'|'quick_win', text, done, carryover_count }]

alter table public.daily_entries
  add column if not exists extra_items jsonb not null default '[]'::jsonb;
