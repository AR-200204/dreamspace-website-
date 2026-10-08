import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Eye, Lock, Trash2 } from "lucide-react";
import { addComment, deleteDream, react } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { CommentThread } from "@/components/CommentThread";
import { DreamCard } from "@/components/DreamCard";
import { ReportForm } from "@/components/ReportForm";
import { ShareButtons } from "@/components/ShareButtons";
import { SITE } from "@/lib/config";
import { REACTIONS, getMood } from "@/lib/moods";
import type { CommentRow, DreamRow } from "@/lib/types";
import { anonymousName, excerpt, formatDate, cn } from "@/lib/utils";

async function loadDream(slug: string) {
  const supabase = await createClient();
  const { data: publicDream } = await supabase.from("public_dreams").select("*").eq("slug", slug).maybeSingle();
  if (publicDream) return { supabase, dream: publicDream as DreamRow };
  // Not public? It may be the signed-in user's own private dream.
  const { data: mine } = await supabase.from("my_dreams").select("*").eq("slug", slug).maybeSingle();
  return { supabase, dream: (mine as DreamRow | null) ?? null };
}

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
  searchParams: Promise<{ reported?: string }>;
}) {
  const { slug } = await params;
  const { reported } = await searchParams;
  const { supabase, dream } = await loadDream(slug);
  if (!dream) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = Boolean(user && dream.author_id === user.id);
  const isShared = dream.visibility !== "private";
  const mood = getMood(dream.mood);
  const mainTag = dream.tags.find((t) => t !== "dream-of-the-day");

  if (isShared) await supabase.rpc("increment_dream_views", { p_slug: slug });

  const [{ data: commentData }, { data: counts }, myReaction, similar, tagCount] = await Promise.all([
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
  ]);

  const comments = (commentData ?? []) as CommentRow[];
  const countByType = new Map((counts ?? []).map((c) => [c.type, c.total]));
  const mine = myReaction.data?.type as string | undefined;
  const similarDreams = (similar.data ?? []) as DreamRow[];
  const shareUrl = `${SITE.url}/dreams/${dream.slug}`;
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
      {reported && (
        <p role="status" className="mb-5 rounded-xl border border-violet/30 bg-violet/10 px-4 py-3 text-sm">
          Thanks. Your report was sent and will be reviewed.
        </p>
      )}

      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mist">
          {dream.visibility === "public" && dream.author_username ? (
            <Link href={`/u/${dream.author_username}`} className="hover:text-moon">{authorLine}</Link>
          ) : (
            <span>{authorLine}</span>
          )}
          <span aria-hidden>•</span>
          <span>Dreamed {formatDate(dream.dream_date)}</span>
          {mood && (
            <>
              <span aria-hidden>•</span>
              <span><span aria-hidden>{mood.emoji}</span> {mood.label}</span>
            </>
          )}
          {dream.visibility === "private" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2 py-0.5 text-xs">
              <Lock size={12} aria-hidden /> Only you can see this
            </span>
          )}
        </div>
        <h1 className="mt-3 font-display text-3xl leading-tight sm:text-5xl">{dream.title}</h1>
        {dream.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {dream.tags.map((t) => (
              <Link key={t} href={`/search?tag=${t}`} className="chip">#{t}</Link>
            ))}
          </div>
        )}
      </header>

      <div className="mt-8 max-w-[62ch] whitespace-pre-wrap font-display text-[1.15rem] leading-[1.85]">{dream.body}</div>

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
            <ShareButtons url={shareUrl} title={dream.title} />
          </div>
        </>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-line pt-5">
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
        <p className="card mt-8 px-5 py-4 text-mist">
          <span className="text-moon">{tagCount.count} dreams</span> on {SITE.name} are tagged <Link href={`/search?tag=${mainTag}`} className="text-violet hover:underline">#{mainTag}</Link>. You&apos;re not the only one.
        </p>
      )}

      {isShared && (
        <section id="comments" aria-labelledby="meaning" className="mt-12 scroll-mt-20">
          <h2 id="meaning" className="font-display text-2xl">What do you think it means?</h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-mist/90">
            Dreams are personal and open to interpretation. Share what it makes you think of, or say if you&apos;ve dreamed
            something similar. These are opinions, not facts, and never a diagnosis.
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
