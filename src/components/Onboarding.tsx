"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, Lock, MoonStar, PenLine, Telescope, UserRound, Users, VenetianMask } from "lucide-react";
import { completeOnboarding } from "@/app/actions";
import { cn } from "@/lib/utils";

type Visibility = "anonymous" | "public" | "private";

const GOALS = [
  { id: "remember", icon: PenLine, title: "Remember more of my dreams", text: "Capture them before they fade", plan: "Write a dream down the moment you wake. A single image counts." },
  { id: "lucid", icon: Eye, title: "Explore lucid dreaming", text: "Learn to know you are dreaming", plan: "Try a reality check today, and tag any dream where you noticed you were dreaming #lucid." },
  { id: "sleep", icon: MoonStar, title: "Calmer nights and mornings", text: "A gentle routine around dreams", plan: "Keep it to one calm minute each morning. Your streak and mood chart will follow." },
  { id: "patterns", icon: Telescope, title: "Find patterns", text: "See what keeps coming back", plan: "Log a few dreams and Insights will start showing your themes and dream signs." },
  { id: "share", icon: Users, title: "Share and discuss", text: "Read others, compare notes", plan: "Browse the feed, react to a dream, and leave an interpretation." },
] as const;

const VISIBILITY: Array<{ id: Visibility; icon: typeof Lock; title: string; text: string }> = [
  { id: "anonymous", icon: VenetianMask, title: "Anonymously", text: "Shown as “Anonymous Dreamer”. Your username stays hidden. A good place to start." },
  { id: "public", icon: UserRound, title: "With my username", text: "Your dreams appear on your profile, and people can follow you." },
  { id: "private", icon: Lock, title: "Only me", text: "A private journal. You can share any dream later." },
];

// One sky per step, so the page itself shifts from night towards dawn as you go.
const SKIES = ["night", "observatory", "lantern", "dawn"];
// How the moon sits at each step (it shrinks and drifts as the tour goes on).
const MOON = [
  { h: 176, s: 1, o: 1 },
  { h: 72, s: 0.38, o: 0.9 },
  { h: 72, s: 0.38, o: 0.8 },
  { h: 96, s: 0.5, o: 0.6 },
];

export function Onboarding({ username, initialGoals, initialVisibility }: { username: string; initialGoals: string[]; initialVisibility: Visibility }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [goals, setGoals] = useState<string[]>(initialGoals);
  const [vis, setVis] = useState<Visibility>(initialVisibility);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // The sky behind the whole page changes with the step.
  useEffect(() => {
    document.documentElement.dataset.sky = SKIES[step];
    return () => {
      delete document.documentElement.dataset.sky;
    };
  }, [step]);

  // Move focus to the new heading so keyboard and screen reader users follow along.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const go = (n: number) => {
    setDir(n > step ? "fwd" : "back");
    setStep(n);
  };
  const toggleGoal = (id: string) => setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  const chosen = GOALS.filter((g) => goals.includes(g.id));
  const m = MOON[step];

  return (
    <form action={completeOnboarding} className="relative flex min-h-screen flex-col overflow-x-clip px-5 pb-4 pt-6">
      {/* hidden values travel with the form */}
      {goals.map((g) => (
        <input key={g} type="hidden" name="goal" value={g} />
      ))}
      <input type="hidden" name="default_visibility" value={vis} />

      {/* A warm glow rises behind everything on the last step. */}
      <div
        aria-hidden
        className="step-glow pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{ opacity: step === 3 ? 1 : 0, background: "radial-gradient(70% 80% at 50% 110%, rgb(255 191 163 / 0.35), transparent 70%)" }}
      />

      <div className="relative mx-auto flex w-full max-w-xl items-center justify-between">
        <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of 4`}>
          {SKIES.map((_, i) => (
            <span key={i} className={cn("progress-pill h-1.5 rounded-full", i === step ? "w-8 bg-violet" : i < step ? "w-3 bg-violet/60" : "w-3 bg-white/15")} />
          ))}
        </div>
        {step < 3 && (
          <button type="submit" name="skip" value="1" formNoValidate className="text-sm text-mist underline-offset-4 hover:text-moon hover:underline">
            Skip for now
          </button>
        )}
      </div>

      <div className="relative mx-auto mt-6 flex w-full max-w-xl flex-1 flex-col">
        <div aria-hidden className="step-moon relative mx-auto w-full shrink-0" style={{ height: m.h, opacity: m.o, transition: "height 1.1s var(--ease), opacity 1.1s var(--ease)" }}>
          <div
            className="moon absolute left-1/2 top-1/2 h-44 w-44"
            style={{ transform: `translate(-50%, -50%) scale(${m.s})`, transition: "transform 1.1s var(--ease)" }}
          />
        </div>

        <div key={step} className={cn("mt-4 flex-1", dir === "fwd" ? "step-fwd" : "step-back")}>
          {step === 0 && (
            <div className="text-center">
              <h1 ref={heading} tabIndex={-1} className="font-display outline-none">Welcome, @{username}.</h1>
              <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-mist">
                A quiet place to remember your dreams, notice what keeps coming back, and explore waking up inside them. Let&apos;s set things up. It takes under a minute.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 ref={heading} tabIndex={-1} className="font-display text-center outline-none">What brings you here?</h2>
              <p className="mt-3 text-center text-mist">Pick any that fit. We&apos;ll shape your first steps around them.</p>
              <div className="mt-7 grid gap-3" role="group" aria-label="Your goals">
                {GOALS.map(({ id, icon: Icon, title, text }) => {
                  const on = goals.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleGoal(id)}
                      className={cn(
                        "choice flex items-center gap-4 rounded-2xl border p-4 text-left",
                        on ? "border-violet bg-violet/12" : "border-line bg-white/3 hover:border-violet/40"
                      )}
                    >
                      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", on ? "bg-violet text-night" : "bg-white/8 text-violet")}>
                        {on ? <Check size={18} aria-hidden /> : <Icon size={18} aria-hidden />}
                      </span>
                      <span>
                        <span className="block font-medium text-moon">{title}</span>
                        <span className="block text-sm text-mist">{text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 ref={heading} tabIndex={-1} className="font-display text-center outline-none">How would you like to share?</h2>
              <p className="mt-3 text-center text-mist">This is only your starting point. You can change it on every dream, and any time in Settings.</p>
              <div className="mt-7 grid gap-3" role="radiogroup" aria-label="Default sharing">
                {VISIBILITY.map(({ id, icon: Icon, title, text }) => {
                  const on = vis === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setVis(id)}
                      className={cn(
                        "choice flex items-center gap-4 rounded-2xl border p-4 text-left",
                        on ? "border-violet bg-violet/12" : "border-line bg-white/3 hover:border-violet/40"
                      )}
                    >
                      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", on ? "bg-violet text-night" : "bg-white/8 text-violet")}>
                        <Icon size={18} aria-hidden />
                      </span>
                      <span>
                        <span className="block font-medium text-moon">{title}</span>
                        <span className="block text-sm text-mist">{text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 ref={heading} tabIndex={-1} className="font-display text-center outline-none">You&apos;re all set.</h2>
              <p className="mt-3 text-center text-mist">
                {chosen.length > 0 ? "Here is your plan for the first few days." : "Start wherever you like. The first dream is always the hardest to remember."}
              </p>
              {chosen.length > 0 && (
                <ul className="mt-7 space-y-3">
                  {chosen.map(({ id, icon: Icon, title, plan }, i) => (
                    <li key={id} className="rise flex gap-4 rounded-2xl border border-line bg-white/3 p-4" style={{ "--d": `${i * 110}ms` } as React.CSSProperties}>
                      <Icon size={20} className="mt-0.5 shrink-0 text-violet" aria-hidden />
                      <span>
                        <span className="block font-medium text-moon">{title}</span>
                        <span className="block text-sm leading-relaxed text-mist">{plan}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 -mx-5 mt-8 flex items-center justify-between gap-3 bg-gradient-to-t from-night via-night/85 to-transparent px-5 pb-5 pt-10">
          {step > 0 ? (
            <button type="button" onClick={() => go(step - 1)} className="btn-ghost">
              <ArrowLeft size={16} aria-hidden /> Back
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button type="button" onClick={() => go(step + 1)} className="btn-primary !px-7">
              {step === 0 ? "Begin" : "Continue"} <ArrowRight size={16} aria-hidden />
            </button>
          ) : (
            <div className="flex flex-wrap justify-end gap-3">
              <button type="submit" name="to" value="/feed" className="btn-ghost">Explore the feed</button>
              <button type="submit" name="to" value="/dreams/new" className="btn-primary !px-7">
                Write my first dream <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
