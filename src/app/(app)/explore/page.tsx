import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MOODS } from "@/lib/moods";
import { tagIcon } from "@/lib/icons";
import { Theme } from "@/components/Theme";

export const metadata: Metadata = { title: "Explore dreams" };

export default async function ExplorePage() {
  const supabase = await createClient();
  const { data: tags } = await supabase.from("tags").select("name").eq("featured", true).order("name");

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <Theme name="aurora" />
      <header>
        <h1 className="font-display">Explore dreams</h1>
        <p className="mt-2 text-mist">Wander by theme, or by how a dream felt.</p>
      </header>

      <Link href="/people" className="card card-link group flex items-center justify-between px-6 py-5">
        <span>
          <span className="font-display text-3xl">Find dreamers</span>
          <span className="mt-1 block text-sm text-mist">Follow people whose dreams are like yours.</span>
        </span>
        <ArrowUpRight className="text-violet transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
      </Link>

      <section aria-labelledby="themes">
        <h2 id="themes" className="mb-5 font-display">Themes</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(tags ?? []).map((t, i) => {
            const Icon = tagIcon(t.name);
            return (
              <Link
                key={t.name}
                href={`/search?tag=${t.name}`}
                className="card card-link group flex flex-col gap-6 p-5 transition-transform duration-300 hover:-translate-y-1"
                style={{ animation: "page-in 0.7s var(--ease) both", animationDelay: `${Math.min(i, 12) * 45}ms` }}
              >
                <Icon size={22} className="text-violet transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110" aria-hidden />
                <span className="font-display text-[1.55rem] capitalize leading-none">{t.name.replace(/-/g, " ")}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="moods">
        <h2 id="moods" className="mb-5 font-display">Moods</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOODS.map((m) => (
            <Link
              key={m.value}
              href={`/search?mood=${m.value}`}
              className="pane flex items-center gap-3 px-4 py-4 !rounded-2xl transition-transform duration-300 hover:-translate-y-1"
              style={{ "--mood": m.color } as React.CSSProperties}
            >
              <span aria-hidden className="text-xl">{m.emoji}</span>
              <span>{m.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
