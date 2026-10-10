import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getSavedSet } from "@/lib/data";
import { DreamCard, EmptyState } from "@/components/DreamCard";
import type { DreamRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { daysAgoIso, rankByHeat } from "@/lib/trending";

export const metadata: Metadata = { title: "Trending dreams" };

const TABS = [
  { key: "today", label: "🔥 Trending Today" },
  { key: "discussed", label: "🌙 Most Discussed" },
  { key: "loved", label: "❤️ Most Loved" },
  { key: "viewed", label: "👁 Most Viewed" },
  { key: "recurring", label: "🔁 Recurring Dreams" },
  { key: "nightmares", label: "😱 Popular Nightmares" },
  { key: "interesting", label: "✨ Interesting Dreams" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl">Trending</h1>
        <p className="mt-2 text-mist">What the community is dreaming and talking about.</p>
      </header>

      <nav aria-label="Trending categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/trending?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
              tab === t.key ? "border-violet bg-violet/15 text-moon" : "border-line text-mist hover:text-moon"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {dreams.length === 0 ? (
        <EmptyState title="Nothing here yet">
          <p>Share a dream and help get this page started.</p>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {dreams.map((d) => (
            <DreamCard key={d.id} dream={d} saved={saved.has(d.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
