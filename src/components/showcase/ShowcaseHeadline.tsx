"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { REVEAL_EASE } from "@/lib/gsapEase";
import { textStyles } from "@/lib/typography";
import { pageReady } from "@/lib/pageReady";
import { RevealText } from "../RevealText";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Mixed-weight display headline: "Name—description", name in Medium weight (black),
 * description in ExtraLight (muted), both in the site's font-sans family. Figma:
 * Display/5xl Medium + Display/5xl ExtraLight (paired styles — a single Figma text
 * style can't express two weights in one run). The em-dash is an explicit, scoped
 * exception to the site's em-dash ban — see CLAUDE.md and .claude/rules/skills-used.md
 * before touching it.
 *
 * Owns its own bespoke scroll-reveal (like Hero.tsx) rather than routing through
 * RevealText: a two-beat word-mask reveal where `name` and `description` animate as
 * two overlapping groups, description starting mid-way through name's reveal,
 * reinforcing the weight hierarchy already in the copy. Word-level (not line-level)
 * masking, since this headline is short.
 *
 * Zero whitespace between `name` and the description span is safe for word
 * bucketing: word-splitting never merges across a sibling element boundary
 * (confirmed against gsap/src/SplitText.ts's recursive splitter). `name` stays
 * wrapped in its own span purely so `.closest()` has an ancestor to find.
 *
 * `leading-[1.2]`, not the Figma-matched 1.1 this originally shipped with —
 * SplitText's `mask: "words"` wrapper is an empty clone of each word with
 * only `overflow: clip` set (confirmed in gsap/src/SplitText.js); it has no
 * explicit height, so it inherits its box height purely from `line-height`,
 * with no allowance for descender ink the way normal (unmasked) text
 * silently gets. At 1.1 this clipped the bottom of every descender (g/j/p/
 * q/y) in the description text — invisible under `prefers-reduced-motion`
 * (SplitText never runs there) but present for everyone else. 1.2 was the
 * smallest bump that fully cleared it, confirmed by screenshotting
 * "recordkeeping"/"traceability"/"pressure" at 1.1/1.2/1.25/1.3.
 *
 * Shared by every project's ProjectShowcase (originally introduced for Opinly).
 *
 * The hide step (gsap.set to yPercent:110/opacity:0/blur) always runs
 * immediately on split, same as before pageReady (src/lib/pageReady.ts)
 * existed — only the actual reveal timeline waits for it. Gating the hide
 * step too was tried and was wrong: LoadingScreen.tsx's overlay fades out
 * over 0.5s *before* pageReady resolves (it only resolves once that fade
 * fully completes), so if hiding waited on it too, the fully-visible,
 * un-animated headline would flash through the dissolving overlay, then
 * suddenly snap to hidden and replay — worse than the bug the gate was
 * meant to fix (the priority project's headline sits above the fold on
 * /work). See pageReady.ts's own comment for why the deferral is needed.
 */
export function ShowcaseHeadline({
  name,
  description,
  caption,
}: {
  name: string;
  description: string;
  /** Optional NDA disclosure line, rendered 24px below the headline, one line. */
  caption?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const hasPlayed = useRef(false);
  const pendingWordsRef = useRef<{ nameWords: Element[]; descriptionWords: Element[] } | null>(
    null,
  );
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
        const root = containerRef.current;
        const headline = headlineRef.current;
        if (!root || !headline) return;

        // Split only the headline text, not `root` — `root` also contains the
        // optional NDA caption below, and SplitText would otherwise sweep its
        // words into `self.words`, hide them via the gsap.set below, and never
        // animate them back (only nameWords/descriptionWords get revealed),
        // leaving the caption permanently invisible.
        SplitText.create(headline, {
          type: "words",
          mask: "words",
          autoSplit: true,
          onSplit(self) {
            if (hasPlayed.current) {
              gsap.set(self.words, { opacity: 1, yPercent: 0, filter: "blur(0px)" });
              return;
            }

            const nameWords = self.words.filter((w) =>
              w.closest('[data-headline-part="name"]'),
            );
            const descriptionWords = self.words.filter((w) =>
              w.closest('[data-headline-part="description"]'),
            );

            gsap.set(self.words, { yPercent: 110, opacity: 0, filter: "blur(6px)" });
            pendingWordsRef.current = { nameWords, descriptionWords };
          },
        });
      });
      return () => mm.revert();
    },
    { scope: containerRef },
  );

  // Play once ready — a separate context so the timeline (and its
  // ScrollTrigger) is only created once the loading screen is actually
  // gone, without delaying the split+hide step above. pendingWordsRef stays
  // null under reduced motion (the matchMedia guard above skips the split
  // entirely), so this stays a no-op there too.
  useGSAP(
    () => {
      const root = containerRef.current;
      if (!ready || !pendingWordsRef.current || !root) return;
      const { nameWords, descriptionWords } = pendingWordsRef.current;
      pendingWordsRef.current = null;

      gsap
        .timeline({
          onComplete: () => {
            hasPlayed.current = true;
          },
          scrollTrigger: {
            trigger: root,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        })
        .to(nameWords, {
          yPercent: 0,
          opacity: 1,
          filter: "blur(0px)",
          // Went through three rounds of retuning. Original fixed 0.9/0.15
          // (~1.4-1.5s total for the whole headline) read as sluggish;
          // cutting to 0.5/0.08 to match a reference reveal's raw speed
          // (Recordings/Text-animation.mov) then read as an abrupt snap —
          // REVEAL_EASE's long decelerate tail needs real runway to be
          // perceptible. A first lengthening pass (0.65/0.1, ~1.1s total)
          // still read as a snap per explicit user feedback. Lengthened
          // further here. `amount`, not `each` — spreads a fixed total
          // stagger across however many words there are, instead of scaling
          // linearly with word count.
          duration: 0.9,
          stagger: { amount: 0.15, from: "start" },
          ease: REVEAL_EASE,
        })
        .to(
          descriptionWords,
          {
            yPercent: 0,
            opacity: 1,
            filter: "blur(0px)",
            // Retuned alongside nameWords, same reasoning. Own span
            // (duration + stagger amount) is ~1.07s; combined with
            // nameWords' ~1.05s span and the "-=0.7" overlap below, the
            // whole headline now settles at ~1.4s total.
            duration: 0.85,
            stagger: { amount: 0.22, from: "start" },
            ease: REVEAL_EASE,
          },
          "-=0.7",
        );
    },
    { scope: containerRef, dependencies: [ready] },
  );

  return (
    <div ref={containerRef} className="px-4 pt-6 pb-[136px] sm:px-5 lg:px-6">
      <div
        ref={headlineRef}
        className="max-w-[60rem] text-balance text-4xl font-medium leading-[1.2] tracking-[-0.5px] text-foreground sm:text-5xl"
      >
        <span data-headline-part="name">{name}</span>
        <span data-headline-part="description" className="font-extralight text-muted">
          {"—"}
          {description}
        </span>
      </div>
      {caption && (
        <RevealText as="div" className="mt-6 max-w-[60rem]">
          <p className={textStyles.showcaseCaption}>{caption}</p>
        </RevealText>
      )}
    </div>
  );
}
