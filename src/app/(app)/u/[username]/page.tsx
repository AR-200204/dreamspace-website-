import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DreamCard, EmptyState, Pager } from "@/components/DreamCard";
import { logout } from "@/app/actions";
import { PAGE_SIZE } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import type { DreamRow } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)}` };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { username: raw } = await params;
  const username = decodeURIComponent(raw);
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isMe = user?.id === profile.id;

  const [{ data: dreamRows }, { data: statRows }, { count: commentCount }] = await Promise.all([
    isMe
      ? supabase.from("my_dreams").select("*").order("created_at", { ascending: false }).range(from, from + PAGE_SIZE)
      : supabase.from("public_dreams").select("*").eq("author_id", profile.id).order("created_at", { ascending: false }).range(from, from + PAGE_SIZE),
    supabase.from("public_dreams").select("reaction_count").eq("author_id", profile.id),
    supabase.from("public_comments").select("id", { count: "exact", head: true }).eq("author_id", profile.id),
  ]);

  const rows = (dreamRows ?? []) as DreamRow[];
  const visible = rows.slice(0, PAGE_SIZE);
  const publicCount = statRows?.length ?? 0;
  const likes = (statRows ?? []).reduce((sum, r) => sum + (r.reaction_count ?? 0), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <div aria-hidden className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-violet-deep font-display text-3xl uppercase">
          {profile.username[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl">@{profile.username}</h1>
          <p className="mt-1 text-sm text-mist">Joined {formatDate(profile.created_at)}</p>
          {profile.bio && <p className="mt-3 max-w-prose leading-relaxed">{profile.bio}</p>}
        </div>
        {isMe && (
          <div className="flex gap-2 sm:flex-col">
            <Link href="/settings" className="btn-ghost !py-1.5">Settings</Link>
            <form action={logout}>
              <button className="btn-ghost !py-1.5 w-full">Log out</button>
            </form>
          </div>
        )}
      </header>

      <dl className="grid grid-cols-3 gap-3 text-center">
        {[
          ["Public dreams", publicCount],
          ["Comments", commentCount ?? 0],
          ["Reactions received", likes],
        ].map(([label, value]) => (
          <div key={label as string} className="card px-3 py-4">
            <dd className="font-display text-2xl">{value}</dd>
            <dt className="mt-0.5 text-xs text-mist">{label}</dt>
          </div>
        ))}
      </dl>

      <section aria-labelledby="dreams">
        <h2 id="dreams" className="mb-4 font-display text-xl">{isMe ? "My dreams" : "Dreams"}</h2>
        {isMe && <p className="mb-4 text-sm text-mist">Only you can see your private and anonymous dreams listed here.</p>}
        {visible.length === 0 ? (
          <EmptyState title={isMe ? "Your journal is empty" : "No public dreams yet"}>
            {isMe && (
              <Link href="/dreams/new" className="btn-primary mt-2">
                Share your first dream
              </Link>
            )}
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {visible.map((d) => (
              <DreamCard key={d.id} dream={d} showVisibility={isMe} />
            ))}
          </div>
        )}
        <Pager page={page} hasMore={rows.length > PAGE_SIZE} basePath={`/u/${profile.username}`} />
      </section>
    </div>
  );
}
