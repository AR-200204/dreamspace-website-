import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils";

// Supabase sends people here after email confirmation, password reset and Google login.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First time here? Start with the welcome tour (unless they were heading somewhere specific).
      let target = next;
      if (next === "/feed") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("onboarded_at").eq("id", user.id).maybeSingle();
          if (profile && !profile.onboarded_at) target = "/welcome";
        }
      }
      return NextResponse.redirect(`${origin}${target}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That link is invalid or has expired.")}`);
}
