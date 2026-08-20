"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { REVEAL_EASE } from "@/lib/gsapEase";

/**
 * Hard-cut-then-fade page transition, modeled directly on a user-supplied
 * reference recording (Recordings/Page-transition.mov, vvichael.com) rather
 * than this site's own existing motion language. Frame-by-frame analysis of
 * that recording showed no wipe/curtain/slide/shared-element morph: the
 * outgoing view disappears instantly (no fade-out), then the incoming page's
 * content fades from 0 to full opacity as one uniform block — no per-line/
 * per-word stagger. That's exactly what this component reproduces: mounted
 * via template.tsx (see that file's own doc comment), which Next.js
 * remounts fresh on every route-segment navigation — the previous page's DOM
 * is torn down synchronously by React itself before this one mounts, so the
 * "hard cut" is free, not something this component has to engineer.
 *
 * DURATION started at the reference recording's own raw speed (0.35s,
 * matched by counting frames in that recording) but read as an abrupt snap
 * in practice, not premium — the same lesson learned tuning RevealText.tsx/
 * ShowcaseHeadline.tsx's own reveals: REVEAL_EASE is a steep ease-out (near-
 * full velocity from t=0, long decelerate tail), and that tail needs real
 * duration to be perceptible as a glide rather than an instant pop. 0.35s
 * didn't leave enough of it; a first lengthening pass to 0.7s still read as
 * abrupt per explicit follow-up feedback. Lengthened further here, now
 * matching RevealText's own settled duration range (0.85-1.05s, scaled by
 * line count) rather than ShowcaseHeadline's shorter per-beat figure —
 * matching *this site's* established premium-feel timing takes priority
 * over matching the reference recording's literal frame count on a value
 * that didn't survive contact with an actual viewer.
 *
 * Deliberately module-level state, not React state or context — same
 * pattern as pageReady.ts's own mutable binding, and for the same structural
 * reason: this needs to persist across template.tsx's own remounts (a fresh
 * component instance mounts on every client-side navigation, by design) to
 * answer "has *any* PageTransition mounted yet this session", which a
 * plain useState inside this very component can't do, since a fresh instance
 * has no memory of a previous one. Skipping the very first mount is
 * required, not optional: that first paint (hard refresh or a direct URL
 * load) is already owned by LoadingScreen.tsx's own overlay-fade plus each
 * page's RevealText/ShowcaseHeadline scroll reveals — fading the whole page
 * in a second time on top of those would double up, not compose with them.
 * Reset to false only by an actual hard reload, since it's plain module
 * state, not persisted anywhere.
 */
let hasMountedBefore = false;

const DURATION = 1.0;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Captured once, on this instance's first render, via a lazy ref
  // initializer — must stay fixed for this instance's whole lifetime even
  // though the module flag itself flips to `true` moments later. Reading
  // `hasMountedBefore` directly inside the effect below instead would give
  // every instance the same (wrong, always-true-after-the-first) answer.
  // Only *reading* the module flag here — the write happens inside the
  // effect below, since mutating module state during render (impure) trips
  // React's own lint rule (react-hooks/globals).
  const isFirstMountEver = useRef<boolean | null>(null);
  if (isFirstMountEver.current === null) {
    isFirstMountEver.current = !hasMountedBefore;
  }

  useGSAP(
    () => {
      hasMountedBefore = true;
      if (isFirstMountEver.current) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(containerRef.current, { opacity: 0 });
        gsap.to(containerRef.current, {
          opacity: 1,
          duration: DURATION,
          ease: REVEAL_EASE,
        });
      });
      // No reduced-motion branch needed — matchMedia's un-added state
      // already leaves the container at its default opacity (1, i.e. fully
      // visible, no animation), matching every other full-bypass reveal in
      // this codebase.
      return () => mm.revert();
    },
    { scope: containerRef },
  );

  return <div ref={containerRef}>{children}</div>;
}
