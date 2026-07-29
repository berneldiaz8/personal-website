import type { Metadata } from "next";
import localFont from "next/font/local";
import { SmoothScroll } from "@/components/SmoothScroll";
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

export const metadata: Metadata = {
  title: "Bernel Diaz — Designer",
  description:
    "Portfolio of product design work spanning early-stage startups to platforms serving over a million people.",
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
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
