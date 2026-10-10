-- =====================================================================
-- DreamSpace migration 03: spam limits + dream streaks.
-- Run ONCE in Supabase -> SQL Editor, AFTER migration-02-features.sql.
-- =====================================================================

-- ---------- Rate limits (enforced in the database, so they can't be bypassed) ----------
-- Admins are exempt. Each limit raises a friendly message the website shows to the user.

create function public.limit_dream_posts() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.admins where user_id = new.user_id) then return new; end if;
  if (select count(*) from public.dreams
      where user_id = new.user_id and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'You have shared a lot of dreams today. Please try again tomorrow.';
  end if;
  return new;
end $$;
create trigger dreams_rate_limit before insert on public.dreams
  for each row execute function public.limit_dream_posts();

create function public.limit_comments() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.admins where user_id = new.user_id) then return new; end if;
  if (select count(*) from public.comments
      where user_id = new.user_id and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'You are commenting very quickly. Please wait a little while and try again.';
  end if;
  return new;
end $$;
create trigger comments_rate_limit before insert on public.comments
  for each row execute function public.limit_comments();

create function public.limit_reports() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.reports
      where reporter_id = new.reporter_id and created_at > now() - interval '24 hours') >= 15 then
    raise exception 'You have sent many reports today. Please try again tomorrow.';
  end if;
  return new;
end $$;
create trigger reports_rate_limit before insert on public.reports
  for each row execute function public.limit_reports();

create function public.limit_follows() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.follows
      where follower_id = new.follower_id and created_at > now() - interval '24 hours') >= 100 then
    raise exception 'You have followed a lot of people today. Please try again tomorrow.';
  end if;
  return new;
end $$;
create trigger follows_rate_limit before insert on public.follows
  for each row execute function public.limit_follows();

-- ---------- Dream streaks (private: each person can only see their own) ----------
-- Counts every day you logged a dream (any visibility). A streak stays alive if your
-- last dream was today or yesterday, which also keeps it fair across time zones.
create function public.my_streak() returns json
language sql security definer stable set search_path = public as $$
  with days as (
    select distinct dream_date as d from public.dreams where user_id = auth.uid()
  ),
  grouped as (
    select d, d - (row_number() over (order by d))::int as grp from days
  ),
  runs as (
    select min(d) as started, max(d) as ended, count(*)::int as len from grouped group by grp
  )
  select json_build_object(
    'current',   coalesce((select len from runs where ended >= current_date - 1 order by ended desc limit 1), 0),
    'longest',   coalesce((select max(len) from runs), 0),
    'days',      (select count(*)::int from days),
    'has_today', coalesce((select max(d) from days) >= current_date, false)
  );
$$;
grant execute on function public.my_streak() to authenticated;
revoke execute on function public.my_streak() from anon, public;
