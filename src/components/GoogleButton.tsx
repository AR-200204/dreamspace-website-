"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleButton() {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
  return (
    <button type="button" onClick={signIn} className="btn-ghost w-full">
      Continue with Google
    </button>
  );
}
