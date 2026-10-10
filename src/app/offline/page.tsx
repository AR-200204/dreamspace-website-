import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-10 font-display text-4xl">You&apos;re offline</p>
      <p className="mt-3 max-w-sm text-mist">
        Check your connection and try again. Your dreams are safe and will be here when you&apos;re back.
      </p>
    </main>
  );
}
