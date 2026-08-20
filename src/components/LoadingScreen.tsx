"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { lenisInstance } from "@/components/SmoothScroll";
import { markPageReady } from "@/lib/pageReady";

/**
 * Full-viewport preloader shown on every hard page load. Mounted in root
 * layout.tsx, which only mounts once per real navigation — client-side
 * <Link> clicks between routes never remount the root layout, so this never
 * replays on internal navigation, only on a fresh reload or direct URL load.
 *
 * The percentage counter isn't a fixed-duration simulation. It ramps toward
 * (but never past) RAMP_CAP on its own pace, decelerating (power2.out) as
 * it approaches that ceiling, then only completes to 100% once the page is
 * actually ready — document.fonts.ready plus the window "load" event. On a
 * fast connection the ramp barely gets going before real readiness fires
 * and it snaps straight to 100; on a slow one it genuinely holds near
 * RAMP_CAP for as long as loading actually takes, rather than faking a
 * completion the page hasn't reached yet. MIN_DISPLAY_MS is a floor, not a
 * ceiling — it exists so an already-cached/instant load doesn't flash
 * 0%→100% in a single frame, not to artificially slow anything down.
 *
 * Theme: this site has no system prefers-color-scheme switch anymore — it's
 * fixed light everywhere except /gallery, which forces dark via an explicit
 * data-force-dark attribute (see globals.css's [data-force-dark] block and
 * gallery/page.tsx's own root div). Since this component mounts at the root
 * layout, outside gallery's own data-force-dark div, it re-derives the same
 * thing from the route itself via usePathname() (same pattern
 * SmoothScroll.tsx already uses for pathname-driven logic) rather than
 * inventing a second dark-mode mechanism.
 *
 * Reduced motion: the overlay is hidden via the motion-reduce:hidden CSS
 * class directly on the root element, not a JS matchMedia check — a check
 * inside an effect only runs after the first paint, which would still flash
 * the overlay for a frame on the very first hard load. The CSS variant is
 * evaluated at first paint with no JS involved, so there's no window for
 * that flash. The scroll-lock and GSAP timeline are separately skipped
 * under reduced motion via gsap.matchMedia below (full bypass, not a
 * shortened version, matching every other animation in this codebase), and
 * the component unmounts itself immediately in that case too, rather than
 * relying on the CSS class alone to keep a permanently-hidden fixed overlay
 * sitting in the DOM.
 *
 * Scroll lock deliberately does NOT touch `overflow` on <html> — that was
 * the first version's approach, and it was wrong: globals.css sets
 * `html { overflow-y: scroll }` specifically so the scrollbar gutter is
 * always reserved and routes never shift width against each other (see that
 * rule's own comment). Setting `overflow: hidden` here overrode it, removing
 * the scrollbar gutter for the loading screen's duration and putting it back
 * the instant the screen exits — the exact moment content needs to hold
 * still, it shifted sideways by the scrollbar's width. Root-caused via a
 * user-supplied recording. Instead: lenisInstance.stop()/.start() (the
 * module-level Lenis handle SmoothScroll.tsx already exports for exactly
 * this kind of cross-component control) pauses Lenis's own wheel/touch-
 * driven scroll without touching overflow at all, plus a native
 * wheel/touchmove preventDefault fallback for input Lenis doesn't fully
 * own (a direct scrollbar-thumb drag, or reduced-motion visits where
 * SmoothScroll never even constructs a Lenis instance).
 *
 * Calls markPageReady() (src/lib/pageReady.ts) at the same point it calls
 * setVisible(false) in both branches below — the shared scroll-reveal
 * primitives (RevealText/ShowcaseHeadline) await that
 * signal before creating their ScrollTrigger, so anything above the fold
 * doesn't finish revealing invisibly behind this overlay. See that module's
 * own comment for the full mechanism.
 *
 * The scroll lock lives in its own plain useEffect, deliberately not inside
 * the useGSAP block above — useGSAP runs its setup via useLayoutEffect
 * (confirmed in @gsap/react's own source), which always fires before any
 * plain useEffect in the tree, including SmoothScroll.tsx's, which is what
 * actually constructs the Lenis instance and assigns it to lenisInstance.
 * Calling lenisInstance?.stop() from inside the useGSAP block was a no-op
 * every time — the module-level binding is live (ES module semantics), but
 * it was still null at the exact moment this component read it, since
 * SmoothScroll's effect hadn't run yet regardless of JSX order. A plain
 * useEffect here fires in normal passive-effect order (SmoothScroll's own
 * effect first, since it's the earlier sibling), so lenisInstance is
 * already set by the time this one runs. Confirmed via a real Lenis-state
 * check (its "lenis-stopped" CSS class) after fixing this — absent before,
 * present after.
 */
const RAMP_CAP = 90;
const RAMP_DURATION = 4;
const MIN_DISPLAY_MS = 500;

export function LoadingScreen() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    lenisInstance?.stop();
    const preventScroll = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      lenisInstance?.start();
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
    };
  }, [visible]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const progress = { value: 0 };
        const updateText = () => {
          if (valueRef.current) valueRef.current.textContent = `${Math.round(progress.value)}%`;
        };

        const rampTween = gsap.to(progress, {
          value: RAMP_CAP,
          duration: RAMP_DURATION,
          ease: "power2.out",
          onUpdate: updateText,
        });

        const fontsReady = document.fonts?.ready ?? Promise.resolve();
        const pageLoaded =
          document.readyState === "complete"
            ? Promise.resolve()
            : new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
        const minDisplay = new Promise<void>((resolve) => setTimeout(resolve, MIN_DISPLAY_MS));

        Promise.all([fontsReady, pageLoaded, minDisplay]).then(() => {
          rampTween.kill();
          gsap
            .timeline()
            .to(progress, { value: 100, duration: 0.35, ease: "power2.out", onUpdate: updateText })
            .to(containerRef.current, { opacity: 0, duration: 0.5, ease: "power1.out" }, "+=0.2")
            .call(() => {
              setVisible(false);
              markPageReady();
            });
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        setVisible(false);
        markPageReady();
      });

      return () => mm.revert();
    },
    { scope: containerRef },
  );

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      {...(pathname === "/gallery" ? { "data-force-dark": "" } : {})}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background text-foreground motion-reduce:hidden"
    >
      <span ref={valueRef} className="text-sm font-medium tabular-nums">
        0%
      </span>
    </div>
  );
}
