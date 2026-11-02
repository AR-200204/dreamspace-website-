# DreamSpace

A social platform for sharing dreams. Next.js + TypeScript + Tailwind + Supabase, all on free tiers.

## First-time setup

1. `npm install`
2. Create a free project at supabase.com.
3. Supabase -> SQL Editor: run `supabase/schema.sql`, then `supabase/migration-02-features.sql` (once each, in that order).
4. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key (Project Settings -> API).
5. For local testing, turn **Confirm email** off (Authentication -> Sign In / Providers -> Email). Turn it on again before launch.
6. `npm run dev` and open http://localhost:3000

## Upgrading an existing install (v1 -> v2)

1. Copy these files over your project. Keep your `.env.local`, `.git` and `node_modules`.
2. Supabase -> SQL Editor -> run **`supabase/migration-02-features.sql`** once. Do not run it twice.
3. Make yourself an admin (replace the username):
   ```sql
   insert into public.admins (user_id) select id from public.profiles where username = 'YOUR_USERNAME';
   ```
4. `npm install`, test with `npm run dev`, then `git add . && git commit -m "v2" && git push` to redeploy on Vercel.

## Upgrading to v3 (launch readiness)

1. Copy the new files over your project (keep `.env.local`, `.git`, `node_modules`).
2. Supabase -> SQL Editor -> run **`supabase/migration-03-launch.sql`** once, **before** you deploy.
3. `npm install`, test with `npm run dev`, then `git add . && git commit -m "v3" && git push`.

### Spam protection
- **Limits (automatic, in the database):** 10 dreams per 24 hours, 30 comments per hour, 15 reports per day, 100 follows per day. Admins are exempt.
- **Bot check on sign-up and log-in (optional, free):**
  1. Cloudflare dashboard -> Turnstile -> add a site -> copy the **Site key** and **Secret key**.
  2. Vercel (and `.env.local`): set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to the site key, then redeploy.
  3. Supabase -> Authentication -> Attack Protection -> enable CAPTCHA, choose Turnstile, paste the **Secret key**.
  Turn on step 3 only after step 2 is deployed, or logins will fail.

### Legal pages
`/terms` and `/privacy` are plain-language templates. Have a lawyer review them, and edit the "Services we use" list to match what you actually run.
Set `NEXT_PUBLIC_CONTACT_EMAIL` so people can reach you.

### Streaks and the installable app
Streaks are private and count every day you logged a dream. The app can be installed from Settings (or the browser menu) and opens straight to writing a dream.

## Upgrading to v4 (dream patterns)

1. Copy the new files over your project (keep `.env.local`, `.git`, `node_modules`).
2. Supabase -> SQL Editor -> run **`supabase/migration-04-insights.sql`** once. The pattern finder itself needs no setup.
3. `npm install`, test, then `git add . && git commit -m "v4" && git push`.

**Insights page (`/insights`, signed-in only):** recurring themes grouped by situations / people / places / creatures, words that keep
coming back, moods and feelings over time, when you log dreams, dreams that echo each other, reflection questions, and community counts.
It is calculated on the server from your own dreams with plain keyword matching. No AI, and nothing leaves your account.
The optional **AI pattern report** uses the same `AI_*` settings, needs the person to tick a consent box, and is limited to one per day.

## v14: welcome tour for new people

1. Run **`supabase/migration-07-onboarding.sql`** once in the Supabase SQL Editor (after 02 to 06). Do this before deploying.
2. Copy the files over your project and push.

New sign-ups (email or Google) go through a four-step welcome tour at `/welcome`: welcome, goals, default sharing, and a personal plan with a
button to write a first dream. The sky changes at each step and the steps slide in from the direction you are travelling. Choices are saved on the
profile (goals, default_visibility) and used later, for example the write-a-dream form starts with your chosen privacy. People who already have an
account are marked as done by the migration, so only new people see it. Anyone can skip, and replay it from Settings. The tour lives in
`src/components/Onboarding.tsx`; the redirects are in `src/app/actions.ts` (pathAfterSignIn) and `src/app/auth/callback/route.ts`.

## v12: landing page about lucid dreaming and better mornings

No database changes: copy the files over your project and push. The landing page no longer shows example dreams. It now explains how the site helps:
a lucid dreaming path (remember, spot dream signs, practise, share) with an interactive reality-check card, a "calmer nights, gentler mornings" section,
a night-with-DreamSpace timeline, and a community call to action. Every claim maps to a real feature, and the page links to the published research and states
that results vary and that the site is not medical advice. Copy lives in `src/app/page.tsx` (STEPS, CALM, NIGHT) and the reality checks in `src/components/RealityCheck.tsx`.

## v11: a different sky for every section, and motion

No database changes: copy the files over your project and push. Each section now has its own colour world (Explore aurora teal, Trending ember,
Insights observatory blue, People twilight rose, Notifications lantern gold, Create dawn peach, Search/Settings/Admin slate, and each dream or profile
takes its mood's colour). A page opts in with `<Theme name="..." />` (src/components/Theme.tsx); the colours are defined in the THEMES block of
src/app/globals.css, and they crossfade as you navigate. The landing page changes sky as you scroll. Motion: staged headline reveal, scroll reveals,
a cursor spotlight on cards, bars that grow in, counters, a loading screen, a gentle page transition, and a slowly breathing sky. All of it switches off
for people who ask their device to reduce motion. Uses CSS `@property` and `:has()`, which work in current Chrome, Edge, Safari and Firefox.

## v10: consent for AI features

1. Run **`supabase/migration-06-ai-consent.sql`** once in the Supabase SQL Editor (after 02 to 05).
2. Copy the files over your project, then push as usual.

How it works: people must tick an agreement (shown once, with a clear note that free models may keep and train on the text) before any
AI feature works. They can withdraw in Settings. A dream is only ever sent to the AI if its author ticked "Allow AI interpretation" on that dream
(off by default, never for private dreams; turning it off deletes AI text made from it). To use free models set `AI_PRIVACY=open`
in `.env.local` and Vercel, and turn on "free model training" in OpenRouter's privacy settings. Privacy and Terms pages update themselves to match.

## v7: AI with OpenRouter (free models)

No database changes. In `.env.local` and in Vercel set: `AI_PROVIDER=openrouter`, `AI_API_KEY` (from openrouter.ai/keys) and
`SUPABASE_SERVICE_ROLE_KEY`, then redeploy. Optional: `AI_MODEL` (up to 3 comma-separated model ids, tried in order),
`AI_PRIVACY` (`strict` is the default and only uses providers that do not store or train on prompts), and `AI_SITE_DAILY_LIMIT`
(default 40, because OpenRouter's free tier is about 50 requests a day for the whole account). Free models change often, so check
openrouter.ai/collections/free-models. `AI_REASONING=low` (or `off`) speeds up models that think before answering. After buying $10 of credits once, raise `AI_SITE_DAILY_LIMIT` to about 900.

## v6: profiles and people

1. Copy the new files over your project, then run **`supabase/migration-05-people.sql`** once in the Supabase SQL Editor (after 02, 03 and 04).
2. `git add . && git commit -m "v6" && git push`.

New: a redesigned profile (banner tinted by the mood they dream in most, Follow button, "Follows you", followers and following lists,
"dreams about" tags), a **People** page (`/people`) with search, suggested dreamers and "dreamers like you", a Follow button on named
dream pages, people results in search, and username changes in Settings (once every 30 days). Only people who post dreams under their
own name are ever suggested; anonymous-only posters never appear in any people list.

## v5: visual redesign ("midnight to dawn")

No database changes, so just copy the files over and push. The site is now a night sky that fades to a faint dawn glow along the
bottom edge. Dreams are tinted by their mood (scared glows ember, peaceful teal, and so on), the landing page has dream fragments
drifting across the sky, and the typography is Instrument Serif (headlines and dream text) with Hanken Grotesk for the interface.
Colours and fonts live in `src/app/globals.css` and `src/app/layout.tsx`; mood colours are in `src/lib/moods.ts`.
Also fixed: the mobile layout, which squeezed the page into a narrow column.

## Features

Landing page, sign up / log in / Google / password reset, feed with Latest / Popular / Following, Dream of the Day,
create and edit dreams (mood, tags, image, public / anonymous / private), dream pages with five reactions, nested
interpretations and replies, @mentions, bookmarks, follows, notifications with an unread badge, Trending (7 categories),
search with filters, profiles with tabs and badges, block user, reports, admin dashboard (`/admin`), community
guidelines (`/guidelines`), SEO pages, sitemap, share-preview images, an Instagram Story image, and optional AI.

## Optional settings (environment variables, in `.env.local` and in Vercel)

| Variable | What it enables |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | "Delete my account" and AI interpretation. Server-only; never share it. |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` | AI "possible meanings". Use `gemini` (free tier at aistudio.google.com/apikey) or `anthropic`. Needs the service role key too. |
| `NEXT_PUBLIC_SITE_URL` | Your real address, used for sharing and the sitemap. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Bot check on sign-up, log-in and password reset. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact address shown on the Terms and Privacy pages. |

AI limits: 5 requests per user per day, and the general interpretation of a dream is generated once and shared.
Only shared (public or anonymous) dreams are ever sent to the AI provider.

## How anonymity works

The `dreams` table can only be read by its owner. Everyone else reads the `public_dreams` view, which returns `NULL`
for the author of anonymous dreams. "Anonymous Dreamer #1234" comes from the dream id, not the user. Image file names
are random and contain no user id. Blocking hides only named dreams, because hiding anonymous ones would reveal who wrote them.

## Where things live

```
supabase/schema.sql                   original tables, security rules, views
supabase/migration-02-features.sql    bookmarks, follows, notifications, blocks, images, AI, admin
supabase/migration-03-launch.sql      spam limits and streaks
supabase/migration-04-insights.sql    stored AI pattern reports
supabase/migration-05-people.sql      people discovery, follow suggestions, username limit
supabase/migration-06-ai-consent.sql  AI consent and per-dream AI permission
src/lib/patterns.ts                   the pattern finder (themes, words, moods, echoes)
src/proxy.ts                          keeps login sessions fresh, protects private pages
src/app/actions.ts                    every write action
src/app/(app)/...                     pages with the sidebar / mobile bottom bar
src/components/                       DreamCard, CommentThread, DreamForm, ImageUpload...
src/lib/config.ts                     site name and tagline
src/lib/ai.ts                         AI prompt and provider calls
```

## Not built yet

Morning reminder emails or push notifications, weekly digest email, vector-based similar dreams (tag overlap is used now), analytics, and paging beyond 50 rows in admin lists.
