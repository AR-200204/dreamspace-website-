"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

// Reality checks are a standard lucid-dreaming habit: ask "am I dreaming?" and test it.
const CHECKS = [
  { title: "Count your fingers", how: "Look at your hands and count your fingers. Look away, then count again.", why: "Hands often look odd or change in dreams." },
  { title: "Read it twice", how: "Read a line of text. Look away for a moment, then read it again.", why: "Writing tends to shift or turn to nonsense in dreams." },
  { title: "Try to breathe through your nose", how: "Pinch your nose closed and gently try to breathe in.", why: "In a dream, you can often still breathe." },
  { title: "Look at a clock twice", how: "Check the time, look away, check again.", why: "Clocks tend to jump around in dreams." },
  { title: "Trace your steps", how: "Ask yourself: how did I get here? Can I remember the last few minutes?", why: "Dream scenes often begin with no clear start." },
];

export function RealityCheck() {
  const [i, setI] = useState(0);
  const c = CHECKS[i];
  return (
    <div className="card relative overflow-hidden p-6 sm:p-8" aria-live="polite">
      <p className="text-sm text-violet">Try a reality check right now</p>
      <p key={i} className="rise mt-3 font-display text-[2rem] leading-[1.05] sm:text-[2.6rem]">{c.title}</p>
      <p key={`h${i}`} className="rise mt-4 max-w-md leading-relaxed" style={{ "--d": "80ms" } as React.CSSProperties}>{c.how}</p>
      <p key={`w${i}`} className="rise mt-2 max-w-md text-sm leading-relaxed text-mist" style={{ "--d": "160ms" } as React.CSSProperties}>{c.why}</p>
      <button type="button" onClick={() => setI((i + 1) % CHECKS.length)} className="btn-ghost mt-6">
        <RefreshCw size={15} aria-hidden /> Another check
      </button>
    </div>
  );
}
