import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export default async function SavedRedirect() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile(supabase);
  if (!profile) redirect("/login?next=/saved");
  redirect(`/u/${profile.username}?tab=saved`);
}
