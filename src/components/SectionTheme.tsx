"use client";

import { useEffect, useRef } from "react";

// Wrap a section of the landing page: when it reaches the middle of the screen,
// the sky behind the whole page crossfades to this section's theme.
export function SectionTheme({ theme, children, className }: { theme: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) root.dataset.sky = theme;
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      delete root.dataset.sky;
    };
  }, [theme]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
