import type { SupabaseClient } from "@supabase/supabase-js";

// Today's "Dream of the Day" question. Rotates daily through the prompts table.
export async function getTodayPrompt(supabase: SupabaseClient) {
  const { data } = await supabase.from("daily_prompts").select("id, question").order("id");
  if (!data || data.length === 0) return null;
  const dayNumber = Math.floor(Date.now() / 86_400_000);
  return data[dayNumber % data.length] as { id: number; question: string };
}

export async function getCurrentProfile(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { user, profile };
}

// Which of these dreams has the signed-in user saved?
export async function getSavedSet(supabase: SupabaseClient, userId: string | null | undefined, dreamIds: string[]) {
  if (!userId || dreamIds.length === 0) return new Set<string>();
  const { data } = await supabase.from("bookmarks").select("dream_id").in("dream_id", dreamIds);
  return new Set((data ?? []).map((r) => r.dream_id as string));
}

// Which of these people does the signed-in user follow?
export async function getFollowingSet(supabase: SupabaseClient, userId: string | null | undefined, personIds: string[]) {
  if (!userId || personIds.length === 0) return new Set<string>();
  const { data } = await supabase.from("follows").select("followee_id").eq("follower_id", userId).in("followee_id", personIds);
  return new Set((data ?? []).map((r) => r.followee_id as string));
}
