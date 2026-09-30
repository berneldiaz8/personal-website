"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { REVEAL_EASE } from "@/lib/gsapEase";
import { hasPlayed, markPlayed } from "@/lib/playOnce";
import { onPageTransition } from "@/lib/pageReady";

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
 * nothing to hide or reveal the second time. Nav has since opted out via
 * `replayOnNavigate` (2026-09-30): the replay is now wanted, because it
 * happens hidden behind PageTransition's black curtain and starts only once
 * the curtain has faded, rather than vanishing in plain view. The gallery
 * footer followed (same date, explicit request), so no current caller uses
 * the once-per-session path any more.
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
  replayOnNavigate = false,
  groupSelector,
}: {
  children: ReactNode;
  waitFor: Promise<void>;
  /** Unique id for this reveal instance — see file comment. */
  playKey: string;
  /**
   * Replays the reveal behind every client-side page transition, starting
   * once PageTransition.tsx's curtain has faded back out (explicit request,
   * 2026-09-30, for Nav) — instead of the once-per-session `playKey`
   * behavior. Covers both cases: a persistent instance (Nav in the (site)
   * layout, never remounted) replays via onPageTransition(); a remounted one
   * (Nav on /gallery) plays on mount against the navigation's own
   * `pageReady`, since it renders after PageTransition has re-armed it.
   */
  replayOnNavigate?: boolean;
  /**
   * When set, targets inside the same matching ancestor (e.g. a label and its
   * value) start together, and `STAGGER` applies between groups instead of
   * between individual targets. Targets outside any group each count as
   * their own.
   */
  groupSelector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!replayOnNavigate && hasPlayed(playKey)) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", (context) => {
        const root = ref.current;
        if (!root) return;

        let active = true;
        let lastReady: Promise<void> | null = null;
        const play = (ready: Promise<void>) => {
          // A remounted instance gets the same gate twice: once on mount,
          // then again from PageTransition's own notify.
          if (ready === lastReady) return;
          lastReady = ready;

          const targets = root.querySelectorAll("[data-nav-mount]");
          if (!targets.length) return;
          const anchors = root.querySelectorAll("a");
          const groups: Element[] = [];
          const groupIndex = Array.from(targets, (target) => {
            const group = (groupSelector && target.closest(groupSelector)) || target;
            if (!groups.includes(group)) groups.push(group);
            return groups.indexOf(group);
          });

          // context.add(): replays arrive later via onPageTransition, outside
          // this callback, so record them into this component's own context
          // (reverted on unmount) rather than whichever one happens to be
          // active. onPageTransition must fire from outside any GSAP context
          // for this to hold — see PageTransition.tsx's notify effect.
          context.add(() => {
            gsap.killTweensOf(targets);
            gsap.set(targets, { yPercent: 100 });
            gsap.set(anchors, { pointerEvents: "none" });
          });
          ready.then(() => {
            // Unmounted, or a newer navigation has already taken over.
            if (!active || ready !== lastReady) return;
            context.add(() => {
              gsap.to(targets, {
                yPercent: 0,
                duration: DURATION,
                ease: REVEAL_EASE,
                stagger: groupSelector
                  ? (i: number) => groupIndex[i] * STAGGER
                  : STAGGER,
                onComplete: () => {
                  gsap.set(targets, { clearProps: "transform" });
                  gsap.set(anchors, { clearProps: "pointerEvents" });
                  markPlayed(playKey);
                },
              });
            });
          });
        };

        play(waitFor);
        const unsubscribe = replayOnNavigate ? onPageTransition(play) : undefined;
        return () => {
          active = false;
          unsubscribe?.();
        };
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
