import type { Metadata } from "next";
import localFont from "next/font/local";
import { SmoothScroll } from "@/components/SmoothScroll";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// General Sans (fontshare.com/fonts/general-sans), self-hosted via next/font/local
// rather than Fontshare's CDN <link>, so it gets the same build-time optimization/
// zero-CLS treatment Geist had. Only the weights actually used in the codebase are
// included (200/300/400/500 — see `grep -rohE "font-(thin|extralight|light|...)"`),
// not the full 6-weight family Fontshare offers. Semibold/600 was dropped 2026-07-19
// once every `font-semibold` call site was switched to `font-medium`, leaving it
// unused — re-add the file (from `src/app/fonts/`'s original download, or re-fetch
// from Fontshare's API) if a heavier weight is needed again later. Light/300 was
// added 2026-07-21 for the Figma-sourced /info page redesign (job title/role text,
// `textStyles.heading2xlLight`) — fetched via Fontshare's own CSS API
// (`api.fontshare.com/v2/css?f[]=general-sans@300`), same source as every other
// weight here, just not through the fontshare.com/fonts UI.
const generalSans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Extralight.woff2", weight: "200", style: "normal" },
    { path: "./fonts/GeneralSans-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
});

const description =
  "Portfolio of product design work spanning early-stage startups to platforms serving over a million people.";

export const metadata: Metadata = {
  // Lets every relative URL below (openGraph.url, and the not-yet-added
  // opengraph-image file once one exists) resolve to a full https:// link
  // instead of erroring at build time. Reads NEXT_PUBLIC_SITE_URL — see
  // lib/site.ts for why this is an env var, not a hardcoded domain.
  metadataBase: new URL(siteUrl),
  title: "Bernel Diaz — Designer",
  description,
  openGraph: {
    title: "Bernel Diaz — Designer",
    description,
    url: "/",
    siteName: "Bernel Diaz",
    type: "website",
    locale: "en_US",
    // No `images` field here on purpose — once an opengraph-image.jpg/png
    // file is dropped into this directory (or a page's own route folder),
    // Next.js auto-detects it and emits the correct og:image/twitter:image
    // tags with zero code changes here. See the metadata-and-og-images doc.
  },
  twitter: {
    card: "summary_large_image",
    title: "Bernel Diaz — Designer",
    description,
  },
};

// Person structured data (schema.org via JSON-LD) — gives search engines an
// unambiguous identity for the site (name, role, real profile links) instead
// of guessing from prose, which is what can earn a knowledge-panel-style
// rich result for a name search. Values match what's actually printed in
// Footer.tsx/GalleryInfoRow.tsx, not invented ones.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Bernel Diaz",
  url: siteUrl,
  jobTitle: "Designer",
  email: "diaz.bernel@gmail.com",
  sameAs: ["https://linkedin.com/in/berneldiaz", "https://dribbble.com/berneldiaz"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${generalSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
