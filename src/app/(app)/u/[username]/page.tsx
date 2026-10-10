import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DreamCard, EmptyState, Pager } from "@/components/DreamCard";
import { FollowButton } from "@/components/ActionButtons";
import { StreakCard, type Streak } from "@/components/StreakCard";
import { blockUser, logout, unblockUser } from "@/app/actions";
import { PAGE_SIZE } from "@/lib/config";
import { earnedBadges } from "@/lib/badges";
import { getSavedSet } from "@/lib/data";
import { cn, excerpt, formatDate, timeAgo } from "@/lib/utils";
import type { CommentRow, DreamRow, ProfileStats } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)}` };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string; tab?: string }>;
}) {
  const { username: raw } = await params;
  const username = decodeURIComponent(raw);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isMe = user?.id === profile.id;

  const tabs = [
    { key: "dreams", label: "Dreams" },
    { key: "comments", label: "Comments" },
    ...(isMe ? [{ key: "liked", label: "Liked" }, { key: "saved", label: "Saved" }] : []),
  ];
  const tab = tabs.some((t) => t.key === sp.tab) ? sp.tab! : "dreams";

  const [statsRes, followRes, blockRes] = await Promise.all([
    supabase.rpc("profile_stats", { p_user: profile.id }),
    user && !isMe
      ? supabase.from("follows").select("followee_id").eq("follower_id", user.id).eq("followee_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user && !isMe
      ? supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id).eq("blocked_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const stats = (statsRes.data ?? {
    dreams: 0, comments: 0, reactions_received: 0, reactions_given: 0,
    best_dream_reactions: 0, recurring_dreams: 0, followers: 0, following: 0,
  }) as ProfileStats;
  const badges = earnedBadges(stats);
  const streak = isMe ? ((await supabase.rpc("my_streak")).data as Streak | null) : null;
  const following = Boolean(followRes.data);
  const blocked = Boolean(blockRes.data);

  // Load whichever tab is open.
  let dreams: DreamRow[] = [];
  let hasMore = false;
  let commentRows: Array<CommentRow & { dream_title: string; dream_slug: string }> = [];

  if (tab === "dreams") {
    const res = isMe
      ? await supabase.from("my_dreams").select("*").order("created_at", { ascending: false }).range(from, from + PAGE_SIZE)
      : await supabase.from("public_dreams").select("*").eq("author_id", profile.id).order("created_at", { ascending: false }).range(from, from + PAGE_SIZE);
    const rows = (res.data ?? []) as DreamRow[];
    hasMore = rows.length > PAGE_SIZE;
    dreams = rows.slice(0, PAGE_SIZE);
  } else if (tab === "liked" || tab === "saved") {
    const src = tab === "liked"
      ? await supabase.from("reactions").select("dream_id, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(30)
      : await supabase.from("bookmarks").select("dream_id, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(30);
    const ids = (src.data ?? []).map((r) => r.dream_id as string);
    if (ids.length) {
      const { data } = await supabase.from("public_dreams").select("*").in("id", ids);
      const byId = new Map(((data ?? []) as DreamRow[]).map((d) => [d.id, d]));
      dreams = ids.map((id) => byId.get(id)).filter(Boolean) as DreamRow[];
    }
  } else if (tab === "comments") {
    const { data } = await supabase.from("public_comments").select("*").eq("author_id", profile.id).order("created_at", { ascending: false }).limit(30);
    const rows = (data ?? []) as CommentRow[];
    const ids = [...new Set(rows.map((r) => r.dream_id))];
    const { data: ds } = ids.length ? await supabase.from("public_dreams").select("id, slug, title").in("id", ids) : { data: [] };
    const map = new Map((ds ?? []).map((d) => [d.id as string, d]));
    commentRows = rows
      .filter((r) => map.has(r.dream_id))
      .map((r) => ({ ...r, dream_title: map.get(r.dream_id)!.title, dream_slug: map.get(r.dream_id)!.slug }));
  }
  const saved = await getSavedSet(supabase, user?.id, dreams.map((d) => d.id));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:p-8">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover" />
        ) : (
          <div aria-hidden className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-violet-deep font-display text-3xl uppercase">
            {profile.username[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl">@{profile.username}</h1>
          <p className="mt-1 text-sm text-mist">
            Joined {formatDate(profile.created_at)} · {stats.followers} {stats.followers === 1 ? "follower" : "followers"} · {stats.following} following
          </p>
          {profile.bio && <p className="mt-3 max-w-prose leading-relaxed">{profile.bio}</p>}
          {badges.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Badges">
              {badges.map((b) => (
                <li key={b.id} title={b.description} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-mist">
                  <span aria-hidden>{b.emoji}</span> {b.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-2 sm:flex-col">
          {isMe ? (
            <>
              <Link href="/settings" className="btn-ghost !py-1.5">Settings</Link>
              <form action={logout}>
                <button className="btn-ghost !py-1.5 w-full">Log out</button>
              </form>
            </>
          ) : blocked ? (
            <form action={unblockUser}>
              <input type="hidden" name="blocked_id" value={profile.id} />
              <input type="hidden" name="back" value={`/u/${profile.username}`} />
              <button className="btn-ghost !py-1.5">Unblock</button>
            </form>
          ) : (
            <>
              {user ? (
                <FollowButton userId={profile.id} username={profile.username} following={following} />
              ) : (
                <Link href={`/login?next=/u/${profile.username}`} className="btn-primary !py-1.5">Follow</Link>
              )}
              {user && (
                <details className="relative text-sm">
                  <summary className="btn-ghost !py-1.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">More</summary>
                  <form action={blockUser} className="card absolute right-0 z-20 mt-2 w-64 space-y-3 p-4 shadow-xl">
                    <p className="text-mist">You won&apos;t see their named dreams or comments, and they can&apos;t notify you.</p>
                    <input type="hidden" name="blocked_id" value={profile.id} />
                    <input type="hidden" name="username" value={profile.username} />
                    <button className="btn-danger w-full !py-1.5">Block @{profile.username}</button>
                  </form>
                </details>
              )}
            </>
          )}
        </div>
      </header>

      {streak && <StreakCard streak={streak} />}

      <dl className="grid grid-cols-3 gap-3 text-center">
        {[
          ["Public dreams", stats.dreams],
          ["Comments", stats.comments],
          ["Reactions received", stats.reactions_received],
        ].map(([label, value]) => (
          <div key={label as string} className="card px-3 py-4">
            <dd className="font-display text-2xl">{value}</dd>
            <dt className="mt-0.5 text-xs text-mist">{label}</dt>
          </div>
        ))}
      </dl>

      <section aria-label="Profile content">
        <nav className="mb-5 flex gap-2 overflow-x-auto" aria-label="Profile tabs">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/u/${profile.username}?tab=${t.key}`}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                tab === t.key ? "border-violet bg-violet/15 text-moon" : "border-line text-mist hover:text-moon"
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {isMe && tab === "dreams" && (
          <p className="mb-4 text-sm text-mist">Only you can see your private and anonymous dreams listed here.</p>
        )}

        {tab === "comments" ? (
          commentRows.length === 0 ? (
            <EmptyState title="No public comments yet" />
          ) : (
            <ul className="space-y-3">
              {commentRows.map((c) => (
                <li key={c.id}>
                  <Link href={`/dreams/${c.dream_slug}#c-${c.id}`} className="card card-link block px-5 py-4">
                    <span className="text-xs text-mist">On “{c.dream_title}” · {timeAgo(c.created_at)}</span>
                    <span className="mt-1 block leading-relaxed">{excerpt(c.body, 200)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : dreams.length === 0 ? (
          <EmptyState
            title={
              tab === "saved" ? "Nothing saved yet" : tab === "liked" ? "No reactions yet" : isMe ? "Your journal is empty" : "No public dreams yet"
            }
          >
            {isMe && tab === "dreams" && (
              <Link href="/dreams/new" className="btn-primary mt-2">Share your first dream</Link>
            )}
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {dreams.map((d) => (
              <DreamCard key={d.id} dream={d} showVisibility={isMe && tab === "dreams"} saved={saved.has(d.id)} />
            ))}
          </div>
        )}
        {tab === "dreams" && <Pager page={page} hasMore={hasMore} basePath={`/u/${profile.username}`} />}
      </section>
    </div>
  );
}
