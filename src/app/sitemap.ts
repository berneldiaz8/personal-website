import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Real routes only — no /work/[slug] (case studies render inline on /work,
// see CLAUDE.md's "Work page architecture") and no /contact (removed
// earlier in the project's history).
const routes = ["", "/work", "/info", "/gallery"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
  }));
}
