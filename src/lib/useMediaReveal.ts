"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { REVEAL_EASE } from "@/lib/gsapEase";
import { pageReady, pageVisible } from "@/lib/pageReady";

gsap.registerPlugin(ScrollTrigger);

// Original values were 1.06/0.6/0.9 — SCALE_FROM is back to that original
// (explicit request, 2026-09-28, after a detour through 1.1 then 1.04) —
// only SCALE_DURATION actually changed from the original, 0.9 -> 1.15. The
// original reading as abrupt and lacking presence turned out to be a
// duration problem, not a scale-distance one: REVEAL_EASE is a steep
// ease-out (near-full velocity from t=0, long decelerating tail), and that
// tail only becomes perceptible with real duration behind it, the same
// lesson already learned tuning RevealText.tsx/ShowcaseHeadline.tsx's own
// reveals. OVERLAY_DURATION was never actually part of this — left at its
// original 0.6 throughout. Applies to every useMediaReveal call site (every
// image/video slot on /work, not just the full-bleed Hero), not just one —
// scrolling past several slots in a row with the longer SCALE_DURATION
// hasn't been checked against feeling sluggish, worth watching for if that
// ever comes up.
const SCALE_FROM = 1.06;
const OVERLAY_DURATION = 0.6;
const SCALE_DURATION = 1.15;

/**
 * Scroll-triggered "premium" entrance for ShowcaseImage/ShowcaseVideo
 * (ProjectShowcase.tsx) and WorkTeaser's TeaserVideo: a dark curtain
 * dissolves while the media scales down from SCALE_FROM to its natural
 * size, once, the first time `wrapperRef` crosses ScrollTrigger's "top 85%"
 * line — same trigger point/one-shot toggleActions/REVEAL_EASE as
 * RevealText's own scroll reveal, so this reads as the same motion language
 * rather than a second, differently-timed one. For an above-the-fold
 * instance that line is already crossed the moment the ScrollTrigger is
 * created, so it plays immediately once `pageReady` resolves rather than
 * waiting for a real scroll — same behavior RevealText's own above-the-fold
 * instances (Hero.tsx's h1) rely on. Replaces the plain load-gated opacity
 * fade ShowcaseImage/ShowcaseVideo used to drive off `useFadeInOnLoad`/
 * `useVideoReady` — that network-loading state still exists (ImageSkeleton/
 * VideoLoadingSpinner), it just no longer also doubles as the entrance
 * animation.
 *
 * `enabled` (default true) — false skips the whole thing (no scale, no
 * overlay, no ScrollTrigger ever created). No current call site passes
 * false — the project Hero was the one exception for a while (explicit
 * request, 2026-09-27, reverting an earlier pass that tried keeping the
 * scale-in there without the dark curtain), but that was itself reverted
 * back to the full treatment per a later explicit request (2026-09-28) — see
 * ProjectShowcase.tsx's own HERO block comment for that history. Kept as a
 * real, supported escape hatch given how much this specific slot has gone
 * back and forth. When false, `overlayRef` is still returned but nothing
 * ever touches it, so the caller should skip rendering that div entirely
 * rather than mount a dead, permanently-invisible one.
 *
 * `withOverlay` (default true) — false keeps the scale-in but drops the dark
 * curtain: the media is visible from the start and only scales down from
 * SCALE_FROM, starting as soon as the page overlay begins fading
 * (`pageVisible`) rather than once it's gone. Used by the project Hero
 * (explicit request, 2026-09-30). Same
 * rule as `enabled`: when false, the caller should skip rendering the
 * overlay div.
 *
 * `mediaRef` is a *plain wrapper div* around the real `<Image>`/`<video>`,
 * not the media element itself — ShowcaseVideo's letterboxed (fillHeight/
 * fillWidth) variant already centers the `<video>` via its own translate
 * transform classes, and GSAP fully owns whatever transform property it
 * first touches on an element. Scaling a neutral wrapper instead sidesteps
 * any conflict with that existing transform entirely, regardless of how
 * Tailwind happens to compose its own translate/scale utilities under the
 * hood.
 *
 * Full reduced-motion bypass, RevealText-style: the overlay's own JSX class
 * defaults to `opacity-0` (curtain gone, media at rest) — the matchMedia
 * branch below is the only place either ref's *hidden* state gets set, so
 * under reduced motion the curtain/scale never apply in the first place,
 * nothing to reveal, media just renders in its final state immediately.
 */
export function useMediaReveal<T extends HTMLElement>(enabled: boolean = true, withOverlay: boolean = true) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<T>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!enabled) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const wrapper = wrapperRef.current;
        const media = mediaRef.current;
        const overlay = overlayRef.current;
        if (!wrapper || !media || (withOverlay && !overlay)) return;

        gsap.set(media, { scale: SCALE_FROM });
        if (withOverlay) gsap.set(overlay, { opacity: 1 });

        // Curtain-less media is on show the moment the page overlay starts
        // fading, so it starts scaling then (pageVisible) instead of sitting
        // frozen at SCALE_FROM until the fade has fully finished (pageReady).
        (withOverlay ? pageReady : pageVisible).then(() => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: wrapper,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
          if (withOverlay) tl.to(overlay, { opacity: 0, duration: OVERLAY_DURATION, ease: REVEAL_EASE }, 0);
          tl.to(media, { scale: 1, duration: SCALE_DURATION, ease: REVEAL_EASE }, 0);
        });
      });
      return () => mm.revert();
    },
    { scope: wrapperRef, dependencies: [enabled, withOverlay] },
  );

  return { wrapperRef, mediaRef, overlayRef };
}
