import Link from "next/link";
import type { Metadata } from "next";
import { login } from "@/app/actions";
import { AuthCard } from "@/components/AuthCard";
import { Turnstile } from "@/components/Turnstile";
import { GoogleButton } from "@/components/GoogleButton";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to share dreams and join the conversation."
      error={error}
      message={message}
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-moon underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={next ?? "/feed"} />
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
        </div>
        <Turnstile />
        <button className="btn-primary w-full">Log in</button>
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-mist hover:text-moon">
            Forgot your password?
          </Link>
        </p>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-mist/70">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleButton />
    </AuthCard>
  );
}
