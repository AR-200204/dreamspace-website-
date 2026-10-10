import Link from "next/link";
import { Logo } from "./Logo";
import { SITE } from "@/lib/config";

export const LEGAL_UPDATED = "October 8, 2026";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Logo />
      <h1 className="mt-10 font-display text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-mist">Last updated {LEGAL_UPDATED}</p>
      <div className="mt-8 space-y-8 leading-relaxed [&_h2]:font-display [&_h2]:text-xl [&_li]:text-mist [&_p]:mt-2 [&_p]:text-mist [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
      <p className="mt-10 text-sm text-mist">
        {SITE.contactEmail ? (
          <>Questions? Contact us at <a className="text-moon underline underline-offset-4" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</>
        ) : (
          <>Questions? Use the contact details shown on our site.</>
        )}
      </p>
      <nav className="mt-8 flex flex-wrap gap-5 border-t border-line pt-6 text-sm text-mist" aria-label="Legal">
        <Link href="/terms" className="hover:text-moon">Terms</Link>
        <Link href="/privacy" className="hover:text-moon">Privacy</Link>
        <Link href="/guidelines" className="hover:text-moon">Community guidelines</Link>
        <Link href="/feed" className="hover:text-moon">Back to dreams</Link>
      </nav>
    </main>
  );
}
