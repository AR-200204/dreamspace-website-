import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getFollowingSet } from "@/lib/data";
import { EmptyState } from "@/components/DreamCard";
import { PersonList, type Person } from "@/components/PersonCard";
import { cleanSearch } from "@/lib/utils";

export const metadata: Metadata = { title: "Find dreamers" };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = cleanSearch((await searchParams).q ?? "");
  const supabase = await createClient();
  const { user } = await getCurrentProfile(supabase);

  const [similar, suggested, found] = await Promise.all([
    user && !q ? supabase.rpc("similar_dreamers", { p_limit: 6 }) : Promise.resolve({ data: [] }),
    !q ? supabase.rpc("suggested_dreamers", { p_limit: 12 }) : Promise.resolve({ data: [] }),
    q.length >= 2 ? supabase.rpc("search_people", { p_q: q, p_limit: 20 }) : Promise.resolve({ data: [] }),
  ]);

  const similarPeople = (similar.data ?? []) as Person[];
  const similarIds = new Set(similarPeople.map((p) => p.id));
  const suggestedPeople = ((suggested.data ?? []) as Person[]).filter((p) => !similarIds.has(p.id));
  const foundPeople = (found.data ?? []) as Person[];
  const allIds = [...similarPeople, ...suggestedPeople, ...foundPeople].map((p) => p.id);
  const following = await getFollowingSet(supabase, user?.id, allIds);

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header>
        <h1 className="font-display">Find dreamers</h1>
        <p className="mt-2 text-mist">Follow people to see their named dreams in your Following feed.</p>
        <form action="/people" className="relative mt-5">
          <Search size={18} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
          <input name="q" defaultValue={q} placeholder="Search by username" className="input !pl-11" aria-label="Search people" />
        </form>
      </header>

      {q ? (
        <section aria-label="Search results">
          {q.length < 2 ? (
            <p className="text-mist">Type at least 2 letters.</p>
          ) : foundPeople.length === 0 ? (
            <EmptyState title="No one found">Try a shorter name, or <Link href="/people" className="underline underline-offset-4">browse suggestions</Link>.</EmptyState>
          ) : (
            <PersonList people={foundPeople} followingIds={following} meId={user?.id ?? null} />
          )}
        </section>
      ) : (
        <>
          {similarPeople.length > 0 && (
            <section aria-labelledby="similar">
              <h2 id="similar" className="font-display">Dreamers like you</h2>
              <p className="mb-3 mt-1 text-sm text-mist">People whose public dreams share themes with yours.</p>
              <PersonList people={similarPeople} followingIds={following} meId={user?.id ?? null} />
            </section>
          )}
          <section aria-labelledby="suggested">
            <h2 id="suggested" className="font-display">Dreamers to follow</h2>
            <p className="mb-3 mt-1 text-sm text-mist">People who share dreams under their own name.</p>
            {suggestedPeople.length === 0 ? (
              <EmptyState title="No suggestions yet">As more people share dreams with their username, they&apos;ll show up here.</EmptyState>
            ) : (
              <PersonList people={suggestedPeople} followingIds={following} meId={user?.id ?? null} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
