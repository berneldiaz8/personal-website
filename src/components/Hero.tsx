"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { REVEAL_EASE } from "@/lib/gsapEase";
import { Logo } from "./Logo";

/**
 * Single fade-up entrance, GSAP version (migrated off motion/react — see
 * Reveal.tsx for why). Mount-time only, no ScrollTrigger needed. The "h1"
 * selector is scoped to this section via useGSAP's `scope` option. Source:
 * Figma node 1587:15147 — the two-line headline + separate subtext this
 * replaced is now one flowing statement, with the wordmark set inline as
 * the sentence's subject rather than sitting in a byline above it.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set("h1", { opacity: 0, y: 16 });
        gsap.to("h1", { opacity: 1, y: 0, duration: 0.6, ease: REVEAL_EASE });
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="px-4 pt-10 pb-16 sm:px-5 sm:pb-24 lg:px-6 lg:pb-40">
      <h1 className="max-w-[923px] text-pretty text-3xl font-extralight leading-[1.15] tracking-[-0.5px] text-muted sm:text-4xl lg:text-[48px]">
        <span className="sr-only">berneldiaz</span>
        <Logo
          aria-hidden="true"
          className="mr-3 inline-block h-[0.73em] w-auto translate-y-[calc(0.05em_-_1px)] align-baseline text-foreground"
        />
        is a designer who brings structure and clarity to complex
        products, from early stage startups to platforms serving over a
        million people.
      </h1>
    </section>
  );
}
