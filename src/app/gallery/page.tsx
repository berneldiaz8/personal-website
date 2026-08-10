import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { GalleryInfoRow } from "@/components/GalleryInfoRow";
import { GalleryMarquee } from "@/components/GalleryMarquee";
import { galleryMarqueeItems } from "@/data/galleryMarquee";

export const metadata: Metadata = {
  title: "Bernel Diaz — Gallery",
  description:
    "A closer look at real product screens from Bernel Diaz's case studies: Lexora, FoodOps, The Dividend Tracker, and Opinly.",
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
 * GalleryMarquee's wrapper has no explicit height (just w-full) — tiles are
 * now sized by a responsive width (TILE_WIDTH_CSS in GalleryMarquee.tsx,
 * calibrated so ~7 fit across the 1440x900 reference viewport PX_PER_SECOND
 * is also calibrated against, then scaling up above that breakpoint so the
 * same 7-tile fit holds on wider viewports too), with height following per
 * image's own aspect ratio,
 * so the marquee's own height is however tall its tallest tile ends up
 * being — there's no longer a single fixed row height to assign here.
 * <main>'s items-center still vertically centers whatever that natural
 * height comes out to within the flex-1 area.
 */
export default function GalleryPage() {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground" data-force-dark>
      <Nav />
      <main className="flex min-h-0 flex-1 items-center">
        <h1 className="sr-only">Gallery</h1>
        <div className="w-full">
          <GalleryMarquee items={galleryMarqueeItems} />
        </div>
      </main>
      <GalleryInfoRow />
    </div>
  );
}
