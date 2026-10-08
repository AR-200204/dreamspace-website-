import Link from "next/link";
import { SITE } from "@/lib/config";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <span aria-hidden className="moon block h-6 w-6" style={{ animation: "none", boxShadow: "0 0 14px 2px rgb(239 230 207 / 0.35)" }} />
      <span className="font-display text-xl tracking-tight">{SITE.name}</span>
    </Link>
  );
}
