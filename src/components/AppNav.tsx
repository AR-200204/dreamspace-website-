"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bookmark, ChartColumn, Compass, Flame, Home, LogIn, PenLine, Search, Shield, User } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>; badge?: number };

export function AppNav({ username, unread, isAdmin }: { username: string | null; unread: number; isAdmin: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  const profile: Item = username
    ? { href: `/u/${username}`, label: "Profile", icon: User }
    : { href: "/login", label: "Log in", icon: LogIn };

  const desktop: Item[] = [
    { href: "/feed", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/trending", label: "Trending", icon: Flame },
    { href: "/search", label: "Search", icon: Search },
    ...(username
      ? [
          { href: "/insights", label: "Insights", icon: ChartColumn },
          { href: "/saved", label: "Saved", icon: Bookmark },
          { href: "/notifications", label: "Notifications", icon: Bell, badge: unread },
        ]
      : []),
    profile,
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const bottomLeft: Item[] = [
    { href: "/feed", label: "Home", icon: Home },
    { href: "/trending", label: "Trending", icon: Flame },
  ];
  const bottomRight: Item[] = [
    username ? { href: "/notifications", label: "Alerts", icon: Bell, badge: unread } : { href: "/explore", label: "Explore", icon: Compass },
    profile,
  ];

  const topIcons: Item[] = [
    { href: "/search", label: "Search", icon: Search },
    { href: "/explore", label: "Explore", icon: Compass },
    ...(username
      ? [
          { href: "/insights", label: "Insights", icon: ChartColumn },
          { href: "/saved", label: "Saved", icon: Bookmark },
        ]
      : []),
  ];

  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-line px-6 py-8 md:flex">
        <div className="space-y-8">
          <Logo />
          <nav className="space-y-0.5" aria-label="Main">
            {desktop.map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] transition-colors",
                  isActive(href)
                    ? "bg-white/9 text-moon shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
                    : "text-mist hover:bg-white/5 hover:text-moon"
                )}
              >
                <Icon size={19} aria-hidden /> {label}
                {!!badge && (
                  <span className="ml-auto rounded-full bg-violet px-2 py-0.5 text-xs font-medium text-night" aria-label={`${badge} unread`}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <Link href="/dreams/new" className="btn-primary w-full">
            <PenLine size={16} aria-hidden /> Share a dream
          </Link>
        </div>
        <p className="pt-6 text-xs leading-relaxed text-mist/70">
          Dream interpretation is subjective. Nothing here is medical or scientific advice.{" "}
          <Link href="/guidelines" className="underline underline-offset-2 hover:text-moon">Guidelines</Link>{" · "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-moon">Terms</Link>{" · "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-moon">Privacy</Link>
        </p>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-night/70 px-4 py-3 backdrop-blur-xl md:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          {topIcons.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-label={label} className="rounded-full p-2 text-mist hover:text-moon">
              <Icon size={20} aria-hidden />
            </Link>
          ))}
          {!username && (
            <Link href="/login" className="btn-ghost ml-1 !py-1.5">
              Log in
            </Link>
          )}
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex items-center justify-around rounded-full border border-line bg-dusk/80 px-2 py-1.5 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.7)] backdrop-blur-xl md:hidden"
      >
        {bottomLeft.map((i) => (
          <MobileItem key={i.href} item={i} active={isActive(i.href)} />
        ))}
        <Link
          href="/dreams/new"
          aria-label="Share a dream"
          className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-moon text-night shadow-[0_0_0_4px_rgb(6_7_19/0.9),0_10px_36px_-4px_rgb(255_181_158/0.6)]"
        >
          <PenLine size={22} aria-hidden />
        </Link>
        {bottomRight.map((i) => (
          <MobileItem key={i.href} item={i} active={isActive(i.href)} />
        ))}
      </nav>
    </>
  );
}

function MobileItem({ item, active }: { item: Item; active: boolean }) {
  const { href, label, icon: Icon, badge } = item;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("relative flex w-16 flex-col items-center gap-0.5 py-1 text-[11px]", active ? "text-moon" : "text-mist")}
    >
      <span className="relative">
        <Icon size={22} aria-hidden />
        {!!badge && (
          <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-violet px-1 text-center text-[10px] font-medium leading-4 text-night">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}
