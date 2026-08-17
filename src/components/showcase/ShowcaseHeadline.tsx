"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { REVEAL_EASE } from "@/lib/gsapEase";

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
 * Shared by every project's ProjectShowcase (originally introduced for Opinly).
 */
export function ShowcaseHeadline({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayed = useRef(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const root = containerRef.current;
        if (!root) return;

        SplitText.create(root, {
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

            return gsap
              .timeline({
                onComplete: () => {
                  hasPlayed.current = true;
                },
                scrollTrigger: {
                  trigger: root,
                  start: "top 85%",
                  toggleActions: "play none none none",
                },
              })
              .to(nameWords, {
                yPercent: 0,
                opacity: 1,
                filter: "blur(0px)",
                duration: 0.9,
                // `amount`, not `each` — spreads a fixed total stagger across
                // however many words there are, instead of scaling linearly
                // with word count. `each` made a long description (some run
                // 20+ words) take nearly 3s to finish revealing; `amount`
                // keeps every headline's total reveal time roughly constant
                // regardless of copy length.
                stagger: { amount: 0.15, from: "start" },
                ease: REVEAL_EASE,
              })
              .to(
                descriptionWords,
                {
                  yPercent: 0,
                  opacity: 1,
                  filter: "blur(0px)",
                  // Shorter than nameWords' tween — descriptions run much
                  // longer (some 20+ words) and even with a bounded `amount`
                  // stagger, a full 0.9s duration on top of that made the
                  // total reveal feel draggy (~1.8-2.9s measured). Keeps the
                  // whole headline settling in well under 2s regardless of
                  // copy length.
                  duration: 0.7,
                  stagger: { amount: 0.25, from: "start" },
                  ease: REVEAL_EASE,
                },
                "-=0.35",
              );
          },
        });
      });
      return () => mm.revert();
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="px-4 pt-6 pb-[136px] sm:px-5 lg:px-6">
      <div className="max-w-[60rem] text-balance text-4xl font-medium leading-[1.1] tracking-[-0.5px] text-foreground sm:text-5xl">
        <span data-headline-part="name">{name}</span>
        <span data-headline-part="description" className="font-extralight text-muted">
          {"—"}
          {description}
        </span>
      </div>
    </div>
  );
}
