"use client";

import { useEffect } from "react";

// Tells cards where the mouse is, so they can show a soft spotlight under it. One listener for the whole site.
export function PointerGlow() {
  useEffect(() => {
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const target = e.target as Element | null;
      const el = target?.closest?.(".pane, .card-link") as HTMLElement | null;
      if (!el) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
