"use client";

import Image from "next/image";
import type { ImageItem } from "@/data/projects";
import { useFadeInOnLoad } from "@/lib/useFadeInOnLoad";

/**
 * Extracted so useFadeInOnLoad (a hook) can be called once per image
 * instance rather than inside the parent's .map() callback, which the Rules
 * of Hooks disallow.
 */
function GridImage({ image }: { image: ImageItem }) {
  const { loaded, onLoad } = useFadeInOnLoad();
  return (
    <div
      // self-start: this grid has no items-* override, so it defaults to
      // stretch. Safari resolves a stretched aspect-ratio grid item by
      // computing height from the row first and deriving width backward
      // from that — producing a squashed/narrow box — where Chrome
      // correctly sizes width from the grid track first. See
      // WorkTeaser.tsx's data-cursor-video-zone box for the same bug,
      // confirmed against real Safari. Keep this even though ImageGrid
      // isn't currently used anywhere (its only caller, the retired
      // CaseStudyDetail.tsx, was deleted) — it's a one-line guard against
      // reintroducing the same bug the moment this component gets wired
      // up again.
      className="relative aspect-square self-start overflow-hidden bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 640px) 33vw, 50vw"
        className={`object-cover transition-opacity duration-500 motion-reduce:transition-none ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={onLoad}
      />
    </div>
  );
}

export function ImageGrid({ images }: { images: ImageItem[] }) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((image) => (
        <GridImage key={image.src} image={image} />
      ))}
    </div>
  );
}
