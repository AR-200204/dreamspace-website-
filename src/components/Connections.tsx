import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getFollowingSet } from "@/lib/data";
import { EmptyState } from "@/components/DreamCard";
import { PersonList, type Person } from "@/components/PersonCard";
import { cn } from "@/lib/utils";

// The "Followers" and "Following" lists on a profile.
export async function Connections({ username, kind }: { username: string; kind: "followers" | "following" }) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, username").eq("username", username).maybeSingle();
  if (!profile) notFound();

  const { user } = await getCurrentProfile(supabase);

  // followers: rows where THEY are followed; the person is whoever follows them (and the other way round).
  const res =
    kind === "followers"
      ? await supabase
          .from("follows")
          .select("person:profiles!follows_follower_id_fkey(id, username, avatar_url, bio)")
          .eq("followee_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(100)
      : await supabase
          .from("follows")
          .select("person:profiles!follows_followee_id_fkey(id, username, avatar_url, bio)")
          .eq("follower_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(100);

  const people = ((res.data ?? []) as unknown as Array<{ person: Person | null }>)
    .map((r) => r.person)
    .filter((p): p is Person => Boolean(p));
  const following = await getFollowingSet(supabase, user?.id, people.map((p) => p.id));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link href={`/u/${profile.username}`} className="text-sm text-mist hover:text-moon">← @{profile.username}</Link>
        <h1 className="mt-2 font-display">{kind === "followers" ? "Followers" : "Following"}</h1>
      </header>
      <nav className="flex gap-2" aria-label="Connections">
        {(["followers", "following"] as const).map((k) => (
          <Link key={k} href={`/u/${profile.username}/${k}`} aria-current={kind === k ? "page" : undefined}
            className={cn("rounded-full border px-4 py-1.5 text-sm capitalize", kind === k ? "border-violet bg-violet/15 text-moon" : "border-line text-mist hover:text-moon")}>
            {k}
          </Link>
        ))}
      </nav>
      {people.length === 0 ? (
        <EmptyState title={kind === "followers" ? "No followers yet" : "Not following anyone yet"}>
          {kind === "following" && user?.id === profile.id && <Link href="/people" className="btn-primary mt-2">Find dreamers</Link>}
        </EmptyState>
      ) : (
        <PersonList people={people} followingIds={following} meId={user?.id ?? null} />
      )}
    </div>
  );
}
