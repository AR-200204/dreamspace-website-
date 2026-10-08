import Link from "next/link";
import type { Metadata } from "next";
import { Moon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTodayPrompt } from "@/lib/data";
import { DreamCard, EmptyState, Pager } from "@/components/DreamCard";
import { PAGE_SIZE } from "@/lib/config";
import type { DreamRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dreams" };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = sp.sort === "popular" ? "popular" : "latest";
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  let query = supabase.from("public_dreams").select("*");
  query =
    sort === "popular"
      ? query.order("reaction_count", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false });

  const [{ data }, prompt, { count: today }] = await Promise.all([
    query.range(from, from + PAGE_SIZE),
    getTodayPrompt(supabase),
    supabase.from("public_dreams").select("id", { count: "exact", head: true }).gte("created_at", startOfDay.toISOString()),
  ]);

  const dreams = (data ?? []) as DreamRow[];
  const hasMore = dreams.length > PAGE_SIZE;
  const visible = dreams.slice(0, PAGE_SIZE);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {prompt && (
        <section aria-labelledby="dotd" className="card relative overflow-hidden p-6 sm:p-7">
          <div aria-hidden className="moon absolute -right-8 -top-8 h-28 w-28 opacity-25" style={{ animation: "none" }} />
          <h2 id="dotd" className="flex items-center gap-2 text-sm text-violet">
            <Moon size={15} aria-hidden /> Dream of the Day
          </h2>
          <p className="relative mt-2 max-w-md font-display text-2xl leading-snug">{prompt.question}</p>
          <div className="relative mt-5 flex flex-wrap items-center gap-4">
            <Link href={`/dreams/new?prompt=${prompt.id}`} className="btn-primary">
              Answer with a dream
            </Link>
            <Link href="/search?tag=dream-of-the-day" className="text-sm text-mist hover:text-moon">
              Read other answers
            </Link>
          </div>
          {typeof today === "number" && today > 0 && (
            <p className="relative mt-4 text-sm text-mist/80">
              {today} {today === 1 ? "dream has" : "dreams have"} been shared today.
            </p>
          )}
        </section>
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Dreams</h1>
        <div className="flex gap-1 rounded-full border border-line p-1 text-sm" role="tablist" aria-label="Sort dreams">
          {(["latest", "popular"] as const).map((s) => (
            <Link
              key={s}
              href={`/feed?sort=${s}`}
              role="tab"
              aria-selected={sort === s}
              className={cn("rounded-full px-4 py-1.5 capitalize transition-colors", sort === s ? "bg-white/10 text-moon" : "text-mist hover:text-moon")}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No dreams yet">
          <p>Be the first to share one.</p>
          <Link href="/dreams/new" className="btn-primary mt-5">
            Share a dream
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {visible.map((d) => (
            <DreamCard key={d.id} dream={d} />
          ))}
        </div>
      )}
      <Pager page={page} hasMore={hasMore} basePath="/feed" params={{ sort }} />
    </div>
  );
}
