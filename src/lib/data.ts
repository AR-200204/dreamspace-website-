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
