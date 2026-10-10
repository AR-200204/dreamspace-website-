"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; theme?: string }) => string;
      remove: (id: string) => void;
    };
  }
}

// Cloudflare Turnstile: a free, privacy-friendly "are you human" check.
// Shows nothing unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. When solved, it adds a
// hidden "cf-turnstile-response" field to the surrounding form automatically.
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const render = useCallback(() => {
    if (!siteKey || !window.turnstile || !box.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(box.current, { sitekey: siteKey, theme: "dark" });
  }, [siteKey]);

  useEffect(() => {
    render();
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [render]);

  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={render} />
      <div ref={box} className="min-h-[65px]" />
    </>
  );
}
