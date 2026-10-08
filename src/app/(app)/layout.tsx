import { AppNav } from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile(supabase);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl">
      <AppNav username={profile?.username ?? null} />
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-12 md:pt-10">{children}</main>
    </div>
  );
}
