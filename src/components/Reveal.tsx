"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { REVEAL_EASE } from "@/lib/gsapEase";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-triggered fade+slide-up, GSAP/ScrollTrigger version — migrated off
 * motion/react so the site only ships one animation engine (GSAP was already
 * required for WorkBrowser's pin-based stacking and SmoothScroll's Lenis
 * sync, which motion/react has no equivalent for; this was the redundant
 * half, not the other way around). Same trigger point as RevealWipe.tsx
 * ("top 85%", one-shot) for a consistent scroll-reveal feel across both
 * systems, and the same REVEAL_EASE curve motion/react used previously, so
 * the migration doesn't change how anything actually looks or feels.
 *
 * Reduced motion gets a full bypass, not a shortened version: gsap.matchMedia()
 * skips the animation (and the initial opacity:0/y:24 set) entirely, so the
 * element just renders in its normal static state — matching every other
 * animation in this codebase.
 *
 * Deliberately plays in full even when already in view on mount — same
 * already-in-view bypass RevealWipe.tsx tried was applied here too, then
 * explicitly reverted per user request alongside it (see that file's comment).
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(ref.current, { opacity: 0, y: 24 });
        gsap.to(ref.current, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay,
          ease: REVEAL_EASE,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [delay] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
