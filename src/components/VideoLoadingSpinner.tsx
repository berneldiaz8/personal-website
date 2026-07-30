"use client";

/**
 * Decorative loading-state overlay for <video> elements — never touches the
 * video/poster's own opacity (see useVideoReady.ts for why: the poster is a
 * valid LCP candidate, and gating its visibility on JS would delay when the
 * browser counts it as painted). text-muted keeps this neutral/monochrome
 * (explicit user choice, 2026-07-30) rather than tracking the current
 * project's --accent — deliberate, don't swap this back to text-accent
 * without being asked again. motion-reduce:hidden — reduced-motion users get
 * a fully static poster-only fallback instead of the video at all (see the
 * motion-reduce:hidden already on the <video> itself in
 * ShowcaseVideo/WorkTeaser), so there's no in-progress state to show here
 * either.
 */
export function VideoLoadingSpinner({ ready }: { ready: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 flex items-center justify-center text-muted transition-opacity duration-300 motion-reduce:hidden ${
        ready ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
}
