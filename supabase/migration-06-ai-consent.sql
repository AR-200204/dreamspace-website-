-- =====================================================================
-- DreamSpace migration 06: consent for AI features.
-- Run ONCE in Supabase -> SQL Editor, AFTER migration-05-people.sql.
--
-- Two kinds of consent:
--   1. A person agrees once before using any AI feature (profiles.ai_consent_*).
--   2. A dream is only ever sent to the AI if its author turned on "Allow AI interpretation"
--      for that dream (dreams.allow_ai, off by default).
-- =====================================================================

alter table public.dreams add column allow_ai boolean not null default false;
alter table public.profiles
  add column ai_consent_at timestamptz,
  add column ai_consent_version integer;

-- ---------- Views: expose allow_ai (added at the end so existing columns keep their order) ----------
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
  d.image_url,
  d.allow_ai
from public.dreams d
join public.profiles p on p.id = d.user_id
where d.visibility in ('public', 'anonymous')
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
  d.image_url,
  d.allow_ai
from public.dreams d
join public.profiles p on p.id = d.user_id
where d.user_id = auth.uid();

-- ---------- Create / edit dreams with the new option ----------
drop function public.create_dream(text, text, text, date, public.dream_visibility, text[], text);
drop function public.update_dream(uuid, text, text, text, date, public.dream_visibility, text[], text);

create function public.create_dream(
  p_title text, p_body text, p_mood text, p_dream_date date,
  p_visibility public.dream_visibility, p_tags text[],
  p_image_url text default null, p_allow_ai boolean default false
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

  insert into public.dreams (user_id, slug, title, body, mood, dream_date, visibility, image_url, allow_ai)
  values (v_user, v_slug, trim(p_title), trim(p_body), nullif(p_mood, ''),
          coalesce(p_dream_date, current_date), p_visibility, nullif(p_image_url, ''),
          coalesce(p_allow_ai, false) and p_visibility <> 'private')
  returning id into v_id;

  perform public.set_dream_tags(v_id, p_tags);
  return v_slug;
end $$;

create function public.update_dream(
  p_id uuid, p_title text, p_body text, p_mood text, p_dream_date date,
  p_visibility public.dream_visibility, p_tags text[],
  p_image_url text default null, p_allow_ai boolean default false
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_slug text;
  v_allow boolean := coalesce(p_allow_ai, false) and p_visibility <> 'private';
begin
  if v_user is null then raise exception 'You need to be signed in.'; end if;
  if public.is_banned() then raise exception 'Your account is restricted.'; end if;

  update public.dreams
     set title = trim(p_title), body = trim(p_body), mood = nullif(p_mood, ''),
         dream_date = coalesce(p_dream_date, dream_date), visibility = p_visibility,
         image_url = nullif(p_image_url, ''), allow_ai = v_allow, updated_at = now()
   where id = p_id and user_id = v_user
   returning slug into v_slug;

  if v_slug is null then raise exception 'Dream not found.'; end if;
  perform public.set_dream_tags(p_id, p_tags);

  -- Turning AI off (or making the dream private) also deletes any AI text made from it.
  if not v_allow then
    delete from public.ai_interpretations where dream_id = p_id;
  end if;
  return v_slug;
end $$;

grant execute on function public.create_dream(text, text, text, date, public.dream_visibility, text[], text, boolean) to authenticated;
grant execute on function public.update_dream(uuid, text, text, text, date, public.dream_visibility, text[], text, boolean) to authenticated;
revoke execute on function public.create_dream(text, text, text, date, public.dream_visibility, text[], text, boolean) from anon, public;
revoke execute on function public.update_dream(uuid, text, text, text, date, public.dream_visibility, text[], text, boolean) from anon, public;
