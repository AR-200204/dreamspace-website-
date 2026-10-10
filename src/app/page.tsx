import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, EyeOff, Heart, MessageCircle, MessagesSquare, Eye, Moon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SITE } from "@/lib/config";

// Real-sounding dream fragments. They drift across the night sky behind the hero.
const FRAGMENTS_A = [
  "I was flying over my childhood home and the roof opened like a lid",
  "the water was completely calm, but something moved underneath",
  "I knew the stairs, but every door led somewhere new",
  "my grandmother was waiting at the station with a suitcase of light",
  "I could not scream, no matter how hard I tried",
  "the whole city was a school I had never been to",
];
const FRAGMENTS_B = [
  "we were running, and the street kept folding behind us",
  "a white horse stood in the kitchen as if it lived there",
  "I realised I was dreaming, and the sky turned violet",
  "the phone rang, and it was my own voice",
  "everyone I grew up with was sitting at the same table",
  "I woke up sure I had been somewhere real",
];

const EXAMPLES = [
  {
    title: "I Was Flying Over My Childhood Home",
    body: "I suddenly realized I could fly. I was looking down at my old house and then the roof opened like a lid, and everyone I grew up with was sitting at the kitchen table, looking up at me as if they had been waiting.",
    tags: ["flying", "childhood", "adventure"],
    stats: [124, 32, "1.4K"],
    mood: "Peaceful",
    color: "#5fd6c4",
  },
  {
    title: "I Keep Dreaming About the Ocean",
    body: "I was standing in the middle of a huge ocean. The water was completely calm, but I could see something moving underneath…",
    tags: ["water", "recurring"],
    stats: [87, 24, "960"],
    mood: "Mysterious",
    color: "#8a84ff",
  },
  {
    title: "Being Chased Through a Strange City",
    body: "I was running through a city I had never seen before. Every street looked familiar, but none led anywhere I knew…",
    tags: ["chasing", "nightmare"],
    stats: [203, 58, "3.1K"],
    mood: "Scared",
    color: "#ff7a6b",
  },
];

function Fragments({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const row = [...items, ...items];
  return (
    <div className="fade-edges overflow-hidden" aria-hidden>
      <div className={`drift ${reverse ? "drift-reverse" : ""}`}>
        {row.map((t, i) => (
          <span key={i} className="fragment">{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="overflow-x-clip">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/feed" className="hidden px-3 py-2 text-mist transition-colors hover:text-moon sm:block">
            Explore dreams
          </Link>
          <Link href="/login" className="btn-ghost !py-2">
            Log in
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-5 pb-16 pt-44 sm:pt-10">
          <div aria-hidden className="pointer-events-none absolute -right-14 top-2 h-44 w-44 sm:-right-12 sm:top-2 sm:h-[22rem] sm:w-[22rem] lg:-right-6 lg:h-[25rem] lg:w-[25rem]">
            <div className="halo" style={{ inset: "-14%" }} />
            <div className="halo" style={{ inset: "-32%" }} />
            <div className="halo" style={{ inset: "-56%", borderColor: "rgb(243 236 216 / 0.04)" }} />
            <div className="moon h-full w-full" />
          </div>

          <div className="relative max-w-4xl">
            <h1 className="hero-title">Your dreams don&apos;t have to disappear when you wake up.</h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-mist">{SITE.description}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/dreams/new" className="btn-primary !px-8 !py-4 text-base">
                Share a Dream
              </Link>
              <Link href="/feed" className="btn-ghost !px-8 !py-4 text-base">
                Explore Dreams
              </Link>
            </div>
            <p className="mt-5 text-sm text-mist/80">Free. Post under your name or fully anonymously.</p>
          </div>
        </section>

        {/* Dreams drifting by */}
        <section className="space-y-5 py-6" aria-label="Fragments of dreams">
          <Fragments items={FRAGMENTS_A} />
          <Fragments items={FRAGMENTS_B} reverse />
        </section>

        {/* Examples */}
        <section className="mx-auto max-w-6xl px-5 py-24" aria-labelledby="examples">
          <h2 id="examples" className="font-display">The kind of dreams people share</h2>
          <p className="mt-3 text-sm text-mist/80">Examples, to show what a dream looks like here.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-5">
            {EXAMPLES.map((d, i) => (
              <article
                key={d.title}
                className={`pane flex flex-col p-6 sm:p-8 ${i === 0 ? "md:col-span-3 md:row-span-2" : "md:col-span-2"}`}
                style={{ "--mood": d.color } as CSSProperties}
              >
                <span
                  className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-moon"
                  style={{ background: `color-mix(in oklab, ${d.color} 18%, transparent)` }}
                >
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                  {d.mood}
                </span>
                <h3 className={i === 0 ? "font-display text-4xl leading-[1.05] sm:text-5xl" : "pane-title"}>{d.title}</h3>
                <p className={`mt-4 font-display leading-relaxed text-moon/70 ${i === 0 ? "text-[1.45rem]" : "flex-1 text-[1.2rem]"}`}>{d.body}</p>
                <div className={`flex flex-wrap gap-1.5 ${i === 0 ? "mt-6" : "mt-6"}`}>
                  {d.tags.map((t) => (
                    <span key={t} className="chip">#{t}</span>
                  ))}
                </div>
                {i === 0 && (
                  <div className="mt-8 hidden space-y-4 border-t border-line pt-6 md:block">
                    <p className="font-display text-2xl">What do you think it means?</p>
                    <div className="text-sm leading-relaxed">
                      <p className="text-mist">@campus</p>
                      <p className="mt-1 text-moon/80">I&apos;ve had almost the exact same dream! Mine ended at a lake, though.</p>
                    </div>
                    <div className="text-sm leading-relaxed">
                      <p className="text-mist">@nightowl <span className="ml-1 text-violet">Interpretation</span></p>
                      <p className="mt-1 text-moon/80">Flying over a childhood home might be about looking back at where you came from, with some distance and warmth.</p>
                    </div>
                  </div>
                )}
                <div className="mt-5 flex items-center gap-5 text-sm text-mist">
                  <span className="inline-flex items-center gap-1.5"><Heart size={15} aria-hidden /> {d.stats[0]}</span>
                  <span className="inline-flex items-center gap-1.5"><MessageCircle size={15} aria-hidden /> {d.stats[1]}</span>
                  <span className="inline-flex items-center gap-1.5"><Eye size={15} aria-hidden /> {d.stats[2]}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Why */}
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="grid gap-12 md:grid-cols-3 md:gap-0">
            {[
              { icon: Moon, title: "Write it while it's fresh", text: "Only the story is required. Add a mood and tags when you're awake enough." },
              { icon: MessagesSquare, title: "See who dreamed it too", text: "Find similar dreams and read what others think they might mean. Interpretations are opinions, not facts." },
              { icon: EyeOff, title: "Share on your terms", text: "Post publicly, anonymously, or keep it private. Anonymous dreams never show your username." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="md:border-l md:border-line md:px-8 md:first:border-l-0 md:first:pl-0">
                <Icon className="text-violet" size={22} aria-hidden />
                <h3 className="mt-5 font-display">{title}</h3>
                <p className="mt-3 max-w-xs leading-relaxed text-mist">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dawn call to action */}
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="horizon relative overflow-hidden rounded-[2.25rem] border border-line px-8 py-16 text-center sm:px-16 sm:py-24">
            <h2 className="font-display mx-auto max-w-2xl !text-[clamp(2.4rem,6vw,4.2rem)] !leading-[1]">
              What did you dream last night?
            </h2>
            <p className="mx-auto mt-5 max-w-md text-mist">It takes a minute, and it fades faster than you think.</p>
            <Link href="/dreams/new" className="btn-primary mt-9 !px-8 !py-4 text-base">
              Share a Dream <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 text-sm leading-relaxed text-mist/80">
          <p className="max-w-3xl">
            {SITE.name} is a community for reflection and storytelling. Dream interpretations are subjective, not
            scientific, and are never a medical diagnosis or a prediction. If you&apos;re struggling, please talk to someone you trust or a health professional.
          </p>
          <nav className="mt-4 flex flex-wrap gap-5" aria-label="Legal">
            <Link href="/terms" className="hover:text-moon">Terms</Link>
            <Link href="/privacy" className="hover:text-moon">Privacy</Link>
            <Link href="/guidelines" className="hover:text-moon">Community guidelines</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
