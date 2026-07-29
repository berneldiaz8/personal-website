"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP/ScrollTrigger scroll-reveal for full-bleed media — the raggededge.com-inspired
 * "spreads from the side" wipe. Sibling to Reveal.tsx (also GSAP now, see its own
 * comment), but a deliberately separate system: this owns scroll-linked media reveals,
 * Reveal stays for everything else. Don't layer both on one element — two independent
 * scroll-triggered animators fighting over the same node is exactly the failure mode
 * this split avoids.
 *
 * Mechanic is a compositor-friendly curtain panel (scaleX + transform-origin on an
 * absolutely-positioned overlay), not a `clip-path` wipe on the media itself —
 * clip-path animates on the main thread, undermining the whole point of a "smooth"
 * feature. The panel's bg-background matches ShowcaseImage/ShowcaseVideo's own
 * container background exactly (both use the `--background` token, not a literal
 * white), so there's no color flash before reveal in either theme. This was
 * literally `bg-white` originally, which stood out as a mismatched stark-white
 * rectangle once the site's primary background moved off near-white to a warmer
 * cream (`#f8f6f2`) — same fix applied to both container backgrounds it's meant to
 * match, not just this panel alone.
 *
 * Reduced motion gets a full bypass, not a shortened version: gsap.matchMedia() skips
 * the JS animation entirely (panel never receives a transform), backed by a CSS-level
 * `motion-reduce:hidden` on the panel itself as a second, independent guarantee.
 *
 * Deliberately plays in full even when the trigger is already in view on mount (e.g.
 * the first project's hero on a fresh /work navigation, no scroll needed) — this DOES
 * mean the solid white panel sits over the media for the full 1.1s in that case
 * (confirmed via frame-by-frame screencast capture), which was tried as a bug fix
 * (skip straight to revealed when already in view) and explicitly reverted per user
 * request: the animation itself is wanted even there, not just as a response to
 * scrolling. If the always-in-view case needs addressing again later, prefer
 * shortening the duration for that case over skipping the tween entirely.
 */
export function RevealWipe({
  children,
  className,
  side = "left",
}: {
  children: ReactNode;
  className?: string;
  side?: "left" | "right";
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(panelRef.current, { transformOrigin: side, scaleX: 1 });
        gsap.to(panelRef.current, {
          scaleX: 0,
          duration: 1.1,
          ease: "power4.inOut",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });
      return () => mm.revert();
    },
    { scope: wrapperRef, dependencies: [side] },
  );

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ""}`}>
      {children}
      <div
        ref={panelRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-background motion-reduce:hidden"
      />
    </div>
  );
}
