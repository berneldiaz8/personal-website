"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * Vertical text-swap on prop change — the current text slides out (up or
 * down per `reverse`), swaps to the new string once offscreen, then slides
 * back in from the opposite side. Extracted from CursorLabel.tsx's own
 * label-swap timeline (see that file's `reverse` doc comment for the fuller
 * writeup and the FooterWordmark "Email Me"/"Email Copied" call site this
 * mirrors) but with none of that component's cursor-follow/portal/mix-blend
 * machinery — this renders inline, in place, clipped by the ancestor
 * NavLink's own `overflow-hidden` box rather than a floating pill.
 */
export function AnimatedNavText({ text, reverse }: { text: string; reverse: boolean }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [displayedText, setDisplayedText] = useState(text);
  const prevTextRef = useRef(text);

  useGSAP(
    () => {
      if (text === prevTextRef.current) return;
      prevTextRef.current = text;
      if (!textRef.current) {
        setDisplayedText(text);
        return;
      }
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline()
          .to(textRef.current, { yPercent: reverse ? 100 : -100, duration: 0.16, ease: "power2.in" })
          .call(() => setDisplayedText(text))
          .set(textRef.current, { yPercent: reverse ? -100 : 100 })
          .to(textRef.current, { yPercent: 0, duration: 0.16, ease: "power2.out" });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        setDisplayedText(text);
      });
      return () => mm.revert();
    },
    { dependencies: [text, reverse] },
  );

  return (
    <span ref={textRef} className="block">
      {displayedText}
    </span>
  );
}
