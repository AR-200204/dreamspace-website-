import Link from "next/link";
import { Eye, Heart, MessageCircle, Lock, EyeOff } from "lucide-react";
import type { DreamRow } from "@/lib/types";
import { getMood } from "@/lib/moods";
import { anonymousName, excerpt, timeAgo } from "@/lib/utils";

function shortCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n);
}

export function DreamCard({ dream, showVisibility = false }: { dream: DreamRow; showVisibility?: boolean }) {
  const mood = getMood(dream.mood);
  const author =
    dream.visibility === "public" || (showVisibility && dream.visibility !== "anonymous")
      ? dream.author_username
      : null;

  return (
    <article className="card card-link relative p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mist">
        <span>
          {dream.visibility === "anonymous" ? (
            <>
              {anonymousName(dream.id)}
            </>
          ) : author ? (
            <Link href={`/u/${author}`} className="relative z-10 hover:text-moon">
              @{author}
            </Link>
          ) : null}
        </span>
        <span aria-hidden>•</span>
        <time dateTime={dream.created_at}>{timeAgo(dream.created_at)}</time>
        {mood && (
          <span className="ml-auto" title={mood.label}>
            <span aria-hidden>{mood.emoji}</span> <span className="sr-only">Mood: </span>
            {mood.label}
          </span>
        )}
        {showVisibility && dream.visibility !== "public" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2 py-0.5 text-xs">
            {dream.visibility === "private" ? <Lock size={12} aria-hidden /> : <EyeOff size={12} aria-hidden />}
            {dream.visibility === "private" ? "Only me" : "Anonymous"}
          </span>
        )}
      </div>

      <h3 className="font-display text-xl leading-snug sm:text-2xl">
        <Link href={`/dreams/${dream.slug}`} className="after:absolute after:inset-0 after:content-['']">
          {dream.title}
        </Link>
      </h3>
      <p className="mt-2 max-w-[65ch] font-display text-[1.02rem] leading-relaxed text-mist">{excerpt(dream.body)}</p>

      {dream.tags.length > 0 && (
        <div className="relative z-10 mt-4 flex flex-wrap gap-1.5">
          {dream.tags.slice(0, 5).map((t) => (
            <Link key={t} href={`/search?tag=${t}`} className="chip">
              #{t}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-5 text-sm text-mist">
        <span className="inline-flex items-center gap-1.5" title="Reactions">
          <Heart size={16} aria-hidden /> {shortCount(dream.reaction_count)}
          <span className="sr-only">reactions</span>
        </span>
        <span className="inline-flex items-center gap-1.5" title="Comments">
          <MessageCircle size={16} aria-hidden /> {shortCount(dream.comment_count)}
          <span className="sr-only">comments</span>
        </span>
        <span className="inline-flex items-center gap-1.5" title="Views">
          <Eye size={16} aria-hidden /> {shortCount(dream.view_count)}
          <span className="sr-only">views</span>
        </span>
      </div>
    </article>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-display text-xl">{title}</p>
      {children && <div className="mt-3 text-mist">{children}</div>}
    </div>
  );
}

export function Pager({ page, hasMore, basePath, params }: { page: number; hasMore: boolean; basePath: string; params?: Record<string, string> }) {
  const link = (p: number) => {
    const sp = new URLSearchParams(params);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };
  if (page <= 1 && !hasMore) return null;
  return (
    <nav className="flex items-center justify-between pt-2" aria-label="Pagination">
      {page > 1 ? (
        <Link href={link(page - 1)} className="btn-ghost">
          Newer
        </Link>
      ) : (
        <span />
      )}
      {hasMore && (
        <Link href={link(page + 1)} className="btn-ghost">
          Older dreams
        </Link>
      )}
    </nav>
  );
}
