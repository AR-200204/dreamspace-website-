"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, PenLine, Search, User, LogIn } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

export function AppNav({ username }: { username: string | null }) {
  const pathname = usePathname();
  const items = [
    { href: "/feed", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/search", label: "Search", icon: Search },
    username
      ? { href: `/u/${username}`, label: "Profile", icon: User }
      : { href: "/login", label: "Log in", icon: LogIn },
  ];

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-line px-5 py-7 md:flex">
        <div className="space-y-8">
          <Logo />
          <nav className="space-y-1" aria-label="Main">
            {items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
                  isActive(href) ? "bg-white/8 text-moon" : "text-mist hover:bg-white/5 hover:text-moon"
                )}
              >
                <Icon size={19} aria-hidden /> {label}
              </Link>
            ))}
          </nav>
          <Link href="/dreams/new" className="btn-primary w-full">
            <PenLine size={16} aria-hidden /> Share a dream
          </Link>
        </div>
        <p className="text-xs leading-relaxed text-mist/70">
          Dream interpretation is subjective. Nothing here is medical or scientific advice.
        </p>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-night/85 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        {!username && (
          <Link href="/login" className="btn-ghost !py-1.5">
            Log in
          </Link>
        )}
      </header>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-night/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
      >
        {items.slice(0, 2).map(({ href, label, icon: Icon }) => (
          <MobileItem key={href} href={href} label={label} active={isActive(href)}>
            <Icon size={22} aria-hidden />
          </MobileItem>
        ))}
        <Link
          href="/dreams/new"
          aria-label="Share a dream"
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-moon text-night shadow-[0_0_30px_rgb(143_130_247_/_0.45)]"
        >
          <PenLine size={22} aria-hidden />
        </Link>
        {items.slice(2).map(({ href, label, icon: Icon }) => (
          <MobileItem key={href} href={href} label={label} active={isActive(href)}>
            <Icon size={22} aria-hidden />
          </MobileItem>
        ))}
      </nav>
    </>
  );
}

function MobileItem({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("flex w-16 flex-col items-center gap-0.5 py-1 text-[11px]", active ? "text-moon" : "text-mist")}
    >
      {children}
      {label}
    </Link>
  );
}
