import Link from "next/link";
import type { Metadata } from "next";
import { signup } from "@/app/actions";
import { AuthCard } from "@/components/AuthCard";
import { Turnstile } from "@/components/Turnstile";
import { GoogleButton } from "@/components/GoogleButton";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthCard
      title="Start your dream journal"
      subtitle="Free, and you choose what's public. Dreams can always be posted anonymously."
      error={error}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-moon underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      <form action={signup} className="space-y-4">
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" name="username" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" autoComplete="username" className="input" />
          <p className="mt-1.5 text-xs text-mist/80">Letters, numbers and underscores. Not shown on anonymous dreams.</p>
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
          <p className="mt-1.5 text-xs text-mist/80">At least 8 characters.</p>
        </div>
        <Turnstile />
        <button className="btn-primary w-full">Create account</button>
        <p className="text-center text-xs leading-relaxed text-mist/80">
          By creating an account you agree to the <Link href="/terms" className="underline underline-offset-2 hover:text-moon">Terms</Link> and
          <Link href="/privacy" className="ml-1 underline underline-offset-2 hover:text-moon">Privacy Policy</Link>.
        </p>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-mist/70">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleButton />
    </AuthCard>
  );
}
