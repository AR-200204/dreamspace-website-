export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function excerpt(text: string, max = 180) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max).trimEnd() + "…" : clean;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

// "Anonymous Dreamer #4821". Derived from the dream's own id, NOT the author,
// so two anonymous dreams by the same person can't be linked together.
export function anonymousName(dreamId: string) {
  const n = parseInt(dreamId.replace(/-/g, "").slice(0, 6), 16) % 9000;
  return `Anonymous Dreamer #${n + 1000}`;
}

// Only allow redirects to paths inside our own site.
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = "/feed") {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

// Remove characters that would break a PostgREST `or()` filter.
export function cleanSearch(q: string) {
  return q.replace(/[,()%*\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

// Only accept image URLs that point at OUR Supabase Storage bucket.
export function storageUrl(value: FormDataEntryValue | null, bucket: "dream-images" | "avatars") {
  const v = typeof value === "string" ? value.trim() : "";
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v || !base) return "";
  return v.startsWith(`${base}/storage/v1/object/public/${bucket}/`) ? v : "";
}
