"use client";

/**
 * Decorative loading-state placeholder for <Image> elements that fade in via
 * useFadeInOnLoad (src/lib/useFadeInOnLoad.ts) — shown while `loaded` is
 * false, crossfading out (duration-500, matching that hook's own fade-in
 * timing exactly) once the image has painted. Same separation
 * VideoLoadingSpinner already establishes for <video> (see its own doc
 * comment): this overlay never touches the <Image>'s own opacity, it's a
 * sibling that fades independently.
 *
 * A static fill, not a pulsing one — explicitly asked for over an
 * animate-pulse version tried first. Don't reintroduce a pulse/shimmer
 * without the same explicit re-ask.
 *
 * bg-border/fill-border (not muted) — --border is already this design
 * system's "subtle, low-contrast fill" token (dividers, image container
 * outlines), exactly the right amount of contrast against --background for
 * a skeleton block, with no arbitrary opacity modifier needed.
 *
 * `forceDark` hardcodes that same fill to #27272a (the --border token's own
 * dark-mode/[data-force-dark] value) instead of the bg-border/fill-border
 * utility — required for GalleryLightbox's usage specifically, since that
 * component is portaled straight to document.body, landing outside
 * /gallery's own data-force-dark div in the real DOM tree. CSS custom
 * properties only cascade through actual DOM ancestry, not the React tree a
 * portal preserves, so bg-border there would resolve against the visitor's
 * own system light/dark preference instead of the page's forced-dark theme —
 * confirmed directly (rendered as light-mode --border's cream `#e5e1d9`).
 * GalleryCarousel.tsx's own lightbox caption and CursorLabel's isInverted
 * branch already hit this identical problem and hardcode colors the same
 * way.
 *
 * `width`/`height` (the image's own intrinsic pixel dimensions — the same
 * values passed to next/image elsewhere) switch this into "contain" mode,
 * rendering an SVG sized via `object-fit: contain` instead of a plain
 * inset-0 div. This is for GalleryLightbox specifically, where the real
 * <Image> is `fill` + `object-contain` inside a box that's usually a
 * different aspect ratio than the image itself (letterboxed) — a plain
 * inset-0 skeleton there covers the *whole* box, not just the image's own
 * letterboxed footprint. Generic CSS (a div sized via `aspect-ratio` +
 * `max-width`/`max-height`) can't correctly replicate object-fit:contain
 * for a non-replaced element: with explicit width+height set alongside
 * aspect-ratio, the two max-* constraints clamp each axis independently
 * instead of proportionally (confirmed directly — produced a visibly
 * squished, full-viewport-width skeleton, not letterboxed); leaving
 * width/height as auto avoids that but only correctly derives *one* axis
 * from the other depending on which axis happens to bind, breaking for the
 * opposite orientation at different viewport/image-ratio combinations.
 * `object-fit` genuinely solves "fit both constraints, preserve ratio, pick
 * whichever axis binds" — SVG is a replaced element these rules actually
 * apply to (unlike a div), so a `<svg viewBox="0 0 width height">` sized to
 * 100%/100% of its parent with `object-fit: contain` paints its content into
 * the exact same box a real `<Image fill className="object-contain">` would
 * — verified directly against both a portrait (height-bound) and landscape
 * (width-bound) case. CarouselTile doesn't need this: its Image already
 * uses `object-cover` inside a container sized *by* the image itself
 * (next/image's own w-full h-auto layout), so container and image already
 * share one aspect ratio there — no letterboxing to replicate.
 */
export function ImageSkeleton({
  loaded,
  forceDark = false,
  width,
  height,
}: {
  loaded: boolean;
  forceDark?: boolean;
  width?: number;
  height?: number;
}) {
  const fillClassName = forceDark ? "fill-[#27272a]" : "fill-border";
  const bgClassName = forceDark ? "bg-[#27272a]" : "bg-border";
  const sharedClassName = `pointer-events-none absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${
    loaded ? "opacity-0" : "opacity-100"
  }`;

  if (width != null && height != null) {
    return (
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className={`${sharedClassName} h-full w-full [object-fit:contain]`}
      >
        <rect width={width} height={height} className={fillClassName} />
      </svg>
    );
  }

  return <div aria-hidden="true" className={`${sharedClassName} ${bgClassName}`} />;
}
