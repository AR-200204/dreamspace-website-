import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Onboarding } from "@/components/Onboarding";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

export default async function WelcomePage() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile(supabase);
  if (!profile) redirect("/login?next=/welcome");

  return (
    <main>
      <Onboarding
        username={profile.username}
        initialGoals={profile.goals ?? []}
        initialVisibility={(profile.default_visibility as "anonymous" | "public" | "private") ?? "anonymous"}
      />
    </main>
  );
}
