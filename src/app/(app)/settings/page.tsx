import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { deleteAccount, updateBio } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const supabase = await createClient();
  const { profile } = await getCurrentProfile(supabase);
  if (!profile) redirect("/login?next=/settings");

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <h1 className="font-display text-3xl">Settings</h1>
      {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-violet/30 bg-violet/10 px-4 py-3 text-sm">{message}</p>}

      <form action={updateBio} className="card space-y-4 p-6">
        <h2 className="font-display text-xl">Profile</h2>
        <div>
          <label className="label" htmlFor="bio">Short bio</label>
          <textarea id="bio" name="bio" rows={3} maxLength={200} defaultValue={profile.bio ?? ""} className="input" placeholder="Lucid dreamer, night owl…" />
        </div>
        <button className="btn-primary">Save profile</button>
      </form>

      <section className="card space-y-4 p-6">
        <h2 className="font-display text-xl">Delete account</h2>
        <p className="text-mist">
          This permanently deletes your account, dreams, comments and reactions. It can&apos;t be undone.
        </p>
        <form action={deleteAccount} className="space-y-3">
          <label className="label" htmlFor="confirm">Type your username (<span className="text-moon">{profile.username}</span>) to confirm</label>
          <input id="confirm" name="confirm" autoComplete="off" className="input" />
          <button className="btn-danger">Delete my account</button>
        </form>
      </section>
    </div>
  );
}
