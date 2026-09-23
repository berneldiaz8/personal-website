"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { REVEAL_EASE } from "@/lib/gsapEase";
import { hasPlayed, markPlayed } from "@/lib/playOnce";

/**
 * Shared mechanism behind NavEntrance.tsx (wordmark + Work/Info/Gallery) and
 * GalleryInfoRow.tsx's own entrance (Contact/Connect/Snapshots/copyright):
 * every `[data-nav-mount]` descendant slides up into place out of a
 * *stationary* mask box, once, after `waitFor` resolves. Pulled out once a
 * second caller needed the identical treatment rather than a copy-pasted
 * duplicate — see NavEntrance.tsx's own (more detailed) comment for the full
 * reasoning behind the mask-box mechanics and the onComplete/clearProps
 * hover-safety step; this file only re-states what's caller-agnostic.
 *
 * `data-nav-mount` must sit on an element *inside* a non-moving
 * `overflow-hidden` box, never on that box itself — NavLink.tsx's inner
 * content span (inside its `overflow-hidden` `<a>`) and WordmarkLink.tsx's
 * Logo (inside its `overflow-hidden` Link) both already follow this;
 * MaskedText.tsx exists for plain text that needs the same box built from
 * scratch (GalleryInfoRow's labels/copyright have no existing NavLink-style
 * wrapper to reuse).
 *
 * This used to also take an `onDone` callback, fired partway through the
 * tween, that let a second reveal elsewhere (RevealText.tsx's above-the-fold
 * instances, GalleryFooterReveal.tsx's footer row) start only once *this*
 * reveal was underway — one continuous top-to-bottom wave chaining nav to
 * whatever came next. Both of those cross-reveal dependencies were removed
 * per explicit request (2026-09-23; see RevealText.tsx's and
 * GalleryFooterReveal.tsx's own comments): each reveal now only waits on the
 * loading screen (`pageReady`) directly, so `onDone`/`navReady`
 * (src/lib/navReady.ts) had no remaining callers and were deleted along with
 * it. Only this component's own internal per-target `STAGGER` remains — the
 * cascade *within* a single reveal (e.g. Work → Info → Gallery → Contact),
 * not the wave *between* separate reveals.
 *
 * `display: contents` keeps this wrapper out of whatever Grid layout it sits
 * inside — its children stay direct grid items for col-span placement, this
 * element exists purely as a GSAP scope/ref anchor.
 *
 * `playKey` (src/lib/playOnce.ts) makes this a true once-per-session reveal,
 * not once-per-mount: /gallery lives outside the (site) route group's
 * persistent layout, so navigating between it and any other route fully
 * remounts Nav (and thus whichever MountReveal instance lives under it) —
 * `waitFor` (pageReady) is already resolved by then, so without this check
 * the reveal replayed from scratch on every crossing, visible as the
 * nav/footer briefly vanishing and sliding back in on each navigation
 * (confirmed via a user-supplied screen recording). On a replay mount this
 * skips straight to returning with no animation at all — the fresh elements
 * are already rendering in their natural, final position, so there's
 * nothing to hide or reveal the second time.
 *
 * `pointer-events: none` on every `<a>` in scope, for the whole hidden+tween
 * window: NavLink's hover-swap targets its *duplicate* span (the aria-hidden
 * one), which this component never touches and has no idea a reveal is even
 * in progress — it responds to `:hover` purely via CSS, independent of
 * whatever GSAP is doing to the visible span next to it. Hovering while the
 * visible span was still mid-tween (partially slid into view) let the
 * duplicate slide up too, rendering both at once — two overlapping copies of
 * the label (confirmed via a user-supplied screen recording, right after
 * load, hovering a nav link). Blocking pointer-events for the same window
 * `clearProps` already waits for makes hover physically impossible until the
 * link has actually finished settling, closing the window entirely rather
 * than trying to choreograph the two transforms around each other.
 */
const DURATION = 0.7;
const STAGGER = 0.06;

export function MountReveal({
  children,
  waitFor,
  playKey,
}: {
  children: ReactNode;
  waitFor: Promise<void>;
  /** Unique id for this reveal instance — see file comment. */
  playKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (hasPlayed(playKey)) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const root = ref.current;
        if (!root) return;
        const targets = root.querySelectorAll("[data-nav-mount]");
        if (!targets.length) return;
        const anchors = root.querySelectorAll("a");

        gsap.set(targets, { yPercent: 100 });
        gsap.set(anchors, { pointerEvents: "none" });
        waitFor.then(() => {
          gsap.to(targets, {
            yPercent: 0,
            duration: DURATION,
            ease: REVEAL_EASE,
            stagger: STAGGER,
            onComplete: () => {
              gsap.set(targets, { clearProps: "transform" });
              gsap.set(anchors, { clearProps: "pointerEvents" });
              markPlayed(playKey);
            },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
