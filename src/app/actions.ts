"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils";

const enc = encodeURIComponent;
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

async function origin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${h.get("host")}`;
}

/* ------------------------------ Auth ------------------------------ */

export async function signup(formData: FormData) {
  const email = str(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const username = str(formData.get("username"));

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    redirect(`/signup?error=${enc("Username must be 3–20 letters, numbers or underscores.")}`);
  if (password.length < 8) redirect(`/signup?error=${enc("Password must be at least 8 characters.")}`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username }, emailRedirectTo: `${await origin()}/auth/callback` },
  });
  if (error) redirect(`/signup?error=${enc(error.message)}`);
  if (!data.session) redirect(`/login?message=${enc("Check your email to confirm your account, then log in.")}`);
  redirect("/feed");
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(formData.get("email")),
    password: String(formData.get("password") ?? ""),
  });
  const next = safeNext(formData.get("next"));
  if (error) redirect(`/login?error=${enc(error.message)}&next=${enc(next)}`);
  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(str(formData.get("email")), {
    redirectTo: `${await origin()}/auth/callback?next=/reset-password`,
  });
  if (error) redirect(`/forgot-password?error=${enc(error.message)}`);
  redirect(`/forgot-password?message=${enc("If that email has an account, a reset link is on its way.")}`);
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect(`/reset-password?error=${enc("Password must be at least 8 characters.")}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/reset-password?error=${enc(error.message)}`);
  redirect("/feed");
}

/* ------------------------------ Dreams ------------------------------ */

export async function createDream(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dreams/new");

  const visibility = ["public", "anonymous", "private"].includes(str(formData.get("visibility")))
    ? str(formData.get("visibility"))
    : "anonymous";
  const tags = str(formData.get("tags"))
    .split(/[,\s#]+/)
    .filter(Boolean);

  const { data, error } = await supabase.rpc("create_dream", {
    p_title: str(formData.get("title")),
    p_body: str(formData.get("body")),
    p_mood: str(formData.get("mood")),
    p_dream_date: str(formData.get("dream_date")) || null,
    p_visibility: visibility,
    p_tags: tags,
  });

  if (error) {
    const friendly = error.message.includes("check constraint")
      ? "Title needs at least 3 characters and the dream at least 10."
      : error.message;
    redirect(`/dreams/new?error=${enc(friendly)}`);
  }
  revalidatePath("/feed");
  redirect(`/dreams/${data}`);
}

export async function deleteDream(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("dreams").delete().eq("id", str(formData.get("id")));
  revalidatePath("/feed");
  redirect("/feed");
}

/* ------------------------------ Comments ------------------------------ */

export async function addComment(formData: FormData) {
  const slug = str(formData.get("slug"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${enc(`/dreams/${slug}`)}`);

  const body = str(formData.get("body"));
  if (body) {
    await supabase.from("comments").insert({
      dream_id: str(formData.get("dream_id")),
      user_id: user.id,
      parent_id: str(formData.get("parent_id")) || null,
      body,
      is_interpretation: formData.get("kind") === "interpretation",
    });
  }
  revalidatePath(`/dreams/${slug}`);
  redirect(`/dreams/${slug}#comments`);
}

export async function deleteComment(formData: FormData) {
  const slug = str(formData.get("slug"));
  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", str(formData.get("id")));
  revalidatePath(`/dreams/${slug}`);
  redirect(`/dreams/${slug}#comments`);
}

/* ------------------------------ Reactions ------------------------------ */

export async function react(formData: FormData) {
  const slug = str(formData.get("slug"));
  const dreamId = str(formData.get("dream_id"));
  const type = str(formData.get("type"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${enc(`/dreams/${slug}`)}`);

  const { data: existing } = await supabase
    .from("reactions")
    .select("type")
    .eq("dream_id", dreamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.type === type) {
    await supabase.from("reactions").delete().eq("dream_id", dreamId).eq("user_id", user.id);
  } else {
    await supabase.from("reactions").upsert({ dream_id: dreamId, user_id: user.id, type });
  }
  revalidatePath(`/dreams/${slug}`);
  revalidatePath("/feed");
}

/* ------------------------------ Reports ------------------------------ */

export async function report(formData: FormData) {
  const slug = str(formData.get("slug"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${enc(`/dreams/${slug}`)}`);

  await supabase.from("reports").insert({
    reporter_id: user.id,
    dream_id: str(formData.get("dream_id")) || null,
    comment_id: str(formData.get("comment_id")) || null,
    reason: str(formData.get("reason")) || "other",
    details: str(formData.get("details")).slice(0, 1000) || null,
  });
  redirect(`/dreams/${slug}?reported=1`);
}

/* ------------------------------ Settings ------------------------------ */

export async function updateBio(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");
  const { error } = await supabase
    .from("profiles")
    .update({ bio: str(formData.get("bio")).slice(0, 200) || null })
    .eq("id", user.id);
  if (error) redirect(`/settings?error=${enc(error.message)}`);
  redirect(`/settings?message=${enc("Profile saved.")}`);
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  if (str(formData.get("confirm")) !== profile?.username)
    redirect(`/settings?error=${enc("Type your username exactly to confirm.")}`);

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey)
    redirect(`/settings?error=${enc("Account deletion isn't configured yet (missing SUPABASE_SERVICE_ROLE_KEY).")}`);

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) redirect(`/settings?error=${enc(error.message)}`);

  await supabase.auth.signOut();
  redirect("/");
}
