import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — share and explore dreams`,
    short_name: SITE.name,
    description: SITE.description,
    // Opening the app takes you straight to writing a dream.
    start_url: "/dreams/new",
    scope: "/",
    display: "standalone",
    background_color: "#070815",
    theme_color: "#070815",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Share a dream", short_name: "Write", url: "/dreams/new" },
      { name: "Dreams feed", short_name: "Feed", url: "/feed" },
      { name: "Trending", short_name: "Trending", url: "/trending" },
    ],
  };
}
