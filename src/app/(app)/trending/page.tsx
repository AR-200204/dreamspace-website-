import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getSavedSet } from "@/lib/data";
import { DreamCard, EmptyState } from "@/components/DreamCard";
import type { DreamRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Theme } from "@/components/Theme";
import { Eye, Flame, Ghost, Heart, MessagesSquare, Repeat, Sparkles, type LucideIcon } from "lucide-react";
import { daysAgoIso, rankByHeat } from "@/lib/trending";

export const metadata: Metadata = { title: "Trending dreams" };

const TABS: ReadonlyArray<{ key: string; label: string; icon: LucideIcon }> = [
  { key: "today", label: "Trending Today", icon: Flame },
  { key: "discussed", label: "Most Discussed", icon: MessagesSquare },
  { key: "loved", label: "Most Loved", icon: Heart },
  { key: "viewed", label: "Most Viewed", icon: Eye },
  { key: "recurring", label: "Recurring Dreams", icon: Repeat },
  { key: "nightmares", label: "Popular Nightmares", icon: Ghost },
  { key: "interesting", label: "Interesting Dreams", icon: Sparkles },
];

type TabKey = "today" | "discussed" | "loved" | "viewed" | "recurring" | "nightmares" | "interesting";

export default async function TrendingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: rawTab } = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as TabKey) : "today";
  const supabase = await createClient();
  const LIMIT = 15;
  let dreams: DreamRow[] = [];

  if (tab === "today") {
    const { data } = await supabase.from("public_dreams").select("*").gte("created_at", daysAgoIso(7)).limit(200);
    dreams = rankByHeat((data ?? []) as DreamRow[], LIMIT);
  } else if (tab === "interesting") {
    const { data: counts } = await supabase
      .from("dream_reaction_counts")
      .select("dream_id, total")
      .in("type", ["interesting", "thoughtful"]);
    const totals = new Map<string, number>();
    (counts ?? []).forEach((c) => totals.set(c.dream_id, (totals.get(c.dream_id) ?? 0) + c.total));
    const ids = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, LIMIT).map(([id]) => id);
    if (ids.length) {
      const { data } = await supabase.from("public_dreams").select("*").in("id", ids);
      dreams = ((data ?? []) as DreamRow[]).sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0));
    }
  } else {
    let q = supabase.from("public_dreams").select("*");
    if (tab === "recurring") q = q.contains("tags", ["recurring"]).order("reaction_count", { ascending: false });
    if (tab === "nightmares") q = q.or("tags.cs.{nightmare},mood.eq.scared").order("reaction_count", { ascending: false });
    if (tab === "discussed") q = q.order("comment_count", { ascending: false });
    if (tab === "loved") q = q.order("reaction_count", { ascending: false });
    if (tab === "viewed") q = q.order("view_count", { ascending: false });
    const { data } = await q.order("created_at", { ascending: false }).limit(LIMIT);
    dreams = (data ?? []) as DreamRow[];
  }

  const { user } = await getCurrentProfile(supabase);
  const saved = await getSavedSet(supabase, user?.id, dreams.map((d) => d.id));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Theme name="ember" />
      <header>
        <h1 className="font-display">Trending</h1>
        <p className="mt-2 text-mist">What the community is dreaming and talking about.</p>
      </header>

      <nav aria-label="Trending categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/trending?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors",
              tab === t.key ? "border-violet bg-violet/15 text-moon" : "border-line text-mist hover:text-moon"
            )}
          >
            <t.icon size={15} aria-hidden />
            {t.label}
          </Link>
        ))}
      </nav>

      {dreams.length === 0 ? (
        <EmptyState title="Nothing here yet">
          <p>Share a dream and help get this page started.</p>
        </EmptyState>
      ) : (
        <ol className="space-y-5">
          {dreams.map((d, i) => (
            <li key={d.id} className="grid grid-cols-[auto_1fr] items-start gap-x-4 sm:gap-x-6">
              {/* An editorial ranking numeral: outlined, so it frames the dream without competing with it. */}
              <span
                aria-label={`Number ${i + 1}`}
                className="select-none pt-3 font-display text-[3.4rem] leading-none text-transparent sm:text-[5rem]"
                style={{ WebkitTextStroke: "1px color-mix(in oklab, var(--accent) 55%, transparent)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <DreamCard dream={d} saved={saved.has(d.id)} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
