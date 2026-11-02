import Link from "next/link";
import { Fragment, type CSSProperties } from "react";
import { ArrowRight, BookOpenCheck, ChartColumn, EyeOff, Flame, Moon, MoonStar, PenLine, Sunrise, Telescope, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import { RealityCheck } from "@/components/RealityCheck";
import { Reveal } from "@/components/Reveal";
import { SectionTheme } from "@/components/SectionTheme";

// Moments of becoming lucid. They drift across the night sky behind the hero.
const FRAGMENTS_A = [
  "I looked at my hands and counted too many fingers",
  "and then I knew, quietly, that I was dreaming",
  "the sign kept changing every time I read it",
  "I realised I was dreaming, and the sky turned violet",
  "I decided to fly, and I did",
  "I stopped running, turned around, and the dark thing smiled",
];
const FRAGMENTS_B = [
  "I stayed calm, and the dream stayed with me",
  "I stepped through the door I had always been afraid of",
  "everything was real and unreal at the same time",
  "I woke up and wrote it all down before it faded",
  "the ocean was calm because I wanted it calm",
  "we were running, and then I realised I could stop",
];

const HEADLINE = "Your dreams don’t have to disappear when you wake up.".split(" ");

const STEPS = [
  {
    icon: PenLine,
    title: "Remember more",
    text: "Dream recall is the foundation. In a large study, people who already remembered more dreams did better with lucid dreaming techniques. Write each dream down within minutes of waking, even if it is only a fragment.",
    here: "A one-minute capture page, a streak that builds the habit, and a private journal only you can see.",
  },
  {
    icon: Telescope,
    title: "Spot your dream signs",
    text: "Dream signs are the strange things that keep turning up: a place, a person, a feeling. Recognise one inside a dream, and you can realise you are dreaming.",
    here: "Insights finds the themes, words and places that keep coming back across your journal, including your lucid moments.",
  },
  {
    icon: BookOpenCheck,
    title: "Practise the techniques",
    text: "Studies found that combining reality checks, waking briefly after about five hours of sleep, and setting a clear intention as you fall back asleep can raise the chance of a lucid dream. Reality checks on their own worked poorly in short studies.",
    here: "Try a reality check on this page, and use a daily prompt to keep dreams on your mind.",
  },
  {
    icon: Users,
    title: "Share and learn",
    text: "Read other people's lucid dreams, compare what worked, and ask questions. Learning is faster with company.",
    here: "Tag a dream #lucid, browse the Lucid category, and talk it through in the comments.",
    link: { href: "/search?tag=lucid", label: "Browse lucid dreams" },
  },
];

const NIGHT = [
  { icon: MoonStar, title: "Before bed", text: "Read tonight's Dream of the Day. Tell yourself you will remember." },
  { icon: Sunrise, title: "When you wake", text: "Stay still, then write what you remember, even a single image." },
  { icon: ChartColumn, title: "Through the day", text: "Check your Insights, try a reality check, and watch for your dream signs." },
];

const CALM = [
  { icon: PenLine, title: "Write it down, let it go", text: "Many dreamers find that getting a dream out of their head and onto the page makes the morning feel lighter." },
  { icon: ChartColumn, title: "See how your nights feel", text: "Insights shows whether your dreams have felt harder or gentler lately, week by week, so you notice when something changes." },
  { icon: EyeOff, title: "Share the heavy ones", text: "Post a nightmare anonymously, or keep it private. Other people's replies can remind you that you are not alone with it." },
  { icon: Flame, title: "A gentle daily habit", text: "A one-minute morning ritual, a streak to keep it going, and a new question every day." },
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
      <header className="rise relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <a href="#lucid" className="hidden px-3 py-2 text-mist transition-colors hover:text-moon sm:block">Lucid dreaming</a>
          <Link href="/feed" className="hidden px-3 py-2 text-mist transition-colors hover:text-moon sm:block">Explore dreams</Link>
          <Link href="/login" className="btn-ghost !py-2">Log in</Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <SectionTheme theme="night">
          <section className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-5 pb-16 pt-44 sm:pt-10">
            <div aria-hidden className="shooting-star" style={{ top: "14%", right: "26%" }} />
            <div aria-hidden className="shooting-star" style={{ top: "34%", right: "8%", animationDelay: "-7s" }} />
            <div aria-hidden className="moon-in pointer-events-none absolute -right-14 top-2 h-44 w-44 sm:-right-12 sm:top-2 sm:h-[22rem] sm:w-[22rem] lg:-right-6 lg:h-[25rem] lg:w-[25rem]">
              <div className="halo" style={{ inset: "-14%" }} />
              <div className="halo" style={{ inset: "-32%" }} />
              <div className="halo" style={{ inset: "-56%", borderColor: "rgb(243 236 216 / 0.04)" }} />
              <div className="moon h-full w-full" />
            </div>

            <div className="relative max-w-4xl">
              <h1 className="hero-title words" aria-label="Your dreams don’t have to disappear when you wake up.">
                {HEADLINE.map((w, i) => (
                  <Fragment key={i}>
                    <span className="w" aria-hidden style={{ "--i": i } as CSSProperties}>
                      <span>{w}</span>
                    </span>{" "}
                  </Fragment>
                ))}
              </h1>
              <p className="rise mt-8 max-w-xl text-lg leading-relaxed text-mist" style={{ "--d": "950ms" } as CSSProperties}>
                Remember more of your dreams, find the patterns hiding in them, and explore lucid dreaming, with a community of dreamers beside you.
              </p>
              <div className="rise mt-10 flex flex-wrap gap-3" style={{ "--d": "1100ms" } as CSSProperties}>
                <Link href="/dreams/new" className="btn-primary !px-8 !py-4 text-base">Share a Dream</Link>
                <Link href="/feed" className="btn-ghost !px-8 !py-4 text-base">Explore Dreams</Link>
              </div>
              <p className="rise mt-5 text-sm text-mist/80" style={{ "--d": "1250ms" } as CSSProperties}>
                Free. Post under your name or fully anonymously.{" "}
                <a href="#lucid" className="link-draw text-moon">Curious about lucid dreaming? See how it works.</a>
              </p>
            </div>
          </section>
        </SectionTheme>

        {/* Lucid moments drifting by */}
        <SectionTheme theme="twilight">
          <section className="space-y-5 py-6" aria-label="Moments of becoming lucid">
            <Fragments items={FRAGMENTS_A} />
            <Fragments items={FRAGMENTS_B} reverse />
          </section>
        </SectionTheme>

        {/* Lucid dreaming */}
        <SectionTheme theme="observatory">
          <section id="lucid" className="mx-auto max-w-6xl scroll-mt-10 px-5 py-28" aria-labelledby="lucid-h">
            <Reveal className="max-w-3xl">
              <h2 id="lucid-h" className="font-display !text-[clamp(2.6rem,6vw,4.6rem)] !leading-[0.98]">Wake up inside your dreams.</h2>
              <p className="mt-6 text-lg leading-relaxed text-mist">
                A lucid dream is one where you know you are dreaming while it is still happening. Studies suggest more than half of adults have had at least one,
                and about a quarter have them at least once a month. It isn&apos;t magic. It is a skill, and it starts with remembering your dreams.
              </p>
            </Reveal>

            <div className="mt-16 grid gap-14 lg:grid-cols-[1.25fr_1fr]">
              <ol className="relative space-y-12 border-l border-line pl-8 sm:pl-10">
                {STEPS.map(({ icon: Icon, title, text, here, link }, i) => (
                  <Reveal as="li" key={title} delay={i * 90} className="relative">
                    <span
                      aria-hidden
                      className="absolute -left-[3.1rem] top-0 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-night font-display text-xl text-violet sm:-left-[3.4rem]"
                    >
                      {i + 1}
                    </span>
                    <h3 className="flex items-center gap-3 font-display">
                      <Icon size={20} className="text-violet" aria-hidden /> {title}
                    </h3>
                    <p className="mt-3 max-w-xl leading-relaxed text-moon/85">{text}</p>
                    <p className="mt-4 max-w-xl rounded-2xl border border-line bg-white/3 px-4 py-3 text-sm leading-relaxed text-mist">
                      <span className="text-violet">On DreamSpace:</span> {here}
                      {link && (
                        <>
                          {" "}
                          <Link href={link.href} className="link-draw text-moon">{link.label}</Link>
                        </>
                      )}
                    </p>
                  </Reveal>
                ))}
              </ol>

              <Reveal className="lg:sticky lg:top-24 lg:self-start" delay={150}>
                <RealityCheck />
                <p className="mt-5 text-sm leading-relaxed text-mist/90">
                  Results vary. No technique works every time for everyone, and the research is still developing. If you already have trouble sleeping, skip waking
                  up in the night on purpose and stick to journaling.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-mist/70">
                  Based on published studies, including the{" "}
                  <a
                    href="https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.01746/full"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-moon"
                  >
                    International Lucid Dream Induction Study
                  </a>
                  .
                </p>
              </Reveal>
            </div>
          </section>
        </SectionTheme>

        {/* Better nights, calmer mornings */}
        <SectionTheme theme="lantern">
          <section className="mx-auto max-w-6xl px-5 py-24" aria-labelledby="calm-h">
            <Reveal className="max-w-3xl">
              <h2 id="calm-h" className="font-display !text-[clamp(2.4rem,5.4vw,4rem)] !leading-[1]">Calmer nights. Gentler mornings.</h2>
              <p className="mt-6 text-lg leading-relaxed text-mist">
                DreamSpace isn&apos;t a sleep treatment, but a few small habits around your dreams can change how your mornings feel.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
              {CALM.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={(i % 2) * 120} className="border-t border-line pt-6">
                  <Icon size={22} className="text-violet" aria-hidden />
                  <h3 className="mt-4 font-display">{title}</h3>
                  <p className="mt-3 max-w-md leading-relaxed text-mist">{text}</p>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-20">
              <h3 className="font-display">A night with DreamSpace</h3>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {NIGHT.map(({ icon: Icon, title, text }, i) => (
                  <div key={title} className="card relative p-6">
                    <span aria-hidden className="absolute right-5 top-4 font-display text-5xl text-white/6">{i + 1}</span>
                    <Icon size={22} className="text-violet" aria-hidden />
                    <p className="mt-5 font-display text-2xl">{title}</p>
                    <p className="mt-2 leading-relaxed text-mist">{text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-8 max-w-2xl text-sm leading-relaxed text-mist/80">
                This is not medical advice. If you have ongoing trouble sleeping, or nightmares that distress you often, please talk to a doctor or sleep specialist.
              </p>
            </Reveal>
          </section>
        </SectionTheme>

        {/* Community */}
        <SectionTheme theme="aurora">
          <section className="mx-auto max-w-6xl px-5 py-24" aria-labelledby="community-h">
            <Reveal className="mx-auto max-w-3xl text-center">
              <Moon size={26} className="mx-auto text-violet" aria-hidden />
              <h2 id="community-h" className="mt-5 font-display">You are not dreaming alone.</h2>
              <p className="mt-5 text-lg leading-relaxed text-mist">
                Browse lucid dreams, recurring dreams and nightmares from people around the world, read what they think they might mean, and find dreamers whose
                nights look like yours. Interpretations are opinions, not facts.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href="/search?tag=lucid" className="btn-primary !px-7 !py-3.5">Explore lucid dreams</Link>
                <Link href="/people" className="btn-ghost !px-7 !py-3.5">Find dreamers</Link>
              </div>
            </Reveal>
          </section>
        </SectionTheme>

        {/* Dawn call to action */}
        <SectionTheme theme="dawn">
          <section className="mx-auto max-w-6xl px-5 pb-24 pt-8">
            <Reveal>
              <div className="horizon relative overflow-hidden rounded-[2.25rem] border border-line px-8 py-16 text-center sm:px-16 sm:py-24">
                <h2 className="font-display mx-auto max-w-2xl !text-[clamp(2.4rem,6vw,4.2rem)] !leading-[1]">Your next dream could be a lucid one.</h2>
                <p className="mx-auto mt-5 max-w-md text-mist">Start your dream journal tonight. It takes a minute, and it is free.</p>
                <Link href="/dreams/new" className="btn-primary mt-9 !px-8 !py-4 text-base">
                  Start your dream journal <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </Reveal>
          </section>
        </SectionTheme>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 text-sm leading-relaxed text-mist/80">
          <p className="max-w-3xl">
            DreamSpace is a community for reflection and storytelling. Dream interpretations are subjective, not scientific, and are never a medical diagnosis or a
            prediction. If you&apos;re struggling, please talk to someone you trust or a health professional.
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
