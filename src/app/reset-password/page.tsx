import type { Metadata } from "next";
import { updatePassword } from "@/app/actions";
import { AuthCard } from "@/components/AuthCard";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthCard title="Choose a new password" error={error}>
      <form action={updatePassword} className="space-y-4">
        <div>
          <label className="label" htmlFor="password">New password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </div>
        <button className="btn-primary w-full">Save password</button>
      </form>
    </AuthCard>
  );
}
