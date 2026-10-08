-- =====================================================================
-- DreamSpace database schema (MVP)
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- It is safe to read top to bottom: tables, security rules, views, functions, seed data.
-- =====================================================================

-- ---------- Profiles (one per signed-up user) ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  avatar_url  text,
  bio         text check (char_length(bio) <= 200),
  created_at  timestamptz not null default now()
);
create unique index profiles_username_lower_idx on public.profiles (lower(username));

-- Automatically create a profile when someone signs up.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  candidate text;
begin
  base := regexp_replace(coalesce(new.raw_user_meta_data->>'username', 'dreamer'), '[^a-zA-Z0-9_]', '', 'g');
  if char_length(base) < 3 then base := 'dreamer'; end if;
  base := left(base, 14);
  candidate := base;
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    candidate := base || floor(random() * 9000 + 1000)::int;
  end loop;
  insert into public.profiles (id, username) values (new.id, candidate);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users edit their own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------- Dreams ----------
create type public.dream_visibility as enum ('public', 'anonymous', 'private');

create table public.dreams (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  slug        text not null unique,
  title       text not null check (char_length(title) between 3 and 120),
  body        text not null check (char_length(body) between 10 and 10000),
  mood        text check (mood in ('scared','peaceful','sad','happy','confused','excited','neutral','mysterious')),
  dream_date  date not null default current_date,
  visibility  public.dream_visibility not null default 'public',
  view_count  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index dreams_created_idx on public.dreams (created_at desc);
create index dreams_user_idx on public.dreams (user_id);

-- The dreams TABLE is only readable by its owner. Everyone else reads the
-- public_dreams VIEW below, which hides the author of anonymous dreams.
alter table public.dreams enable row level security;
create policy "Owner reads own dreams"   on public.dreams for select using (user_id = auth.uid());
create policy "Owner inserts own dreams" on public.dreams for insert with check (user_id = auth.uid());
create policy "Owner updates own dreams" on public.dreams for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Owner deletes own dreams" on public.dreams for delete using (user_id = auth.uid());

-- ---------- Tags ----------
create table public.tags (
  id        uuid primary key default gen_random_uuid(),
  name      text not null unique check (name ~ '^[a-z0-9-]{2,24}$'),
  featured  boolean not null default false
);
create table public.dream_tags (
  dream_id  uuid not null references public.dreams(id) on delete cascade,
  tag_id    uuid not null references public.tags(id) on delete cascade,
  primary key (dream_id, tag_id)
);
create index dream_tags_tag_idx on public.dream_tags (tag_id);

alter table public.tags enable row level security;
create policy "Tags are public" on public.tags for select using (true);
alter table public.dream_tags enable row level security;
create policy "Owner reads own dream tags" on public.dream_tags for select
  using (exists (select 1 from public.dreams d where d.id = dream_id and d.user_id = auth.uid()));

-- ---------- Comments (interpretations are comments with a flag; replies use parent_id) ----------
create table public.comments (
  id                 uuid primary key default gen_random_uuid(),
  dream_id           uuid not null references public.dreams(id) on delete cascade,
  user_id            uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  parent_id          uuid references public.comments(id) on delete cascade,
  body               text not null check (char_length(body) between 1 and 2000),
  is_interpretation  boolean not null default false,
  is_hidden          boolean not null default false,
  created_at         timestamptz not null default now()
);
create index comments_dream_idx on public.comments (dream_id, created_at);

-- Helper: is this dream visible to the community?
create function public.dream_is_public(p_dream_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.dreams where id = p_dream_id and visibility in ('public','anonymous'));
$$;

alter table public.comments enable row level security;
create policy "Owner reads own comments" on public.comments for select using (user_id = auth.uid());
create policy "Signed-in users comment on public dreams" on public.comments for insert
  with check (user_id = auth.uid() and public.dream_is_public(dream_id));
create policy "Owner deletes own comments" on public.comments for delete using (user_id = auth.uid());

-- ---------- Reactions (one per user per dream) ----------
create table public.reactions (
  dream_id    uuid not null references public.dreams(id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  type        text not null check (type in ('love','interesting','scary','funny','thoughtful')),
  created_at  timestamptz not null default now(),
  primary key (dream_id, user_id)
);
alter table public.reactions enable row level security;
create policy "Owner reads own reactions" on public.reactions for select using (user_id = auth.uid());
create policy "Users react to public dreams" on public.reactions for insert
  with check (user_id = auth.uid() and public.dream_is_public(dream_id));
create policy "Users change own reaction" on public.reactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users remove own reaction" on public.reactions for delete using (user_id = auth.uid());

-- ---------- Reports (admins review these in the Supabase dashboard for now) ----------
create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  dream_id     uuid references public.dreams(id) on delete cascade,
  comment_id   uuid references public.comments(id) on delete cascade,
  reason       text not null check (reason in ('harassment','spam','sexual','violence','hate','self_harm','illegal','other')),
  details      text check (char_length(details) <= 1000),
  status       text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at   timestamptz not null default now(),
  check (dream_id is not null or comment_id is not null)
);
alter table public.reports enable row level security;
create policy "Users file reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "Users see own reports" on public.reports for select using (reporter_id = auth.uid());

-- ---------- Daily prompts ("Dream of the Day") ----------
create table public.daily_prompts (
  id        serial primary key,
  question  text not null
);
alter table public.daily_prompts enable row level security;
create policy "Prompts are public" on public.daily_prompts for select using (true);

-- =====================================================================
-- VIEWS: this is how anonymity is enforced inside the database.
-- (They intentionally run with the owner's rights; the WHERE clauses and
--  CASE expressions decide exactly what the outside world can see.)
-- =====================================================================

create view public.public_dreams as
select
  d.id, d.slug, d.title, d.body, d.mood, d.dream_date, d.visibility, d.view_count, d.created_at,
  case when d.visibility = 'public' then d.user_id end   as author_id,
  case when d.visibility = 'public' then p.username end  as author_username,
  case when d.visibility = 'public' then p.avatar_url end as author_avatar,
  coalesce((select array_agg(t.name order by t.name)
            from public.dream_tags dt join public.tags t on t.id = dt.tag_id
            where dt.dream_id = d.id), '{}') as tags,
  (select count(*) from public.reactions r where r.dream_id = d.id)::int as reaction_count,
  (select count(*) from public.comments c where c.dream_id = d.id and not c.is_hidden)::int as comment_count
from public.dreams d
join public.profiles p on p.id = d.user_id
where d.visibility in ('public', 'anonymous');

-- The signed-in user's own dreams (all visibilities, author always shown).
create view public.my_dreams as
select
  d.id, d.slug, d.title, d.body, d.mood, d.dream_date, d.visibility, d.view_count, d.created_at,
  d.user_id as author_id, p.username as author_username, p.avatar_url as author_avatar,
  coalesce((select array_agg(t.name order by t.name)
            from public.dream_tags dt join public.tags t on t.id = dt.tag_id
            where dt.dream_id = d.id), '{}') as tags,
  (select count(*) from public.reactions r where r.dream_id = d.id)::int as reaction_count,
  (select count(*) from public.comments c where c.dream_id = d.id and not c.is_hidden)::int as comment_count
from public.dreams d
join public.profiles p on p.id = d.user_id
where d.user_id = auth.uid();

create view public.public_comments as
select
  c.id, c.dream_id, c.parent_id, c.body, c.is_interpretation, c.created_at,
  (c.user_id = d.user_id) as is_dream_author,
  (c.user_id = auth.uid()) as is_mine,
  case when d.visibility = 'anonymous' and c.user_id = d.user_id then null else c.user_id end   as author_id,
  case when d.visibility = 'anonymous' and c.user_id = d.user_id then null else p.username end  as author_username
from public.comments c
join public.dreams d on d.id = c.dream_id
join public.profiles p on p.id = c.user_id
where d.visibility in ('public', 'anonymous') and not c.is_hidden;

create view public.dream_reaction_counts as
select r.dream_id, r.type, count(*)::int as total
from public.reactions r
join public.dreams d on d.id = r.dream_id
where d.visibility in ('public', 'anonymous')
group by r.dream_id, r.type;

-- =====================================================================
-- FUNCTIONS
-- =====================================================================

-- Create a dream plus its tags in one safe call. Returns the new slug.
create function public.create_dream(
  p_title text, p_body text, p_mood text, p_dream_date date,
  p_visibility public.dream_visibility, p_tags text[]
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_slug text;
  v_id uuid;
  v_tag text;
  v_tag_id uuid;
  v_count int := 0;
begin
  if v_user is null then raise exception 'You need to be signed in.'; end if;

  v_slug := trim(both '-' from regexp_replace(lower(left(p_title, 60)), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then v_slug := 'dream'; end if;
  v_slug := v_slug || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);

  insert into public.dreams (user_id, slug, title, body, mood, dream_date, visibility)
  values (v_user, v_slug, trim(p_title), trim(p_body), nullif(p_mood, ''), coalesce(p_dream_date, current_date), p_visibility)
  returning id into v_id;

  foreach v_tag in array coalesce(p_tags, '{}') loop
    v_tag := lower(regexp_replace(trim(v_tag), '[^a-zA-Z0-9-]+', '', 'g'));
    continue when v_tag !~ '^[a-z0-9-]{2,24}$';
    exit when v_count >= 8;
    insert into public.tags (name) values (v_tag) on conflict (name) do nothing;
    select id into v_tag_id from public.tags where name = v_tag;
    insert into public.dream_tags (dream_id, tag_id) values (v_id, v_tag_id) on conflict do nothing;
    v_count := v_count + 1;
  end loop;

  return v_slug;
end $$;

-- Count a view on a public dream.
create function public.increment_dream_views(p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.dreams set view_count = view_count + 1
  where slug = p_slug and visibility in ('public', 'anonymous');
$$;

-- =====================================================================
-- PERMISSIONS
-- =====================================================================
grant select on public.public_dreams, public.public_comments, public.dream_reaction_counts to anon, authenticated;
grant select on public.my_dreams to authenticated;
grant execute on function public.create_dream(text, text, text, date, public.dream_visibility, text[]) to authenticated;
revoke execute on function public.create_dream(text, text, text, date, public.dream_visibility, text[]) from anon, public;
grant execute on function public.increment_dream_views(text) to anon, authenticated;

-- =====================================================================
-- SEED DATA
-- =====================================================================
insert into public.tags (name, featured) values
  ('nightmare', true), ('flying', true), ('falling', true), ('chasing', true), ('animals', true),
  ('love', true), ('family', true), ('school', true), ('work', true), ('travel', true),
  ('death', true), ('water', true), ('unknown-places', true), ('supernatural', true),
  ('lucid', true), ('recurring', true), ('childhood', true), ('funny', true), ('adventure', true),
  ('dream-of-the-day', false)
on conflict (name) do nothing;

insert into public.daily_prompts (question) values
  ('What is the strangest place you have ever dreamed about?'),
  ('Have you ever dreamed you could fly? What did it feel like?'),
  ('Describe a dream that kept coming back to you.'),
  ('Who is someone you did not expect to see in a dream?'),
  ('What is the most vivid dream you can remember from childhood?'),
  ('Have you ever known you were dreaming while it was happening?'),
  ('Tell us about a dream that made you laugh when you woke up.'),
  ('What is a dream that felt more real than waking life?'),
  ('Have you ever dreamed about a place from your past that no longer exists?'),
  ('What sound, smell or color do you remember most from a recent dream?'),
  ('Have you dreamed about falling? Where did you land, if you did?'),
  ('Describe a dream where you were in a school or workplace you did not recognize.'),
  ('What animal has shown up in your dreams?'),
  ('What was your last dream before today?');
