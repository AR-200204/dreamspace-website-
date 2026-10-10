import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { SITE } from "@/lib/config";

// Builds the picture shown when a dream link is shared (and a tall "story" version for Instagram).
export async function renderDreamImage(slug: string, format: "og" | "story") {
  let title = SITE.name;
  let body = SITE.description;
  let tags: string[] = [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const supabase = createClient(url, key);
    const { data } = await supabase.from("public_dreams").select("title, body, tags").eq("slug", slug).maybeSingle();
    if (data) {
      title = data.title;
      body = data.body.replace(/\s+/g, " ").trim();
      tags = data.tags ?? [];
    }
  }

  const story = format === "story";
  const width = story ? 1080 : 1200;
  const height = story ? 1920 : 630;
  const excerpt = body.length > (story ? 260 : 150) ? body.slice(0, story ? 260 : 150).trimEnd() + "…" : body;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: story ? 90 : 64,
          color: "#efe6cf",
          background: "radial-gradient(ellipse at 50% 0%, #2a1f78 0%, #0b0c24 55%, #070815 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: story ? 90 : 56,
              height: story ? 90 : 56,
              borderRadius: 999,
              background: "radial-gradient(circle at 35% 30%, #fffbea, #ebe0bd 55%, #b8ac86)",
              boxShadow: "0 0 60px rgba(239,230,207,0.5)",
            }}
          />
          <div style={{ marginLeft: 22, fontSize: story ? 48 : 34, display: "flex" }}>{SITE.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: story ? 92 : 64, lineHeight: 1.1, display: "flex" }}>{title.length > 80 ? title.slice(0, 80) + "…" : title}</div>
          <div style={{ marginTop: 28, fontSize: story ? 44 : 30, lineHeight: 1.45, color: "#a3a6cc", display: "flex" }}>“{excerpt}”</div>
          {tags.length > 0 && (
            <div style={{ marginTop: 34, display: "flex", fontSize: story ? 38 : 26, color: "#8f82f7" }}>
              {tags.slice(0, 4).map((t) => `#${t}`).join("  ")}
            </div>
          )}
        </div>

        <div style={{ display: "flex", fontSize: story ? 34 : 24, color: "#a3a6cc" }}>
          {SITE.url.replace(/^https?:\/\//, "")}/dreams/{slug.length > 28 ? slug.slice(0, 28) + "…" : slug}
        </div>
      </div>
    ),
    { width, height }
  );
}
