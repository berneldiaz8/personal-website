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
 * bg-border (not bg-muted) — --border is already this design system's
 * "subtle, low-contrast fill" token (dividers, image container outlines),
 * exactly the right amount of contrast against --background for a skeleton
 * block, with no arbitrary opacity modifier needed.
 *
 * `forceDark` hardcodes that same fill to #27272a (the --border token's own
 * dark-mode/[data-force-dark] value) instead of the bg-border utility —
 * required for GalleryLightbox's usage specifically, since that component is
 * portaled straight to document.body, landing outside /gallery's own
 * data-force-dark div in the real DOM tree. CSS custom properties only
 * cascade through actual DOM ancestry, not the React tree a portal
 * preserves, so bg-border there would resolve against the visitor's own
 * system light/dark preference instead of the page's forced-dark theme —
 * confirmed directly (rendered as light-mode --border's cream `#e5e1d9`).
 * GalleryCarousel.tsx's own lightbox caption and CursorLabel's isInverted
 * branch already hit this identical problem and hardcode colors the same
 * way. CarouselTile's own skeleton doesn't need this — its Image renders in
 * the normal tree, still inside data-force-dark, where bg-border already
 * resolves correctly.
 */
export function ImageSkeleton({ loaded, forceDark = false }: { loaded: boolean; forceDark?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${
        forceDark ? "bg-[#27272a]" : "bg-border"
      } ${loaded ? "opacity-0" : "opacity-100"}`}
    />
  );
}
