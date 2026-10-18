-- =====================================================================
-- DreamSpace migration 05: discover people, follow suggestions, username changes.
-- Run ONCE in Supabase -> SQL Editor, AFTER migration-04-insights.sql.
--
-- Privacy: only PUBLIC (named) dreams are ever used to suggest a person.
-- Someone who only posts anonymously never appears in any people list.
-- =====================================================================

-- ---------- Username changes: once every 30 days ----------
alter table public.profiles add column username_changed_at timestamptz;

create function public.limit_username_changes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.username_changed_at is not null and old.username_changed_at > now() - interval '30 days' then
    raise exception 'You can change your username once every 30 days.';
  end if;
  new.username_changed_at := now();
  return new;
end $$;
create trigger profiles_username_limit before update on public.profiles
  for each row when (old.username is distinct from new.username)
  execute function public.limit_username_changes();

-- ---------- Suggested dreamers: popular people you don't follow yet ----------
create function public.suggested_dreamers(p_limit int default 12)
returns table (id uuid, username text, avatar_url text, bio text, followers int, public_dreams int)
language sql security definer stable set search_path = public as $$
  select p.id, p.username, p.avatar_url, p.bio,
         (select count(*)::int from public.follows f where f.followee_id = p.id),
         (select count(*)::int from public.dreams d where d.user_id = p.id and d.visibility = 'public')
  from public.profiles p
  where exists (select 1 from public.dreams d where d.user_id = p.id and d.visibility = 'public')
    and p.id is distinct from auth.uid()
    and not exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.followee_id = p.id)
    and not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = p.id)
    and not exists (select 1 from public.bans bn where bn.user_id = p.id)
  order by 5 desc, 6 desc, p.created_at desc
  limit least(greatest(p_limit, 1), 30);
$$;

-- ---------- Dreamers like you: people whose PUBLIC dreams share tags with any of yours ----------
create function public.similar_dreamers(p_limit int default 8)
returns table (id uuid, username text, avatar_url text, bio text, shared_tags text[], followers int)
language sql security definer stable set search_path = public as $$
  with my_tags as (
    select distinct t.id, t.name
    from public.dreams d
    join public.dream_tags dt on dt.dream_id = d.id
    join public.tags t on t.id = dt.tag_id
    where d.user_id = auth.uid() and t.name <> 'dream-of-the-day'
  ),
  theirs as (
    select d.user_id, array_agg(distinct m.name order by m.name) as shared
    from public.dreams d
    join public.dream_tags dt on dt.dream_id = d.id
    join my_tags m on m.id = dt.tag_id
    where d.visibility = 'public' and d.user_id <> auth.uid()
    group by d.user_id
  )
  select p.id, p.username, p.avatar_url, p.bio, th.shared,
         (select count(*)::int from public.follows f where f.followee_id = p.id)
  from theirs th
  join public.profiles p on p.id = th.user_id
  where not exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.followee_id = p.id)
    and not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = p.id)
    and not exists (select 1 from public.bans bn where bn.user_id = p.id)
  order by cardinality(th.shared) desc, 6 desc
  limit least(greatest(p_limit, 1), 30);
$$;

-- ---------- Search people by username ----------
create function public.search_people(p_q text, p_limit int default 10)
returns table (id uuid, username text, avatar_url text, bio text, followers int, public_dreams int)
language sql security definer stable set search_path = public as $$
  select p.id, p.username, p.avatar_url, p.bio,
         (select count(*)::int from public.follows f where f.followee_id = p.id),
         (select count(*)::int from public.dreams d where d.user_id = p.id and d.visibility = 'public')
  from public.profiles p
  where char_length(trim(p_q)) >= 2
    and position(lower(trim(p_q)) in lower(p.username)) > 0
    and not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = p.id)
    and not exists (select 1 from public.bans bn where bn.user_id = p.id)
  order by (lower(p.username) = lower(trim(p_q))) desc, 5 desc, p.username
  limit least(greatest(p_limit, 1), 30);
$$;

grant execute on function public.suggested_dreamers(int) to anon, authenticated;
grant execute on function public.search_people(text, int) to anon, authenticated;
grant execute on function public.similar_dreamers(int) to authenticated;
revoke execute on function public.similar_dreamers(int) from anon, public;
