"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { REVEAL_EASE } from "@/lib/gsapEase";
import { pageReady } from "@/lib/pageReady";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Line-mask scroll-reveal for narrative text — every visual line
 * masks/translates into view with a stagger, instead of the whole block
 * fading in as one unit (that whole-block fade, Reveal.tsx, was removed
 * site-wide per explicit user request — this is now the only scroll-reveal
 * primitive left on the site, alongside ShowcaseHeadline's own bespoke
 * word-mask reveal). matchMedia full reduced-motion bypass
 * (SplitText.create is never even called under reduced motion), ScrollTrigger
 * at "top 85%", one-shot toggleActions, REVEAL_EASE. Duration/stagger scale
 * with line count rather than being fixed — see the "play once ready"
 * effect below for the exact formula and its reasoning.
 *
 * Targets `<p>` descendants specifically, not the wrapper div itself —
 * SplitText's line-detection only measures the direct children of whatever
 * element(s) it's given, so pointing it at a wrapper containing multiple
 * block-level `<p>`s (e.g. ParagraphPair's label + body) would detect bogus
 * block-level "lines" instead of each paragraph's own wrapped text. Falls
 * back to the ref element itself when there's no nested `<p>`.
 *
 * autoSplit re-splits on resize/font-load (real breakpoint text-size changes
 * exist on this site, e.g. ShowcaseHeadline's text-4xl -> sm:text-5xl, plus
 * the self-hosted webfont swap). Because the reveal is one-shot and must
 * never replay once seen, `hasPlayed` guards post-completion re-splits: new
 * lines snap straight to their visible end state instead of re-animating.
 * GSAP's own Animation.revert()->kill() already kills the *previous* split's
 * ScrollTrigger whenever SplitText re-splits, so no manual tracking needed.
 *
 * The hide step (gsap.set to yPercent:110/opacity:0) always runs immediately
 * on mount/split, same as before pageReady (src/lib/pageReady.ts) existed —
 * only the actual reveal *tween* waits for it. Gating the hide step too was
 * tried and was wrong: LoadingScreen.tsx's overlay fades out over 0.5s
 * *before* pageReady resolves (it only resolves once that fade fully
 * completes), so if hiding waited on it too, the fully-visible, un-animated
 * text would flash through the dissolving overlay, then suddenly snap to
 * hidden and replay — worse than the bug the gate was meant to fix. Splitting
 * "hide now" from "play once ready" avoids that: content is invisible from
 * the very first paint, exactly as before, and only *when* the reveal tween
 * itself gets created (and thus fires, per ScrollTrigger's already-in-view
 * behavior) is deferred until the overlay is actually gone. See
 * pageReady.ts's own comment for why that deferral is needed at all.
 *
 * `as="a"`/`as="dt"`/`as="dd"` exist so an element with its own required
 * semantic role can itself be the SplitText target — safe, confirmed via a
 * real ARIA snapshot each time (the element keeps its role and gets
 * SplitText's auto aria-label directly, only its *children* (the mask
 * wrapper divs) go aria-hidden). What's NOT safe: nesting one of these
 * *inside* text this component splits instead (e.g. a `<p>` containing an
 * `<a>`, or wrapping a `<dt>`/`<dd>` in a plain `<div>` this component
 * splits) — SplitText then wraps the real element in the aria-hidden mask
 * divs, and the compensating aria-label lands on the outer wrapper instead,
 * which doesn't carry the same role:
 * - an `<a>` nested this way silently drops out of the accessibility tree
 *   entirely (confirmed on the /info Experience section's company links —
 *   reverted, then fixed by switching to this as="a" variant instead of
 *   nesting).
 * - a `<dt>`/`<dd>` nested this way (or wrapped in a plain div) doesn't even
 *   get an inaccessible-but-present node — the label-bearing div isn't a
 *   `dd`, so it's dropped from the `<dl>`'s term/definition pairing
 *   entirely (confirmed on /work's meta row via a real ARIA snapshot: the
 *   dl exposed all 4 "term" nodes but zero "definition" nodes — reverted,
 *   then fixed the same way, with as="dt"/as="dd").
 */
export function RevealText({
  children,
  className,
  as = "div",
  href,
  target,
  rel,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "h1" | "h3" | "a" | "dt" | "dd";
  /** Only used when as="a". */
  href?: string;
  target?: string;
  rel?: string;
  /**
   * Seconds to hold before the reveal tween starts, on top of whatever
   * ScrollTrigger/pageReady timing already applies. 0 by default (every
   * existing call site keeps its current behavior). Added for
   * GalleryLightbox's caption, which used to start revealing in lockstep
   * with the image's own fade-in — a deliberate pause here instead lets the
   * image settle first and makes the caption read as its own distinct beat
   * rather than blending into the image appearing.
   */
  delay?: number;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const dlPartRef = useRef<HTMLElement>(null);
  const ref =
    as === "div"
      ? divRef
      : as === "a"
        ? anchorRef
        : as === "dt" || as === "dd"
          ? dlPartRef
          : headingRef;
  const hasPlayed = useRef(false);
  const pendingLinesRef = useRef<Element[] | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pageReady.then(() => setReady(true));
  }, []);

  // Split + hide immediately on mount — never gated on ready (see comment
  // above).
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const root = ref.current;
        if (!root) return;

        const paragraphs = root.querySelectorAll<HTMLElement>("p");
        const splitTargets: HTMLElement[] = paragraphs.length
          ? Array.from(paragraphs)
          : [root];

        SplitText.create(splitTargets, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit(self) {
            if (hasPlayed.current) {
              gsap.set(self.lines, { opacity: 1, yPercent: 0 });
              return;
            }

            gsap.set(self.lines, { yPercent: 110, opacity: 0 });
            pendingLinesRef.current = self.lines;
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  // Play once ready — a separate context so the tween (and its
  // ScrollTrigger) is only created once the loading screen is actually
  // gone, without delaying the split+hide step above. pendingLinesRef stays
  // null under reduced motion (the matchMedia guard above skips the split
  // entirely), so this stays a no-op there too.
  useGSAP(
    () => {
      const root = ref.current;
      if (!ready || !pendingLinesRef.current || !root) return;
      const lines = pendingLinesRef.current;
      pendingLinesRef.current = null;

      // Both duration and stagger spread scale with how many lines actually
      // got split, instead of every instance on the site — a single-word
      // label ("Role") and an 8-line merged narrative block ("The Work") —
      // using the same fixed number regardless of content. Went through two
      // rounds of retuning: the original fixed 0.9s/0.5s (~1.4s total
      // regardless of content) read as sluggish; cutting it to match a
      // reference recording's raw speed (0.4-0.5s/0-0.35s) then read as an
      // abrupt snap — REVEAL_EASE's long decelerate tail needs real runway
      // to be perceptible, and 0.4-0.5s didn't leave enough of it even after
      // one lengthening pass (0.6-0.75s) still wasn't enough per explicit
      // user feedback. Lengthened further here. `lineCount - 1` (not
      // `lineCount`) so a single line adds zero stagger — nothing to
      // cascade against — and gets only its own base duration.
      const lineCount = lines.length;
      const duration = gsap.utils.clamp(0.85, 1.05, 0.85 + (lineCount - 1) * 0.03);
      const staggerAmount = gsap.utils.clamp(0, 0.55, (lineCount - 1) * 0.08);

      gsap.to(lines, {
        yPercent: 0,
        opacity: 1,
        duration,
        delay,
        // `amount`, not `each` — still bounds the total stagger spread
        // regardless of line count (staggerAmount's own clamp above already
        // caps it), it's just no longer one fixed number for every
        // instance on the site.
        stagger: { amount: staggerAmount, from: "start" },
        ease: REVEAL_EASE,
        onComplete: () => {
          hasPlayed.current = true;
        },
        scrollTrigger: {
          trigger: root,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    },
    { scope: ref, dependencies: [ready, delay] },
  );

  if (as === "h1") {
    return (
      <h1 ref={headingRef} className={className}>
        {children}
      </h1>
    );
  }
  if (as === "h3") {
    return (
      <h3 ref={headingRef} className={className}>
        {children}
      </h3>
    );
  }
  if (as === "a") {
    return (
      <a ref={anchorRef} href={href} target={target} rel={rel} className={className}>
        {children}
      </a>
    );
  }
  if (as === "dt") {
    return (
      <dt ref={dlPartRef} className={className}>
        {children}
      </dt>
    );
  }
  if (as === "dd") {
    return (
      <dd ref={dlPartRef} className={className}>
        {children}
      </dd>
    );
  }
  return (
    <div ref={divRef} className={className}>
      {children}
    </div>
  );
}
