import Link from "next/link";
import { ArrowRight, EyeOff, Moon, MessagesSquare, Heart, MessageCircle, Eye } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SITE } from "@/lib/config";

const EXAMPLES = [
  {
    title: "I Was Flying Over My Childhood Home",
    body: "I suddenly realized I could fly. I was looking down at my old house and then the roof opened like a lid, and everyone I grew up with was sitting at the kitchen table…",
    tags: ["flying", "childhood", "adventure"],
    stats: [124, 32, "1.4K"],
  },
  {
    title: "I Keep Dreaming About the Ocean",
    body: "I was standing in the middle of a huge ocean. The water was completely calm, but I could see something moving underneath…",
    tags: ["water", "recurring", "mysterious"],
    stats: [87, 24, "960"],
  },
  {
    title: "Being Chased Through a Strange City",
    body: "I was running through a city I had never seen before. Every street looked familiar, but none of them led anywhere I knew…",
    tags: ["chasing", "nightmare", "unknown-places"],
    stats: [203, 58, "3.1K"],
  },
];

export default function Landing() {
  return (
    <div className="overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/feed" className="hidden px-3 py-2 text-mist hover:text-moon sm:block">
            Explore dreams
          </Link>
          <Link href="/login" className="btn-ghost !py-2">
            Log in
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-12 sm:pt-20">
          <div aria-hidden className="moon pointer-events-none absolute -right-24 -top-10 h-72 w-72 opacity-90 sm:-right-10 sm:top-0 sm:h-[26rem] sm:w-[26rem]" />
          <div className="relative max-w-2xl">
            <h1 className="font-display text-[2.6rem] font-light leading-[1.05] tracking-tight sm:text-7xl">
              Your dreams don&apos;t have to disappear when you wake up.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">{SITE.description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/dreams/new" className="btn-primary !px-7 !py-3.5 text-base">
                Share a Dream
              </Link>
              <Link href="/feed" className="btn-ghost !px-7 !py-3.5 text-base">
                Explore Dreams
              </Link>
            </div>
            <p className="mt-5 text-sm text-mist/80">Free. Post under your name or fully anonymously.</p>
          </div>
        </section>

        {/* Example dreams */}
        <section className="mx-auto max-w-6xl px-5 pb-20" aria-labelledby="examples">
          <h2 id="examples" className="font-display text-2xl sm:text-3xl">
            The kind of dreams people share
          </h2>
          <p className="mt-2 text-sm text-mist/80">Examples to show what a dream looks like here.</p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {EXAMPLES.map((d) => (
              <article key={d.title} className="card flex flex-col p-6">
                <h3 className="font-display text-xl leading-snug">🌙 {d.title}</h3>
                <p className="mt-3 flex-1 font-display leading-relaxed text-mist">{d.body}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {d.tags.map((t) => (
                    <span key={t} className="chip">#{t}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-5 text-sm text-mist">
                  <span className="inline-flex items-center gap-1.5"><Heart size={15} aria-hidden /> {d.stats[0]}</span>
                  <span className="inline-flex items-center gap-1.5"><MessageCircle size={15} aria-hidden /> {d.stats[1]}</span>
                  <span className="inline-flex items-center gap-1.5"><Eye size={15} aria-hidden /> {d.stats[2]}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Why */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <Moon className="text-violet" size={22} aria-hidden />
              <h3 className="mt-4 font-display text-xl">Write it down while it&apos;s fresh</h3>
              <p className="mt-2 leading-relaxed text-mist">Only the story is required. Add a mood and tags when you&apos;re awake enough.</p>
            </div>
            <div>
              <MessagesSquare className="text-violet" size={22} aria-hidden />
              <h3 className="mt-4 font-display text-xl">See who dreamed it too</h3>
              <p className="mt-2 leading-relaxed text-mist">Find similar dreams and read what others think they might mean. Interpretations are opinions, not facts.</p>
            </div>
            <div>
              <EyeOff className="text-violet" size={22} aria-hidden />
              <h3 className="mt-4 font-display text-xl">Share on your terms</h3>
              <p className="mt-2 leading-relaxed text-mist">Post publicly, anonymously, or keep it private. Anonymous dreams never show your username.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="card flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center sm:p-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl">What did you dream last night?</h2>
              <p className="mt-2 text-mist">It takes a minute, and it fades faster than you think.</p>
            </div>
            <Link href="/dreams/new" className="btn-primary !px-7 !py-3.5 text-base">
              Share a Dream <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-8 text-sm leading-relaxed text-mist/80">
          <p>
            {SITE.name} is a community for reflection and storytelling. Dream interpretations are subjective, not
            scientific, and are never a medical diagnosis or a prediction. If you&apos;re struggling, please talk to someone you trust or a health professional.
          </p>
        </div>
      </footer>
    </div>
  );
}
