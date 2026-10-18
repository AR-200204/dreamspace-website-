"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext, storageUrl } from "@/lib/utils";
import { AIError, AI_DAILY_LIMIT, aiConfigured, aiSiteDailyLimit, answerDreamQuestion, interpretDream, reflectOnPatterns } from "@/lib/ai";
import { analyzeDreams, summaryForAi, type PatternDream } from "@/lib/patterns";

const enc = encodeURIComponent;
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

// Cloudflare Turnstile token (only present when the CAPTCHA is switched on).
function captcha(formData: FormData) {
  const token = str(formData.get("cf-turnstile-response"));
  return token ? { captchaToken: token } : {};
}

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
    options: { data: { username }, emailRedirectTo: `${await origin()}/auth/callback`, ...captcha(formData) },
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
    options: { ...captcha(formData) },
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
    ...captcha(formData),
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
    p_image_url: storageUrl(formData.get("image_url"), "dream-images") || null,
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
    const { error } = await supabase.from("comments").insert({
      dream_id: str(formData.get("dream_id")),
      user_id: user.id,
      parent_id: str(formData.get("parent_id")) || null,
      body,
      is_interpretation: formData.get("kind") === "interpretation",
    });
    if (error) redirect(`/dreams/${slug}?cerr=${enc(error.message)}#comments`);
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

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    dream_id: str(formData.get("dream_id")) || null,
    comment_id: str(formData.get("comment_id")) || null,
    reason: str(formData.get("reason")) || "other",
    details: str(formData.get("details")).slice(0, 1000) || null,
  });
  if (error) redirect(`/dreams/${slug}?cerr=${enc(error.message)}`);
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

/* ------------------------------ Edit dream ------------------------------ */

export async function updateDream(formData: FormData) {
  const id = str(formData.get("id"));
  const slug = str(formData.get("slug"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${enc(`/dreams/${slug}/edit`)}`);

  const visibility = ["public", "anonymous", "private"].includes(str(formData.get("visibility")))
    ? str(formData.get("visibility"))
    : "anonymous";

  const { data, error } = await supabase.rpc("update_dream", {
    p_id: id,
    p_title: str(formData.get("title")),
    p_body: str(formData.get("body")),
    p_mood: str(formData.get("mood")),
    p_dream_date: str(formData.get("dream_date")) || null,
    p_visibility: visibility,
    p_tags: str(formData.get("tags")).split(/[,\s#]+/).filter(Boolean),
    p_image_url: storageUrl(formData.get("image_url"), "dream-images") || null,
  });
  if (error) {
    const friendly = error.message.includes("check constraint")
      ? "Title needs at least 3 characters and the dream at least 10."
      : error.message;
    redirect(`/dreams/${slug}/edit?error=${enc(friendly)}`);
  }
  revalidatePath("/", "layout");
  redirect(`/dreams/${data}`);
}

/* ------------------------------ Bookmarks ------------------------------ */

export async function toggleBookmark(formData: FormData) {
  const dreamId = str(formData.get("dream_id"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${enc(safeNext(formData.get("back"), "/feed"))}`);

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("dream_id")
    .eq("dream_id", dreamId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) await supabase.from("bookmarks").delete().eq("dream_id", dreamId).eq("user_id", user.id);
  else await supabase.from("bookmarks").insert({ dream_id: dreamId, user_id: user.id });
  revalidatePath("/", "layout");
}

/* ------------------------------ Follow and block ------------------------------ */

export async function toggleFollow(formData: FormData) {
  const followeeId = str(formData.get("followee_id"));
  const username = str(formData.get("username"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${enc(`/u/${username}`)}`);
  if (user.id === followeeId) redirect(`/u/${username}`);

  const { data: existing } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", user.id)
    .eq("followee_id", followeeId)
    .maybeSingle();
  if (existing) await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", followeeId);
  else await supabase.from("follows").insert({ follower_id: user.id, followee_id: followeeId });
  revalidatePath("/", "layout");
}

export async function blockUser(formData: FormData) {
  const blockedId = str(formData.get("blocked_id"));
  const username = str(formData.get("username"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.id !== blockedId) {
    await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: blockedId });
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", blockedId);
  }
  revalidatePath("/", "layout");
  redirect(`/u/${username}`);
}

export async function unblockUser(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", str(formData.get("blocked_id")));
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("back"), "/settings"));
}

/* ------------------------------ Avatar ------------------------------ */

export async function updateAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: storageUrl(formData.get("avatar_url"), "avatars") || null })
    .eq("id", user.id);
  if (error) redirect(`/settings?error=${enc(error.message)}`);
  revalidatePath("/", "layout");
  redirect(`/settings?message=${enc("Photo saved.")}`);
}

/* ------------------------------ AI interpretation ------------------------------ */

// Logs the real reason to your terminal, and returns the short code the page uses for a friendly message.
function aiErrorInfo(e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  console.error("[AI error]", message);
  return { code: e instanceof AIError ? e.code : "error", message };
}

// Only shown when AI_DEBUG=1, so you can see what really went wrong while testing.
function debugSuffix(detail?: string) {
  return process.env.AI_DEBUG === "1" && detail ? `&detail=${enc(detail.slice(0, 300))}` : "";
}

// How many AI requests the whole site has made since midnight (UTC).
async function aiRequestsToday(admin: SupabaseClient) {
  const midnight = new Date();
  midnight.setUTCHours(0, 0, 0, 0);
  const since = midnight.toISOString();
  const [a, b] = await Promise.all([
    admin.from("ai_interpretations").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("ai_pattern_reports").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);
  return (a.count ?? 0) + (b.count ?? 0);
}

async function aiSetup(formData: FormData) {
  const slug = str(formData.get("slug"));
  const back = (code: string, detail?: string) => redirect(`/dreams/${slug}?ai=${code}${debugSuffix(detail)}#meanings`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${enc(`/dreams/${slug}`)}`);
  if (!aiConfigured()) back("unavailable");

  // Only shared dreams are ever sent to the AI provider.
  const { data: dream } = await supabase.from("public_dreams").select("id, title, body, tags, mood").eq("slug", slug).maybeSingle();
  if (!dream) redirect("/feed");

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin
    .from("ai_interpretations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= AI_DAILY_LIMIT) back("limit");
  if ((await aiRequestsToday(admin)) >= aiSiteDailyLimit()) back("busy");

  return { slug, user, dream, admin, back };
}

export async function exploreMeanings(formData: FormData) {
  const { slug, user, dream, admin, back } = await aiSetup(formData);

  const { data: existing } = await admin
    .from("ai_interpretations")
    .select("id")
    .eq("dream_id", dream.id)
    .is("question", null)
    .maybeSingle();
  if (existing) back("ok");

  let answer = "";
  try {
    answer = await interpretDream(dream);
  } catch (e) {
    const info = aiErrorInfo(e);
    back(info.code, info.message);
  }
  if (!answer) back("error");

  await admin.from("ai_interpretations").insert({ dream_id: dream.id, user_id: user.id, question: null, answer });
  revalidatePath(`/dreams/${slug}`);
  back("ok");
}

export async function askAboutDream(formData: FormData) {
  const question = str(formData.get("question")).slice(0, 300);
  if (question.length < 3) redirect(`/dreams/${str(formData.get("slug"))}?ai=short#meanings`);
  const { slug, user, dream, admin, back } = await aiSetup(formData);

  let answer = "";
  try {
    answer = await answerDreamQuestion(dream, question);
  } catch (e) {
    const info = aiErrorInfo(e);
    back(info.code, info.message);
  }
  if (!answer) back("error");

  await admin.from("ai_interpretations").insert({ dream_id: dream.id, user_id: user.id, question, answer });
  revalidatePath(`/dreams/${slug}`);
  back("ok");
}

/* ------------------------------ Admin (each call is re-checked in the database) ------------------------------ */

async function adminRpc(fn: string, args: Record<string, unknown>, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  const back = safeNext(formData.get("back"), "/admin");
  revalidatePath("/", "layout");
  if (error) redirect(`${back}${back.includes("?") ? "&" : "?"}error=${enc(error.message)}`);
  redirect(back);
}

export async function adminSetReportStatus(formData: FormData) {
  await adminRpc("admin_set_report_status", { p_id: str(formData.get("id")), p_status: str(formData.get("status")) }, formData);
}
export async function adminDeleteDream(formData: FormData) {
  await adminRpc("admin_delete_dream", { p_id: str(formData.get("id")) }, formData);
}
export async function adminHideComment(formData: FormData) {
  await adminRpc("admin_set_comment_hidden", { p_id: str(formData.get("id")), p_hidden: formData.get("hidden") !== "false" }, formData);
}
export async function adminBanUser(formData: FormData) {
  await adminRpc("admin_ban_user", { p_id: str(formData.get("id")), p_reason: str(formData.get("reason")) || null }, formData);
}
export async function adminUnbanUser(formData: FormData) {
  await adminRpc("admin_unban_user", { p_id: str(formData.get("id")) }, formData);
}
export async function adminSetTagFeatured(formData: FormData) {
  await adminRpc("admin_set_tag_featured", { p_name: str(formData.get("name")), p_featured: formData.get("featured") === "true" }, formData);
}
export async function adminDeleteTag(formData: FormData) {
  await adminRpc("admin_delete_tag", { p_name: str(formData.get("name")) }, formData);
}

/* ------------------------------ AI pattern report (your whole journal) ------------------------------ */

export async function generatePatternReport(formData: FormData) {
  const back = (code: string, detail?: string) => redirect(`/insights?ai=${code}${debugSuffix(detail)}#report`);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/insights");
  if (!aiConfigured()) back("unavailable");
  // Nothing is sent to the AI provider unless the person ticks the consent box.
  if (formData.get("consent") !== "on") back("consent");
  const includePrivate = formData.get("include_private") === "on";

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin
    .from("ai_pattern_reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= 1) back("limit");
  if ((await aiRequestsToday(admin)) >= aiSiteDailyLimit()) back("busy");

  const { data } = await supabase
    .from("my_dreams")
    .select("id, slug, title, body, mood, dream_date, created_at, tags, visibility")
    .order("dream_date", { ascending: false })
    .limit(60);
  const dreams = ((data ?? []) as Array<PatternDream & { visibility: string }>).filter(
    (d) => includePrivate || d.visibility !== "private"
  );
  if (dreams.length < 3) back("few");

  let answer = "";
  try {
    answer = await reflectOnPatterns(summaryForAi(dreams, analyzeDreams(dreams)));
  } catch (e) {
    const info = aiErrorInfo(e);
    back(info.code, info.message);
  }
  if (!answer) back("error");

  await admin.from("ai_pattern_reports").insert({ user_id: user.id, answer, dream_count: dreams.length });
  revalidatePath("/insights");
  back("ok");
}

export async function updateUsername(formData: FormData) {
  const username = str(formData.get("username"));
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    redirect(`/settings?error=${enc("Username must be 3–20 letters, numbers or underscores.")}`);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
  if (error) {
    const friendly = error.code === "23505" ? "That username is already taken." : error.message;
    redirect(`/settings?error=${enc(friendly)}`);
  }
  revalidatePath("/", "layout");
  redirect(`/settings?message=${enc(`Your username is now @${username}.`)}`);
}
