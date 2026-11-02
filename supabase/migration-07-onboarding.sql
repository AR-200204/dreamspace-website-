-- =====================================================================
-- DreamSpace migration 07: onboarding (the welcome tour for new people).
-- Run ONCE in Supabase -> SQL Editor, AFTER migration-06-ai-consent.sql.
-- =====================================================================

alter table public.profiles
  add column onboarded_at timestamptz,
  add column goals text[] not null default '{}',
  add column default_visibility public.dream_visibility not null default 'anonymous';

-- Only these goals are allowed.
alter table public.profiles add constraint profiles_goals_check
  check (goals <@ array['remember', 'lucid', 'sleep', 'share', 'patterns']::text[]);

-- People who already have an account are not sent through the tour. Only new sign-ups are.
-- (Anyone can replay it from Settings.)
update public.profiles set onboarded_at = now() where onboarded_at is null;
