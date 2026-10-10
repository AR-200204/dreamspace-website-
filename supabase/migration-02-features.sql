-- =====================================================================
-- DreamSpace migration 02: bookmarks, follows, notifications, blocks,
-- edit dream, images (Storage), AI interpretations, admin, badges.
--
-- Run ONCE in Supabase -> SQL Editor, AFTER schema.sql. Do not run it twice.
-- =====================================================================

-- ---------- Admins and bans (no one can read these through the API) ----------
create table public.admins (
  user_id uuid primary key references public.profiles(id) on delete cascade
);
alter table public.admins enable row level security;

create table public.bans (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  reason     text,
  created_at timestamptz not null default now()
);
alter table public.bans enable row level security;

create function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create function public.is_banned() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.bans where user_id = auth.uid());
$$;

-- Banned users can no longer post, comment, react or follow.
drop policy "Owner inserts own dreams" on public.dreams;
create policy "Owner inserts own dreams" on public.dreams for insert
  with check (user_id = auth.uid() and not public.is_banned());
drop policy "Signed-in users comment on public dreams" on public.comments;
create policy "Signed-in users comment on public dreams" on public.comments for insert
  with check (user_id = auth.uid() and public.dream_is_public(dream_id) and not public.is_banned());
drop policy "Users react to public dreams" on public.reactions;
create policy "Users react to public dreams" on public.reactions for insert
  with check (user_id = auth.uid() and public.dream_is_public(dream_id) and not public.is_banned());

-- ---------- Images ----------
alter table public.dreams add column image_url text;
alter table public.dreams add constraint dreams_image_url_check
  check (image_url is null or image_url like 'https://%/storage/v1/object/public/dream-images/%');
alter table public.profiles add constraint profiles_avatar_url_check
  check (avatar_url is null or avatar_url like 'https://%/storage/v1/object/public/avatars/%');

-- Storage buckets. File names are random (they do NOT contain the user id),
-- so an image on an anonymous dream can't be traced back to its author.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('dream-images', 'dream-images', true, 2097152, array['image/webp', 'image/jpeg', 'image/png']),
  ('avatars',      'avatars',      true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "Signed-in users upload images" on storage.objects for insert to authenticated
  with check (bucket_id in ('dream-images', 'avatars') and not public.is_banned());
-- Deleting needs a matching SELECT rule too; owners can only see/delete their own files.
create policy "Owners see their images" on storage.objects for select to authenticated
  using (bucket_id in ('dream-images', 'avatars') and owner_id = (select auth.uid())::text);
create policy "Owners delete their images" on storage.objects for delete to authenticated
  using (bucket_id in ('dream-images', 'avatars') and owner_id = (select auth.uid())::text);

-- ---------- Blocks ----------
create table public.blocks (
  blocker_id  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "Users see own blocks"   on public.blocks for select using (blocker_id = auth.uid());
create policy "Users block"            on public.blocks for insert with check (blocker_id = auth.uid());
create policy "Users unblock"          on public.blocks for delete using (blocker_id = auth.uid());

-- ---------- Bookmarks ----------
create table public.bookmarks (
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  dream_id    uuid not null references public.dreams(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, dream_id)
);
alter table public.bookmarks enable row level security;
create policy "Users see own bookmarks" on public.bookmarks for select using (user_id = auth.uid());
create policy "Users bookmark public dreams" on public.bookmarks for insert
  with check (user_id = auth.uid() and public.dream_is_public(dream_id));
create policy "Users remove own bookmarks" on public.bookmarks for delete using (user_id = auth.uid());

-- ---------- Follows ----------
create table public.follows (
  follower_id  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  followee_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);
alter table public.follows enable row level security;
create policy "Follows are public"  on public.follows for select using (true);
create policy "Users follow"        on public.follows for insert
  with check (follower_id = auth.uid() and not public.is_banned());
create policy "Users unfollow"      on public.follows for delete using (follower_id = auth.uid());

-- ---------- Notifications ----------
create table public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  actor_id       uuid references public.profiles(id) on delete cascade,
  type           text not null check (type in ('reaction', 'comment', 'reply', 'follow', 'mention')),
  dream_id       uuid references public.dreams(id) on delete cascade,
  comment_id     uuid references public.comments(id) on delete cascade,
  reaction_type  text,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create unique index notifications_reaction_once on public.notifications (user_id, actor_id, dream_id) where type = 'reaction';
create unique index notifications_follow_once   on public.notifications (user_id, actor_id) where type = 'follow';
alter table public.notifications enable row level security;  -- read only through my_notifications

create function public.notify(p_user uuid, p_actor uuid, p_type text, p_dream uuid, p_comment uuid, p_reaction text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or p_user = p_actor then return; end if;
  if exists (select 1 from public.blocks where blocker_id = p_user and blocked_id = p_actor) then return; end if;
  insert into public.notifications (user_id, actor_id, type, dream_id, comment_id, reaction_type)
  values (p_user, p_actor, p_type, p_dream, p_comment, p_reaction)
  on conflict do nothing;
end $$;

create function public.on_reaction_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify((select user_id from public.dreams where id = new.dream_id),
                        new.user_id, 'reaction', new.dream_id, null, new.type);
  return new;
end $$;
create trigger reaction_notify after insert on public.reactions
  for each row execute function public.on_reaction_created();

create function public.on_comment_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_target uuid;
  v_name text;
  v_mentioned uuid;
begin
  if new.parent_id is null then
    select user_id into v_target from public.dreams where id = new.dream_id;
    perform public.notify(v_target, new.user_id, 'comment', new.dream_id, new.id, null);
  else
    select user_id into v_target from public.comments where id = new.parent_id;
    perform public.notify(v_target, new.user_id, 'reply', new.dream_id, new.id, null);
  end if;

  for v_name in
    select distinct lower(m[1]) from regexp_matches(new.body, '@([A-Za-z0-9_]{3,20})', 'g') as m
  loop
    select id into v_mentioned from public.profiles where lower(username) = v_name;
    if v_mentioned is not null and v_mentioned is distinct from v_target then
      perform public.notify(v_mentioned, new.user_id, 'mention', new.dream_id, new.id, null);
    end if;
  end loop;
  return new;
end $$;
create trigger comment_notify after insert on public.comments
  for each row execute function public.on_comment_created();

create function public.on_follow_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify(new.followee_id, new.follower_id, 'follow', null, null, null);
  return new;
end $$;
create trigger follow_notify after insert on public.follows
  for each row execute function public.on_follow_created();

-- Who reacted is never revealed (reactions are anonymous); everyone else is named.
create view public.my_notifications as
select
  n.id, n.type, n.created_at, n.read_at, n.reaction_type,
  case when n.type = 'reaction' then null else p.username end as actor_username,
  d.slug as dream_slug, d.title as dream_title, n.comment_id
from public.notifications n
left join public.profiles p on p.id = n.actor_id
left join public.dreams d on d.id = n.dream_id
where n.user_id = auth.uid();

create function public.mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;

create function public.unread_notification_count() returns integer
language sql security definer stable set search_path = public as $$
  select count(*)::int from public.notifications where user_id = auth.uid() and read_at is null;
$$;

-- ---------- AI interpretations (written only by the server with the service key) ----------
create table public.ai_interpretations (
  id          uuid primary key default gen_random_uuid(),
  dream_id    uuid not null references public.dreams(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  question    text,
  answer      text not null,
  created_at  timestamptz not null default now()
);
create index ai_interpretations_dream_idx on public.ai_interpretations (dream_id, created_at);
create index ai_interpretations_user_idx  on public.ai_interpretations (user_id, created_at);
create unique index ai_one_summary_per_dream on public.ai_interpretations (dream_id) where question is null;
alter table public.ai_interpretations enable row level security;
create policy "Users read their own AI questions" on public.ai_interpretations for select using (user_id = auth.uid());

-- The general "possible meanings" text is shared with everyone (without who asked).
create view public.dream_ai_summaries as
select a.dream_id, a.answer, a.created_at
from public.ai_interpretations a
join public.dreams d on d.id = a.dream_id
where a.question is null and d.visibility in ('public', 'anonymous');
grant select on public.dream_ai_summaries to anon, authenticated;

-- ---------- Views: add images and hide blocked users ----------
create or replace view public.public_dreams as
select
  d.id, d.slug, d.title, d.body, d.mood, d.dream_date, d.visibility, d.view_count, d.created_at,
  case when d.visibility = 'public' then d.user_id end    as author_id,
  case when d.visibility = 'public' then p.username end   as author_username,
  case when d.visibility = 'public' then p.avatar_url end as author_avatar,
  coalesce((select array_agg(t.name order by t.name)
            from public.dream_tags dt join public.tags t on t.id = dt.tag_id
            where dt.dream_id = d.id), '{}') as tags,
  (select count(*) from public.reactions r where r.dream_id = d.id)::int as reaction_count,
  (select count(*) from public.comments c where c.dream_id = d.id and not c.is_hidden)::int as comment_count,
  d.image_url
from public.dreams d
join public.profiles p on p.id = d.user_id
where d.visibility in ('public', 'anonymous')
  -- Blocking only hides NAMED dreams. Hiding anonymous ones would reveal who wrote them.
  and not (d.visibility = 'public' and exists (
        select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = d.user_id));

create or replace view public.my_dreams as
select
  d.id, d.slug, d.title, d.body, d.mood, d.dream_date, d.visibility, d.view_count, d.created_at,
  d.user_id as author_id, p.username as author_username, p.avatar_url as author_avatar,
  coalesce((select array_agg(t.name order by t.name)
            from public.dream_tags dt join public.tags t on t.id = dt.tag_id
            where dt.dream_id = d.id), '{}') as tags,
  (select count(*) from public.reactions r where r.dream_id = d.id)::int as reaction_count,
  (select count(*) from public.comments c where c.dream_id = d.id and not c.is_hidden)::int as comment_count,
  d.image_url
from public.dreams d
join public.profiles p on p.id = d.user_id
where d.user_id = auth.uid();

create or replace view public.public_comments as
select
  c.id, c.dream_id, c.parent_id, c.body, c.is_interpretation, c.created_at,
  (c.user_id = d.user_id) as is_dream_author,
  (c.user_id = auth.uid()) as is_mine,
  case when d.visibility = 'anonymous' and c.user_id = d.user_id then null else c.user_id end  as author_id,
  case when d.visibility = 'anonymous' and c.user_id = d.user_id then null else p.username end as author_username
from public.comments c
join public.dreams d on d.id = c.dream_id
join public.profiles p on p.id = c.user_id
where d.visibility in ('public', 'anonymous') and not c.is_hidden
  and not (
    exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = c.user_id)
    and not (d.visibility = 'anonymous' and c.user_id = d.user_id));

-- ---------- Create / edit dreams ----------
create function public.set_dream_tags(p_dream uuid, p_tags text[]) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_tag text;
  v_tag_id uuid;
  v_count int := 0;
begin
  delete from public.dream_tags where dream_id = p_dream;
  foreach v_tag in array coalesce(p_tags, '{}') loop
    v_tag := lower(regexp_replace(trim(v_tag), '[^a-zA-Z0-9-]+', '', 'g'));
    continue when v_tag !~ '^[a-z0-9-]{2,24}$';
    exit when v_count >= 8;
    insert into public.tags (name) values (v_tag) on conflict (name) do nothing;
    select id into v_tag_id from public.tags where name = v_tag;
    insert into public.dream_tags (dream_id, tag_id) values (p_dream, v_tag_id) on conflict do nothing;
    v_count := v_count + 1;
  end loop;
end $$;
revoke execute on function public.set_dream_tags(uuid, text[]) from public, anon, authenticated;

drop function public.create_dream(text, text, text, date, public.dream_visibility, text[]);

create function public.create_dream(
  p_title text, p_body text, p_mood text, p_dream_date date,
  p_visibility public.dream_visibility, p_tags text[], p_image_url text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_slug text;
  v_id uuid;
begin
  if v_user is null then raise exception 'You need to be signed in.'; end if;
  if public.is_banned() then raise exception 'Your account is restricted.'; end if;

  v_slug := trim(both '-' from regexp_replace(lower(left(p_title, 60)), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then v_slug := 'dream'; end if;
  v_slug := v_slug || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);

  insert into public.dreams (user_id, slug, title, body, mood, dream_date, visibility, image_url)
  values (v_user, v_slug, trim(p_title), trim(p_body), nullif(p_mood, ''),
          coalesce(p_dream_date, current_date), p_visibility, nullif(p_image_url, ''))
  returning id into v_id;

  perform public.set_dream_tags(v_id, p_tags);
  return v_slug;
end $$;

create function public.update_dream(
  p_id uuid, p_title text, p_body text, p_mood text, p_dream_date date,
  p_visibility public.dream_visibility, p_tags text[], p_image_url text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_slug text;
begin
  if v_user is null then raise exception 'You need to be signed in.'; end if;
  if public.is_banned() then raise exception 'Your account is restricted.'; end if;

  update public.dreams
     set title = trim(p_title), body = trim(p_body), mood = nullif(p_mood, ''),
         dream_date = coalesce(p_dream_date, dream_date), visibility = p_visibility,
         image_url = nullif(p_image_url, ''), updated_at = now()
   where id = p_id and user_id = v_user
   returning slug into v_slug;

  if v_slug is null then raise exception 'Dream not found.'; end if;
  perform public.set_dream_tags(p_id, p_tags);
  return v_slug;
end $$;

grant execute on function public.create_dream(text, text, text, date, public.dream_visibility, text[], text) to authenticated;
grant execute on function public.update_dream(uuid, text, text, text, date, public.dream_visibility, text[], text) to authenticated;
revoke execute on function public.create_dream(text, text, text, date, public.dream_visibility, text[], text) from anon, public;
revoke execute on function public.update_dream(uuid, text, text, text, date, public.dream_visibility, text[], text) from anon, public;

-- ---------- Profile stats (used for badges) ----------
-- Counts only PUBLIC activity, so badges never hint at anonymous dreams.
create function public.profile_stats(p_user uuid) returns json
language sql security definer stable set search_path = public as $$
  select json_build_object(
    'dreams', (select count(*) from public.dreams where user_id = p_user and visibility = 'public'),
    'comments', (select count(*) from public.comments c join public.dreams d on d.id = c.dream_id
                 where c.user_id = p_user and not c.is_hidden and d.visibility in ('public', 'anonymous')
                   and not (d.visibility = 'anonymous' and d.user_id = c.user_id)),
    'reactions_received', (select count(*) from public.reactions r join public.dreams d on d.id = r.dream_id
                           where d.user_id = p_user and d.visibility = 'public'),
    'reactions_given', (select count(*) from public.reactions where user_id = p_user),
    'best_dream_reactions', coalesce((select max(cnt) from (
        select count(*) as cnt from public.reactions r join public.dreams d on d.id = r.dream_id
        where d.user_id = p_user and d.visibility = 'public' group by d.id) x), 0),
    'recurring_dreams', (select count(*) from public.dreams d
                         join public.dream_tags dt on dt.dream_id = d.id
                         join public.tags t on t.id = dt.tag_id
                         where d.user_id = p_user and d.visibility = 'public' and t.name = 'recurring'),
    'followers', (select count(*) from public.follows where followee_id = p_user),
    'following', (select count(*) from public.follows where follower_id = p_user)
  );
$$;
grant execute on function public.profile_stats(uuid) to anon, authenticated;

-- ---------- Admin functions (every one checks is_admin() first) ----------
create function public.admin_stats() returns json
language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return json_build_object(
    'total_users',    (select count(*) from public.profiles),
    'total_dreams',   (select count(*) from public.dreams),
    'dreams_today',   (select count(*) from public.dreams   where created_at >= date_trunc('day', now())),
    'comments_today', (select count(*) from public.comments where created_at >= date_trunc('day', now())),
    'active_users',   (select count(*) from (
                         select user_id from public.dreams    where created_at > now() - interval '7 days'
                         union select user_id from public.comments  where created_at > now() - interval '7 days'
                         union select user_id from public.reactions where created_at > now() - interval '7 days') x),
    'open_reports',   (select count(*) from public.reports where status = 'open'),
    'top_tags',       (select coalesce(json_agg(t), '[]'::json) from (
                         select tg.name, count(*)::int as uses
                         from public.dream_tags dt join public.tags tg on tg.id = dt.tag_id
                         group by tg.name order by uses desc, tg.name limit 10) t)
  );
end $$;

create function public.admin_reports(p_status text default 'open')
returns table (
  id uuid, reason text, details text, status text, created_at timestamptz, reporter_username text,
  dream_id uuid, dream_slug text, dream_title text,
  comment_id uuid, comment_body text, comment_dream_slug text,
  target_user_id uuid, target_username text
)
language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return query
  select r.id, r.reason, r.details, r.status, r.created_at, rp.username,
         d.id, d.slug, d.title,
         c.id, c.body, cd.slug,
         tp.id, tp.username
  from public.reports r
  join public.profiles rp on rp.id = r.reporter_id
  left join public.dreams d    on d.id = r.dream_id
  left join public.comments c  on c.id = r.comment_id
  left join public.dreams cd   on cd.id = c.dream_id
  left join public.profiles tp on tp.id = coalesce(d.user_id, c.user_id)
  where p_status = 'all' or r.status = p_status
  order by r.created_at desc
  limit 100;
end $$;

create function public.admin_dreams(p_limit int default 30, p_offset int default 0)
returns table (id uuid, slug text, title text, visibility text, created_at timestamptz,
               author_id uuid, author_username text, report_count int)
language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return query
  select d.id, d.slug, d.title, d.visibility::text, d.created_at, d.user_id, p.username,
         (select count(*)::int from public.reports r where r.dream_id = d.id)
  from public.dreams d join public.profiles p on p.id = d.user_id
  order by d.created_at desc
  limit least(p_limit, 100) offset greatest(p_offset, 0);
end $$;

create function public.admin_users(p_q text default '', p_limit int default 30, p_offset int default 0)
returns table (id uuid, username text, created_at timestamptz, dream_count int, comment_count int,
               banned boolean, is_admin boolean)
language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return query
  select p.id, p.username, p.created_at,
         (select count(*)::int from public.dreams d where d.user_id = p.id),
         (select count(*)::int from public.comments c where c.user_id = p.id),
         exists (select 1 from public.bans b where b.user_id = p.id),
         exists (select 1 from public.admins a where a.user_id = p.id)
  from public.profiles p
  where p_q = '' or p.username ilike '%' || p_q || '%'
  order by p.created_at desc
  limit least(p_limit, 100) offset greatest(p_offset, 0);
end $$;

create function public.admin_tags()
returns table (name text, featured boolean, uses int)
language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return query
  select t.name, t.featured, (select count(*)::int from public.dream_tags dt where dt.tag_id = t.id)
  from public.tags t order by t.featured desc, 3 desc, t.name;
end $$;

create function public.admin_set_report_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.reports set status = p_status where id = p_id;
end $$;

create function public.admin_delete_dream(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  delete from public.dreams where id = p_id;
end $$;

create function public.admin_set_comment_hidden(p_id uuid, p_hidden boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.comments set is_hidden = p_hidden where id = p_id;
end $$;

create function public.admin_ban_user(p_id uuid, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  if exists (select 1 from public.admins where user_id = p_id) then raise exception 'Admins cannot be banned.'; end if;
  insert into public.bans (user_id, reason) values (p_id, p_reason) on conflict (user_id) do nothing;
end $$;

create function public.admin_unban_user(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  delete from public.bans where user_id = p_id;
end $$;

create function public.admin_set_tag_featured(p_name text, p_featured boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.tags set featured = p_featured where name = p_name;
end $$;

create function public.admin_delete_tag(p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  delete from public.tags where name = p_name;
end $$;

-- Only signed-in users may call admin functions (and they still fail unless is_admin()).
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'admin\_%'
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;

-- ---------- Other permissions ----------
grant select on public.my_notifications to authenticated;
revoke execute on function public.notify(uuid, uuid, text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.mark_notifications_read() to authenticated;
grant execute on function public.unread_notification_count() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- =====================================================================
-- To make YOURSELF an admin, run this separately (replace the username):
--   insert into public.admins (user_id)
--   select id from public.profiles where username = 'YOUR_USERNAME';
-- =====================================================================
