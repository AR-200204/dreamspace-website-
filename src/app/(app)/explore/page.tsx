import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MOODS } from "@/lib/moods";

export const metadata: Metadata = { title: "Explore dreams" };

export default async function ExplorePage() {
  const supabase = await createClient();
  const { data: tags } = await supabase.from("tags").select("name").eq("featured", true).order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header>
        <h1 className="font-display text-3xl">Explore dreams</h1>
        <p className="mt-2 text-mist">Browse by theme, or by how the dream felt.</p>
      </header>

      <section aria-labelledby="themes">
        <h2 id="themes" className="mb-4 font-display text-xl">Themes</h2>
        <div className="flex flex-wrap gap-2.5">
          {(tags ?? []).map((t) => (
            <Link key={t.name} href={`/search?tag=${t.name}`} className="card card-link px-4 py-2 text-[15px] capitalize">
              {t.name.replace(/-/g, " ")}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="moods">
        <h2 id="moods" className="mb-4 font-display text-xl">Moods</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOODS.map((m) => (
            <Link key={m.value} href={`/search?mood=${m.value}`} className="card card-link flex items-center gap-2.5 px-4 py-3">
              <span aria-hidden className="text-xl">{m.emoji}</span> {m.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
