import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Community guidelines" };

export default function GuidelinesPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Logo />
      <h1 className="mt-10 font-display text-4xl">Community guidelines</h1>
      <p className="mt-4 leading-relaxed text-mist">
        {SITE.name} is a calm place to share dreams and talk about them. These rules keep it that way.
      </p>

      <div className="mt-8 space-y-8 leading-relaxed">
        <section>
          <h2 className="font-display text-xl">Be kind</h2>
          <p className="mt-2 text-mist">No harassment, bullying, hate speech or targeting of people. Disagree with an interpretation politely.</p>
        </section>
        <section>
          <h2 className="font-display text-xl">Interpretations are opinions</h2>
          <p className="mt-2 text-mist">
            Dream meanings are subjective and not scientifically proven. Share what a dream makes you think of, not
            what it &ldquo;definitely means&rdquo;. <strong className="text-moon">Never use a dream to diagnose someone or give medical or mental-health advice.</strong>{" "}
            A single dream cannot diagnose a condition.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">Not allowed</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-mist">
            <li>Sexual content, graphic violence or gore</li>
            <li>Spam, ads and self-promotion</li>
            <li>Illegal content, or content that exposes someone&apos;s private information</li>
            <li>Content that encourages self-harm</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-xl">If you are struggling</h2>
          <p className="mt-2 text-mist">
            Dreams can be heavy. If something is weighing on you, please talk to someone you trust or a health
            professional. If you are in immediate danger, contact your local emergency services.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">Reporting and enforcement</h2>
          <p className="mt-2 text-mist">
            Use <em>Report</em> on any dream or comment. Moderators review reports and may remove content or restrict
            accounts that break these rules. You can also block anyone so you no longer see their named dreams and comments.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">Privacy</h2>
          <p className="mt-2 text-mist">
            Anonymous dreams never show your username to other users. You can edit, delete or make a dream private at any time.
            AI features send the text of a shared dream to an AI provider to generate a reflection.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-mist">See also our <Link href="/terms" className="underline underline-offset-4">Terms</Link> and <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.</p>
      <Link href="/feed" className="btn-primary mt-6">Back to dreams</Link>
    </main>
  );
}
