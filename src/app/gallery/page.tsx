import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { GalleryInfoRow } from "@/components/GalleryInfoRow";
import { GalleryMarquee } from "@/components/GalleryMarquee";
import { galleryMarqueeItems } from "@/data/galleryMarquee";

export const metadata: Metadata = {
  title: "Bernel Diaz — Gallery",
  description: "Gallery by Bernel Diaz.",
};

/**
 * Deliberately outside the (site) route group — that group's layout wraps
 * every page in the full sticky-reveal Footer (see Footer.tsx), which needs
 * extra scrollable document height below it to peel back from. This page
 * wants the opposite: exactly one viewport, no scroll at all, so it renders
 * its own Nav + GalleryInfoRow directly instead of picking up the shared
 * layout.
 *
 * data-force-dark (globals.css) makes this page always render with the
 * dark-mode token values, independent of the visitor's system light/dark
 * preference — every other route stays theme-responsive as normal. Nav and
 * GalleryInfoRow both read the same --background/--foreground/--muted/
 * --border tokens via Tailwind's bg-background/text-foreground/etc.
 * utilities, so they pick this up automatically with no component changes.
 * bg-background/text-foreground are also set explicitly on this root div
 * (not left to inherit from <body>, which sits outside this scope and would
 * otherwise still resolve to the light tokens under a light system
 * preference) so the full viewport paints dark, not just the content inside.
 *
 * GalleryMarquee gets a fixed 45% of <main>'s height, centered — leaves
 * generous breathing room top/bottom (matching the reference composition)
 * regardless of viewport height, since it's a percentage of the flex-1 area
 * rather than a fixed px/vh value.
 */
export default function GalleryPage() {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground" data-force-dark>
      <Nav />
      {/* min-h-0 overrides flex's default min-height: auto, which would
          otherwise let the marquee grow past its flex-1 share and overflow
          the h-dvh budget. */}
      <main className="flex min-h-0 flex-1 items-center">
        <h1 className="sr-only">Gallery</h1>
        <div className="h-[45%] w-full">
          <GalleryMarquee items={galleryMarqueeItems} />
        </div>
      </main>
      <GalleryInfoRow />
    </div>
  );
}
