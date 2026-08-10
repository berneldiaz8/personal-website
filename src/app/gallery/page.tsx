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
 * GalleryMarquee is fixed at 19vh, centered in <main> — tuned so ~6 tiles
 * (at this data set's mixed landscape/portrait aspect ratios, see the sizes
 * comment in GalleryMarquee.tsx) are visible on screen at once at the same
 * 1440x900 viewport GalleryMarquee.tsx's PX_PER_SECOND is calibrated
 * against, rather than the ~2-3 that a taller strip showed. A fixed vh
 * (not a percentage of <main>'s flex-1 height) keeps the tile count tied to
 * viewport width/height directly instead of also drifting with Nav/
 * GalleryInfoRow's own height.
 */
export default function GalleryPage() {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground" data-force-dark>
      <Nav />
      <main className="flex min-h-0 flex-1 items-center">
        <h1 className="sr-only">Gallery</h1>
        <div className="h-[19vh] w-full">
          <GalleryMarquee items={galleryMarqueeItems} />
        </div>
      </main>
      <GalleryInfoRow />
    </div>
  );
}
