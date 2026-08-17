"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { REVEAL_EASE } from "@/lib/gsapEase";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Line-mask scroll-reveal for narrative text — sibling to Reveal.tsx, not a
 * replacement (see that file's own comment; it stays untouched, still correct
 * for non-text/mixed content). Each visual line masks/translates/blurs into
 * view with a stagger, instead of the whole block fading+sliding as one unit.
 * Same conventions as Reveal.tsx: matchMedia full reduced-motion bypass
 * (SplitText.create is never even called under reduced motion), ScrollTrigger
 * at "top 85%", one-shot toggleActions, REVEAL_EASE.
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
 */
export function RevealText({
  children,
  className,
  as = "div",
  blur = true,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "h1";
  /** Escape hatch for the blur-to-focus layer — animating `filter` isn't
   * compositor-cheap, and call sites with many simultaneous staggered lines
   * are the most likely place to see jank. Keep the translate/opacity reveal
   * either way; drop blur here first if profiling shows a problem. */
  blur?: boolean;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const ref = as === "h1" ? h1Ref : divRef;
  const hasPlayed = useRef(false);

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
              gsap.set(self.lines, { opacity: 1, yPercent: 0, filter: "blur(0px)" });
              return;
            }

            gsap.set(self.lines, {
              yPercent: 110,
              opacity: 0,
              filter: blur ? "blur(6px)" : "blur(0px)",
            });

            return gsap.to(self.lines, {
              yPercent: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.9,
              // `amount`, not `each` — bounds the total stagger spread
              // regardless of how many lines got split (the narrative
              // ParagraphPair merges 3 paragraph bodies, which can add up to
              // a lot of lines; `each` would make longer text take
              // proportionally longer to finish revealing).
              stagger: { amount: 0.5, from: "start" },
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
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [blur] },
  );

  if (as === "h1") {
    return (
      <h1 ref={h1Ref} className={className}>
        {children}
      </h1>
    );
  }
  return (
    <div ref={divRef} className={className}>
      {children}
    </div>
  );
}
