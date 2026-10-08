import Link from "next/link";
import type { Metadata } from "next";
import { forgotPassword } from "@/app/actions";
import { AuthCard } from "@/components/AuthCard";

export const metadata: Metadata = { title: "Reset your password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to choose a new one."
      error={error}
      message={message}
      footer={
        <Link href="/login" className="text-moon underline underline-offset-4">
          Back to log in
        </Link>
      }
    >
      <form action={forgotPassword} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <button className="btn-primary w-full">Send reset link</button>
      </form>
    </AuthCard>
  );
}
