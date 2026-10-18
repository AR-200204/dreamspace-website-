import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getFollowingSet, getSavedSet } from "@/lib/data";
import { DreamCard, EmptyState, Pager } from "@/components/DreamCard";
import { PersonList, type Person } from "@/components/PersonCard";
import { MOODS } from "@/lib/moods";
import { PAGE_SIZE } from "@/lib/config";
import { cleanSearch } from "@/lib/utils";
import type { DreamRow } from "@/lib/types";

export const metadata: Metadata = { title: "Search dreams" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; mood?: string; sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = cleanSearch(sp.q ?? "");
  const tag = (sp.tag ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const mood = MOODS.some((m) => m.value === sp.mood) ? sp.mood! : "";
  const sort = ["recent", "liked", "commented", "viewed"].includes(sp.sort ?? "") ? sp.sort! : "recent";
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  let query = supabase.from("public_dreams").select("*");
  if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
  if (tag) query = query.contains("tags", [tag]);
  if (mood) query = query.eq("mood", mood);

  const sortColumn = { recent: "created_at", liked: "reaction_count", commented: "comment_count", viewed: "view_count" }[sort]!;
  query = query.order(sortColumn, { ascending: false }).order("created_at", { ascending: false });

  const { data } = await query.range(from, from + PAGE_SIZE);
  const rows = (data ?? []) as DreamRow[];
  const hasMore = rows.length > PAGE_SIZE;
  const results = rows.slice(0, PAGE_SIZE);
  const { user } = await getCurrentProfile(supabase);
  const saved = await getSavedSet(supabase, user?.id, results.map((d) => d.id));
  // Matching people (first page only)
  let people: Person[] = [];
  if (q.length >= 2 && page === 1) {
    people = ((await supabase.rpc("search_people", { p_q: q, p_limit: 3 })).data ?? []) as Person[];
  }
  const following = await getFollowingSet(supabase, user?.id, people.map((p) => p.id));
  const hasFilters = Boolean(q || tag || mood);

  const params: Record<string, string> = {};
  if (q) params.q = q;
  if (tag) params.tag = tag;
  if (mood) params.mood = mood;
  if (sort !== "recent") params.sort = sort;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display">Search dreams</h1>
        <Link href="/explore" className="text-sm text-violet hover:underline">Browse themes and moods</Link>
      </div>

      <form action="/search" className="card space-y-3 p-4">
        <div className="relative">
          <Search size={18} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
          <input name="q" defaultValue={q} placeholder="Try “flying”, “snake”, “school”, “ocean”…" className="input !pl-11" aria-label="Search dreams" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <select name="mood" defaultValue={mood} className="input !py-2.5" aria-label="Mood">
            <option value="">Any mood</option>
            {MOODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} className="input !py-2.5" aria-label="Sort by">
            <option value="recent">Most recent</option>
            <option value="liked">Most liked</option>
            <option value="commented">Most commented</option>
            <option value="viewed">Most viewed</option>
          </select>
          <input name="tag" defaultValue={tag} placeholder="Tag, e.g. flying" className="input !py-2.5" aria-label="Tag" />
        </div>
        <button className="btn-primary">Search</button>
      </form>

      {people.length > 0 && (
        <section aria-labelledby="people-results">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="people-results" className="font-display">People</h2>
            <Link href={`/people?q=${encodeURIComponent(q)}`} className="text-sm text-violet hover:underline">See all</Link>
          </div>
          <PersonList people={people} followingIds={following} meId={user?.id ?? null} />
        </section>
      )}

      {results.length === 0 ? (
        <EmptyState title={hasFilters ? "No dreams match that search" : "Search for a dream"}>
          {hasFilters ? "Try a shorter keyword or remove a filter." : "Search by keyword, tag or mood."}
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {results.map((d) => (
            <DreamCard key={d.id} dream={d} saved={saved.has(d.id)} />
          ))}
        </div>
      )}
      <Pager page={page} hasMore={hasMore} basePath="/search" params={params} />
    </div>
  );
}
