/**
 * Single source of truth for the site's production URL, used anywhere metadata
 * needs a fully-qualified link (metadataBase, sitemap.ts, robots.ts). Reads
 * NEXT_PUBLIC_SITE_URL so that connecting the real domain later (once Vercel
 * deployment/custom domain is set up) is an env var change in the Vercel
 * dashboard, not a code edit — same "update later, zero code changes" pattern
 * as the opengraph-image file convention (see layout.tsx).
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
