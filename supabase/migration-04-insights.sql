-- =====================================================================
-- DreamSpace migration 04: stored AI pattern reports (private to each user).
-- Run ONCE in Supabase -> SQL Editor, AFTER migration-03-launch.sql.
-- The pattern finder itself needs no database changes.
-- =====================================================================

create table public.ai_pattern_reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  answer       text not null,
  dream_count  integer not null default 0,
  created_at   timestamptz not null default now()
);
create index ai_pattern_reports_user_idx on public.ai_pattern_reports (user_id, created_at desc);

-- Only the owner can read their reports. Nobody can write through the API:
-- reports are created by the server with the service key (so they can't be faked).
alter table public.ai_pattern_reports enable row level security;
create policy "Users read their own pattern reports" on public.ai_pattern_reports
  for select using (user_id = auth.uid());
