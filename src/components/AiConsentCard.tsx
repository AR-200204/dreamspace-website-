import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { giveAiConsent } from "@/app/actions";
import { aiMayTrain } from "@/lib/ai";

// Shown once, before anyone can use an AI feature.
export function AiConsentCard({ back, anchor }: { back: string; anchor: string }) {
  const trains = aiMayTrain();
  return (
    <form action={giveAiConsent} className="card mt-4 space-y-4 p-5 sm:p-6">
      <input type="hidden" name="back" value={back} />
      <input type="hidden" name="anchor" value={anchor} />
      <p className="flex items-center gap-2 font-display text-2xl">
        <ShieldCheck size={20} className="text-violet" aria-hidden /> Before you use AI features
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-mist">
        <li>
          The text you choose (a dream, or your question) is sent to a third-party AI service. We never send your username or email.
        </li>
        {trains ? (
          <li>
            We use <strong className="text-moon">free AI models</strong>. The companies behind them <strong className="text-moon">may keep that text and use it to improve their
            models</strong>, and we can&apos;t delete it from their systems.
          </li>
        ) : (
          <li>The AI service handles that text under its own privacy terms, and we can&apos;t delete it from their systems.</li>
        )}
        <li>Only use AI on dreams you are comfortable sharing, and leave out real names, addresses and other private details.</li>
        <li>Replies are ideas for reflection, not advice, a diagnosis or a prediction.</li>
        <li>An author must allow AI on their own dream before anyone can use it on that dream. You can withdraw this agreement any time in Settings.</li>
      </ul>
      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" name="agree" className="mt-1" />
        <span>
          I understand and agree. I have read the <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link> and{" "}
          <Link href="/terms" className="underline underline-offset-2">Terms</Link>.
        </span>
      </label>
      <button className="btn-primary">Agree and continue</button>
    </form>
  );
}
