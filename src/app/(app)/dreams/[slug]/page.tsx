import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Eye, Lock, Moon, Pencil, Sparkles, Trash2 } from "lucide-react";
import { addComment, askAboutDream, deleteDream, exploreMeanings, react } from "@/app/actions";
import { FollowButton, SaveButton } from "@/components/ActionButtons";
import { AI_DAILY_LIMIT, AI_DISCLAIMER, aiConfigured } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { CommentThread } from "@/components/CommentThread";
import { DreamCard } from "@/components/DreamCard";
import { ReportForm } from "@/components/ReportForm";
import { ShareButtons } from "@/components/ShareButtons";
import { SITE } from "@/lib/config";
import { DEFAULT_MOOD_COLOR, REACTIONS, getMood } from "@/lib/moods";
import type { CommentRow, DreamRow } from "@/lib/types";
import { anonymousName, excerpt, formatDate, cn } from "@/lib/utils";
import { relatedTo, type PatternDream } from "@/lib/patterns";

const CRISIS_TAGS = ["self-harm", "selfharm", "suicide", "suicidal"];
const AI_MESSAGES: Record<string, string> = {
  unavailable: "AI interpretation isn't available right now.",
  limit: `You've reached today's limit of ${AI_DAILY_LIMIT} AI requests. Try again tomorrow.`,
  busy: "AI interpretations are very popular today and have reached the daily limit. Please try again tomorrow.",
  auth: "AI is temporarily unavailable. Please try again later.",
  credits: "AI is temporarily unavailable. Please try again later.",
  policy: "AI is temporarily unavailable. Please try again later.",
  ratelimit: "The AI service is busy right now. Please try again in a minute.",
  empty: "The AI didn't manage to answer that time. Please try again.",
  error: "The AI service didn't respond. Please try again in a moment.",
  short: "Please write a slightly longer question.",
};

async function loadDream(slug: string) {
  const supabase = await createClient();
  const { data: publicDream } = await supabase.from("public_dreams").select("*").eq("slug", slug).maybeSingle();
  if (publicDream) return { supabase, dream: publicDream as DreamRow };
  // Not public? It may be the signed-in user's own private dream.
  const { data: mine } = await supabase.from("my_dreams").select("*").eq("slug", slug).maybeSingle();
  return { supabase, dream: (mine as DreamRow | null) ?? null };
}

// AI replies can take a while, so allow up to 60 seconds for the actions on this page.
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("public_dreams").select("title, body").eq("slug", slug).maybeSingle();
  if (!data) return { title: "Dream", robots: { index: false } };
  const description = excerpt(data.body, 155);
  return {
    title: data.title,
    description,
    alternates: { canonical: `/dreams/${slug}` },
    openGraph: { title: data.title, description, type: "article", url: `/dreams/${slug}` },
    twitter: { card: "summary", title: data.title, description },
  };
}

export default async function DreamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reported?: string; ai?: string; cerr?: string; detail?: string }>;
}) {
  const { slug } = await params;
  const { reported, ai, cerr, detail } = await searchParams;
  const { supabase, dream } = await loadDream(slug);
  if (!dream) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = Boolean(user && dream.author_id === user.id);
  const isShared = dream.visibility !== "private";
  const mood = getMood(dream.mood);
  const tint = mood?.color ?? DEFAULT_MOOD_COLOR;
  const mainTag = dream.tags.find((t) => t !== "dream-of-the-day");

  if (isShared) await supabase.rpc("increment_dream_views", { p_slug: slug });

  const [{ data: commentData }, { data: counts }, myReaction, similar, tagCount, savedRow, aiSummary, myQuestions] = await Promise.all([
    supabase.from("public_comments").select("*").eq("dream_id", dream.id).order("created_at"),
    supabase.from("dream_reaction_counts").select("type, total").eq("dream_id", dream.id),
    user
      ? supabase.from("reactions").select("type").eq("dream_id", dream.id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    isShared && dream.tags.length > 0
      ? supabase.from("public_dreams").select("*").overlaps("tags", dream.tags).neq("id", dream.id).order("reaction_count", { ascending: false }).limit(3)
      : Promise.resolve({ data: [] }),
    mainTag
      ? supabase.from("public_dreams").select("id", { count: "exact", head: true }).contains("tags", [mainTag])
      : Promise.resolve({ count: null }),
    user && isShared
      ? supabase.from("bookmarks").select("dream_id").eq("dream_id", dream.id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    isShared
      ? supabase.from("dream_ai_summaries").select("answer").eq("dream_id", dream.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user && isShared
      ? supabase.from("ai_interpretations").select("id, question, answer").eq("dream_id", dream.id).eq("user_id", user.id).not("question", "is", null).order("created_at")
      : Promise.resolve({ data: [] }),
  ]);
  const saved = Boolean(savedRow.data);
  let followingAuthor = false;
  if (user && dream.visibility === "public" && dream.author_id && !isOwner) {
    const { data: f } = await supabase.from("follows").select("followee_id").eq("follower_id", user.id).eq("followee_id", dream.author_id).maybeSingle();
    followingAuthor = Boolean(f);
  }
  const showAi = isShared && (aiConfigured() || Boolean(aiSummary.data));

  // Owner only: how this dream connects to the rest of their journal.
  let related: ReturnType<typeof relatedTo> | null = null;
  if (isOwner) {
    const { data: mineAll } = await supabase
      .from("my_dreams")
      .select("id, slug, title, body, mood, dream_date, created_at, tags")
      .order("dream_date", { ascending: false })
      .limit(150);
    const others = ((mineAll ?? []) as PatternDream[]).filter((d) => d.id !== dream.id);
    if (others.length >= 2) related = relatedTo({ ...dream, tags: dream.tags } as PatternDream, others);
  }

  const comments = (commentData ?? []) as CommentRow[];
  const countByType = new Map((counts ?? []).map((c) => [c.type, c.total]));
  const mine = myReaction.data?.type as string | undefined;
  const similarDreams = (similar.data ?? []) as DreamRow[];
  const shareUrl = `${SITE.url}/dreams/${dream.slug}`;
  const needsSupport = dream.tags.some((t) => CRISIS_TAGS.includes(t));
  const authorLine =
    dream.visibility === "anonymous" ? anonymousName(dream.id) : dream.author_username ? `@${dream.author_username}` : "";

  const jsonLd = isShared && {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: dream.title,
    text: excerpt(dream.body, 300),
    datePublished: dream.created_at,
    keywords: dream.tags.join(", "),
    ...(dream.visibility === "public" && dream.author_username ? { author: { "@type": "Person", name: dream.author_username } } : {}),
  };

  return (
    <article className="mx-auto max-w-2xl">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      {cerr && (
        <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{cerr}</p>
      )}
      {reported && (
        <p role="status" className="mb-5 rounded-xl border border-violet/30 bg-violet/10 px-4 py-3 text-sm">
          Thanks. Your report was sent and will be reviewed.
        </p>
      )}

      <header className="relative">
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-24 h-72 w-[130%] max-w-none" style={{ background: `radial-gradient(60% 70% at 20% 30%, color-mix(in oklab, ${tint} 22%, transparent), transparent 70%)` }} />
        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-mist">
          {dream.visibility === "public" && dream.author_username ? (
            <Link href={`/u/${dream.author_username}`} className="inline-flex items-center gap-2 text-moon hover:underline">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 font-display text-lg uppercase">{dream.author_username[0]}</span>
              {authorLine}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 text-moon">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-white/6 text-mist"><Moon size={15} /></span>
              {authorLine}
            </span>
          )}
          {dream.visibility === "public" && dream.author_id && dream.author_username && !isOwner && (
            <FollowButton userId={dream.author_id} username={dream.author_username} following={followingAuthor} />
          )}
          <span>Dreamed {formatDate(dream.dream_date)}</span>
          {mood && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-moon" style={{ background: `color-mix(in oklab, ${tint} 20%, transparent)` }}>
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: tint }} />
              {mood.label}
            </span>
          )}
          {dream.visibility === "private" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2 py-0.5 text-xs">
              <Lock size={12} aria-hidden /> Only you can see this
            </span>
          )}
        </div>
        <h1 className="relative mt-5 font-display !text-[clamp(2.6rem,6.4vw,4.4rem)] !leading-[0.98]">{dream.title}</h1>
        {dream.tags.length > 0 && (
          <div className="relative mt-5 flex flex-wrap gap-1.5">
            {dream.tags.map((t) => (
              <Link key={t} href={`/search?tag=${t}`} className="chip">#{t}</Link>
            ))}
          </div>
        )}
      </header>

      {dream.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dream.image_url} alt={`Image shared with the dream “${dream.title}”`} loading="lazy" decoding="async" className="mt-7 max-h-[28rem] w-full rounded-2xl border border-line object-cover" />
      )}

      <div className="story mt-10" style={{ "--mood": tint } as React.CSSProperties}>{dream.body}</div>

      {related && (related.themes.length > 0 || related.similar.length > 0) && (
        <aside className="card mt-8 space-y-2 p-5 text-sm" aria-label="Patterns in your journal">
          <p className="font-medium text-moon">Patterns in your journal</p>
          {related.themes.slice(0, 3).map((t) => (
            <p key={t.theme.id} className="text-mist">
              <span aria-hidden>{t.theme.emoji}</span> <span className="text-moon">{t.theme.label}</span> also appears in {t.others} of your other {t.others === 1 ? "dream" : "dreams"}.
            </p>
          ))}
          {related.similar.length > 0 && (
            <p className="text-mist">
              Similar dreams of yours:{" "}
              {related.similar.map((d, i) => (
                <span key={d.id}>{i > 0 && ", "}<Link href={`/dreams/${d.slug}`} className="text-violet hover:underline">{d.title}</Link></span>
              ))}
            </p>
          )}
          <p><Link href="/insights" className="text-violet hover:underline">See all your patterns</Link></p>
        </aside>
      )}

      {needsSupport && (
        <p role="note" className="mt-6 rounded-xl border border-line bg-white/5 px-4 py-3 text-sm leading-relaxed text-mist">
          If this feels close to home, you don&apos;t have to carry it alone. Consider talking to someone you trust or a
          health professional, or contacting your local emergency services if you are in danger.
        </p>
      )}

      {isShared && (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Reactions">
            {REACTIONS.map((r) => (
              <form key={r.value} action={react}>
                <input type="hidden" name="dream_id" value={dream.id} />
                <input type="hidden" name="slug" value={dream.slug} />
                <input type="hidden" name="type" value={r.value} />
                <button
                  aria-pressed={mine === r.value}
                  title={r.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                    mine === r.value ? "border-violet bg-violet/15 text-moon" : "border-line text-mist hover:border-violet/50 hover:text-moon"
                  )}
                >
                  <span aria-hidden>{r.emoji}</span>
                  <span className="sr-only">{r.label}</span>
                  {countByType.get(r.value) ?? 0}
                </button>
              </form>
            ))}
            <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-mist">
              <Eye size={15} aria-hidden /> {dream.view_count}
            </span>
          </div>
          <div className="mt-5">
            <ShareButtons url={shareUrl} title={dream.title} storyUrl={`/dreams/${dream.slug}/story`} />
          </div>
        </>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-line pt-5">
        {isShared && <SaveButton dreamId={dream.id} saved={saved} back={`/dreams/${dream.slug}`} className="-ml-2.5" />}
        {isOwner && (
          <Link href={`/dreams/${dream.slug}/edit`} className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-moon">
            <Pencil size={14} aria-hidden /> Edit
          </Link>
        )}
        {isOwner ? (
          <details className="text-sm">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-mist hover:text-red-300 [&::-webkit-details-marker]:hidden">
              <Trash2 size={14} aria-hidden /> Delete this dream
            </summary>
            <form action={deleteDream} className="card mt-3 max-w-sm space-y-3 p-4">
              <p>This permanently deletes the dream and its comments.</p>
              <input type="hidden" name="id" value={dream.id} />
              <button className="btn-danger !py-1.5">Yes, delete it</button>
            </form>
          </details>
        ) : (
          isShared && <ReportForm slug={dream.slug} dreamId={dream.id} />
        )}
      </div>

      {isShared && typeof tagCount.count === "number" && tagCount.count > 1 && mainTag && (
        <p className="mt-8 border-l-2 border-violet/50 py-1 pl-4 text-mist">
          <span className="text-moon">{tagCount.count} dreams</span> on {SITE.name} are tagged <Link href={`/search?tag=${mainTag}`} className="text-violet hover:underline">#{mainTag}</Link>. You&apos;re not the only one.
        </p>
      )}

      {showAi && (
        <section id="meanings" aria-labelledby="ai-h" className="mt-12 scroll-mt-20">
          <h2 id="ai-h" className="flex items-center gap-2 font-display text-2xl">
            <Sparkles size={20} className="text-violet" aria-hidden /> Possible meanings
          </h2>
          {ai && AI_MESSAGES[ai] && (
            <p role="status" className="mt-4 rounded-xl border border-violet/30 bg-violet/10 px-4 py-3 text-sm">
              {AI_MESSAGES[ai]}
              {process.env.AI_DEBUG === "1" && detail && <code className="mt-2 block break-words text-xs text-mist">AI_DEBUG: {detail}</code>}
            </p>
          )}

          {aiSummary.data ? (
            <div className="card mt-4 p-5">
              <p className="whitespace-pre-wrap leading-relaxed">{aiSummary.data.answer}</p>
              <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-mist">
                {AI_DISCLAIMER} Dream interpretation is subjective. These suggestions are for reflection and are not scientifically proven.
              </p>
            </div>
          ) : (
            <form action={exploreMeanings} className="mt-4">
              <input type="hidden" name="slug" value={dream.slug} />
              <button className="btn-ghost">✨ Explore Possible Meanings</button>
              <p className="mt-2 text-xs text-mist/80">
                Sends this dream&apos;s text to an AI service to suggest a few possible readings. {user ? "" : "Log in to use it."}
              </p>
            </form>
          )}

          {user && aiConfigured() && (
            <form action={askAboutDream} className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="slug" value={dream.slug} />
              <input name="question" required minLength={3} maxLength={300} className="input" placeholder="Ask something, e.g. “Why was I flying?”" aria-label="Ask a question about this dream" />
              <button className="btn-ghost shrink-0">Ask</button>
            </form>
          )}

          {(myQuestions.data ?? []).length > 0 && (
            <ul className="mt-5 space-y-3">
              {(myQuestions.data ?? []).map((q) => (
                <li key={q.id} className="card p-5">
                  <p className="font-medium">{q.question}</p>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed text-mist">{q.answer}</p>
                  <p className="mt-3 text-xs text-mist/80">{AI_DISCLAIMER}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isShared && (
        <section id="comments" aria-labelledby="meaning" className="mt-12 scroll-mt-20">
          <h2 id="meaning" className="font-display text-2xl">What do you think it means?</h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-mist/90">
            Dreams are personal and open to interpretation. Share what it makes you think of, or say if you&apos;ve dreamed
            something similar. These are opinions, not facts, and never a diagnosis. Please don&apos;t give medical or
            mental-health advice (<Link href="/guidelines" className="underline underline-offset-2">guidelines</Link>).
          </p>

          {user ? (
            <form action={addComment} className="mt-5 space-y-3">
              <input type="hidden" name="dream_id" value={dream.id} />
              <input type="hidden" name="slug" value={dream.slug} />
              <textarea name="body" required maxLength={2000} rows={4} className="input" placeholder="Maybe the city represents something unfamiliar in your life…" aria-label="Your comment" />
              <div className="flex flex-wrap items-center gap-5">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-mist">
                  <input type="radio" name="kind" value="interpretation" defaultChecked /> Interpretation
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-mist">
                  <input type="radio" name="kind" value="comment" /> Just a comment
                </label>
                <button className="btn-primary ml-auto">Post</button>
              </div>
            </form>
          ) : (
            <p className="card mt-5 px-5 py-4 text-mist">
              <Link href={`/login?next=/dreams/${dream.slug}`} className="text-moon underline underline-offset-4">Log in</Link> or{" "}
              <Link href="/signup" className="text-moon underline underline-offset-4">sign up</Link> to join the discussion.
            </p>
          )}

          <div className="mt-8">
            <CommentThread comments={comments} dreamId={dream.id} slug={dream.slug} signedIn={Boolean(user)} anonymousDream={dream.visibility === "anonymous"} />
          </div>
        </section>
      )}

      {similarDreams.length > 0 && (
        <section aria-labelledby="similar" className="mt-14">
          <h2 id="similar" className="font-display text-2xl">People have dreamed about something similar</h2>
          <div className="mt-5 space-y-4">
            {similarDreams.map((d) => (
              <DreamCard key={d.id} dream={d} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
