"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { REVEAL_EASE } from "@/lib/gsapEase";
import { pageReady } from "@/lib/pageReady";

gsap.registerPlugin(ScrollTrigger);

const SCALE_FROM = 1.06;
const OVERLAY_DURATION = 0.6;
const SCALE_DURATION = 0.9;

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
 * overlay, no ScrollTrigger ever created). Set false for the project Hero
 * specifically (explicit request, 2026-09-27, reversing an earlier pass that
 * tried keeping the scale-in there without the dark curtain — the Hero now
 * goes back to rendering fully statically, same as before any of this
 * existed). When false, `overlayRef` is still returned but nothing ever
 * touches it, so the caller should skip rendering that div entirely rather
 * than mount a dead, permanently-invisible one.
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
export function useMediaReveal<T extends HTMLElement>(enabled: boolean = true) {
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
        if (!wrapper || !media || !overlay) return;

        gsap.set(media, { scale: SCALE_FROM });
        gsap.set(overlay, { opacity: 1 });

        pageReady.then(() => {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: wrapper,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            })
            .to(overlay, { opacity: 0, duration: OVERLAY_DURATION, ease: REVEAL_EASE })
            .to(media, { scale: 1, duration: SCALE_DURATION, ease: REVEAL_EASE }, 0);
        });
      });
      return () => mm.revert();
    },
    { scope: wrapperRef, dependencies: [enabled] },
  );

  return { wrapperRef, mediaRef, overlayRef };
}
