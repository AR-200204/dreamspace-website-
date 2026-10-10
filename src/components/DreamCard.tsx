import Link from "next/link";
import type { CSSProperties } from "react";
import { Eye, Heart, MessageCircle, Lock, EyeOff, Moon } from "lucide-react";
import type { DreamRow } from "@/lib/types";
import { DEFAULT_MOOD_COLOR, getMood } from "@/lib/moods";
import { anonymousName, excerpt, timeAgo } from "@/lib/utils";
import { SaveButton } from "./ActionButtons";

function shortCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n);
}

export function DreamCard({ dream, showVisibility = false, saved = false }: { dream: DreamRow; showVisibility?: boolean; saved?: boolean }) {
  const mood = getMood(dream.mood);
  const named =
    dream.visibility === "public" || (showVisibility && dream.visibility !== "anonymous") ? dream.author_username : null;
  const tint = mood?.color ?? DEFAULT_MOOD_COLOR;

  return (
    <article className="pane group p-5 sm:p-7" style={{ "--mood": tint } as CSSProperties}>
      <div className="mb-4 flex items-center gap-3 text-sm text-mist">
        {named ? (
          dream.author_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dream.author_avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 font-display text-lg uppercase text-moon">
              {named[0]}
            </span>
          )
        ) : (
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-white/6 text-mist">
            <Moon size={15} />
          </span>
        )}
        <div className="min-w-0 leading-tight">
          {dream.visibility === "anonymous" ? (
            <span className="text-moon">{anonymousName(dream.id)}</span>
          ) : named ? (
            <Link href={`/u/${named}`} className="relative z-10 text-moon hover:underline">
              @{named}
            </Link>
          ) : null}
          <time dateTime={dream.created_at} className="block text-xs text-mist/75">
            {timeAgo(dream.created_at)}
          </time>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {showVisibility && dream.visibility !== "public" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2 py-0.5 text-xs">
              {dream.visibility === "private" ? <Lock size={12} aria-hidden /> : <EyeOff size={12} aria-hidden />}
              {dream.visibility === "private" ? "Only me" : "Anonymous"}
            </span>
          )}
          {mood && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-moon"
              style={{ background: `color-mix(in oklab, ${tint} 18%, transparent)` }}
              title={mood.label}
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: tint }} />
              <span className="sr-only">Mood: </span>
              {mood.label}
            </span>
          )}
        </div>
      </div>

      <h3 className="pane-title">
        <Link href={`/dreams/${dream.slug}`} className="after:absolute after:inset-0 after:rounded-[inherit] after:content-['']">
          {dream.title}
        </Link>
      </h3>
      <p className="mt-3 max-w-[60ch] font-display text-[1.22rem] leading-[1.55] text-moon/70">{excerpt(dream.body, 190)}</p>

      {dream.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dream.image_url} alt="" loading="lazy" decoding="async" className="mt-5 max-h-60 w-full rounded-2xl object-cover" />
      )}

      {dream.tags.length > 0 && (
        <div className="relative z-10 mt-5 flex flex-wrap gap-1.5">
          {dream.tags.slice(0, 5).map((t) => (
            <Link key={t} href={`/search?tag=${t}`} className="chip">
              #{t}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center gap-5 text-sm text-mist">
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
        {dream.visibility !== "private" && <SaveButton dreamId={dream.id} saved={saved} className="ml-auto" />}
      </div>
    </article>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card px-6 py-14 text-center">
      <span aria-hidden className="moon mx-auto mb-5 block h-10 w-10 opacity-80" style={{ boxShadow: "0 0 30px 4px rgb(243 236 216 / 0.25)" }} />
      <p className="font-display text-3xl">{title}</p>
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
