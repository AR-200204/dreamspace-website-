import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/settings", "/dreams/new", "/admin", "/notifications", "/saved", "/insights"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
