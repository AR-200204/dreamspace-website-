import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { deleteAccount, unblockUser, updateAvatar, updateBio, updateUsername } from "@/app/actions";
import { ImageUpload } from "@/components/ImageUpload";
import { InstallButton } from "@/components/InstallButton";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const supabase = await createClient();
  const { profile } = await getCurrentProfile(supabase);
  if (!profile) redirect("/login?next=/settings");

  const { data: blockRows } = await supabase.from("blocks").select("blocked_id");
  const blockedIds = (blockRows ?? []).map((b) => b.blocked_id as string);
  const { data: blocked } = blockedIds.length
    ? await supabase.from("profiles").select("id, username").in("id", blockedIds)
    : { data: [] };

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <h1 className="font-display text-3xl">Settings</h1>
      {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-violet/30 bg-violet/10 px-4 py-3 text-sm">{message}</p>}

      <section className="card space-y-4 p-6">
        <h2 className="font-display text-xl">Install the app</h2>
        <p className="text-mist">Add DreamSpace to your home screen so you can write a dream the moment you wake up.</p>
        <InstallButton />
      </section>

      <form action={updateAvatar} className="card space-y-4 p-6">
        <h2 className="font-display text-xl">Profile photo</h2>
        <ImageUpload bucket="avatars" name="avatar_url" initialUrl={profile.avatar_url} maxSide={400} label="Photo" round />
        <button className="btn-primary">Save photo</button>
      </form>

      <form action={updateUsername} className="card space-y-4 p-6">
        <h2 className="font-display text-xl">Username</h2>
        <div>
          <label className="label" htmlFor="username">Your username</label>
          <input id="username" name="username" defaultValue={profile.username} required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" autoComplete="off" className="input" />
          <p className="mt-1.5 text-xs text-mist/80">Letters, numbers and underscores. You can change it once every 30 days, and your profile link will change with it.</p>
        </div>
        <button className="btn-primary">Save username</button>
      </form>

      <form action={updateBio} className="card space-y-4 p-6">
        <h2 className="font-display text-xl">Bio</h2>
        <div>
          <label className="label" htmlFor="bio">Short bio</label>
          <textarea id="bio" name="bio" rows={3} maxLength={200} defaultValue={profile.bio ?? ""} className="input" placeholder="Lucid dreamer, night owl…" />
        </div>
        <button className="btn-primary">Save bio</button>
      </form>

      <section className="card space-y-4 p-6">
        <h2 className="font-display text-xl">Blocked users</h2>
        {(blocked ?? []).length === 0 ? (
          <p className="text-mist">You haven&apos;t blocked anyone.</p>
        ) : (
          <ul className="divide-y divide-line">
            {(blocked ?? []).map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2.5">
                <span>@{b.username}</span>
                <form action={unblockUser}>
                  <input type="hidden" name="blocked_id" value={b.id} />
                  <input type="hidden" name="back" value="/settings" />
                  <button className="btn-ghost !py-1.5">Unblock</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

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
