import { AppNav } from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile(supabase);

  let unread = 0;
  let isAdmin = false;
  if (profile) {
    const [u, a] = await Promise.all([supabase.rpc("unread_notification_count"), supabase.rpc("is_admin")]);
    unread = typeof u.data === "number" ? u.data : 0;
    isAdmin = a.data === true;
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl md:flex">
      <AppNav username={profile?.username ?? null} unread={unread} isAdmin={isAdmin} />
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-12 md:pt-10">{children}</main>
    </div>
  );
}
