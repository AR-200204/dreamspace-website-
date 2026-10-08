import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-5xl">Lost in a dream</p>
      <p className="mt-3 max-w-sm text-mist">We couldn&apos;t find that page. It may have been deleted, or it might be private.</p>
      <Link href="/feed" className="btn-primary mt-7">Back to dreams</Link>
    </main>
  );
}
