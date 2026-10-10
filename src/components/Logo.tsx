import Link from "next/link";
import { SITE } from "@/lib/config";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden
        className="moon block h-6 w-6"
        style={{ boxShadow: "0 0 16px 2px rgb(243 236 216 / 0.4)" }}
      />
      <span className="font-display text-[1.7rem] leading-none tracking-tight">{SITE.name}</span>
    </Link>
  );
}
