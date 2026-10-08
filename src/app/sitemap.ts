import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let data: { slug: string; created_at: string }[] | null = null;
  try {
    const supabase = await createClient();
    ({ data } = await supabase
      .from("public_dreams")
      .select("slug, created_at")
      .order("created_at", { ascending: false })
      .limit(5000));
  } catch {
    // Supabase isn't configured yet; fall back to the static pages only.
  }

  return [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/feed`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE.url}/explore`, changeFrequency: "daily", priority: 0.7 },
    ...(data ?? []).map((d) => ({
      url: `${SITE.url}/dreams/${d.slug}`,
      lastModified: d.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
