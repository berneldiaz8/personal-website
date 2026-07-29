"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/data/projects";
import { lenisInstance } from "./SmoothScroll";
import { ProjectShowcase } from "./showcase/ProjectShowcase";

gsap.registerPlugin(ScrollTrigger);

function accentStyle(accent: { light: string; dark: string }): CSSProperties {
  return {
    "--accent-light": accent.light,
    "--accent-dark": accent.dark,
  } as CSSProperties;
}

export function WorkBrowser() {
  const searchParams = useSearchParams();
  const openParam = searchParams.get("open");
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Stacked-cards transition, take 2 — replaces RevealStack.tsx's negative-margin +
   * scrubbed counter-transform approach (removed). That version moved the incoming
   * AND outgoing card at once (outgoing kept scrolling normally at the same time the
   * incoming card was transforming over it), which read as busy rather than
   * deliberate. This version is the classic "pin the outgoing card, let the next one
   * catch up" recipe instead: the outgoing project's card pins — genuinely freezes
   * in the viewport, not just visually implied — exactly when its own bottom edge
   * reaches the viewport bottom (i.e. once its content has fully, naturally scrolled
   * into view, nothing of it left below), for exactly one viewport-height of further
   * scroll. The incoming card needs zero special treatment: it's a plain, unmodified
   * row immediately following in normal document flow, and `pinSpacing: false` means
   * the pin borrows no extra document height for itself — so as the user keeps
   * scrolling during the pin window, the incoming row's natural position advances
   * normally and visually slides up to cover the frozen outgoing card, painting over
   * it by ordinary later-in-DOM stacking order (same zero-z-index mechanism the
   * footer's own reveal already relies on).
   *
   * Bounded to exactly one viewport (`end: () => "+=" + window.innerHeight`, a
   * function so it re-measures on resize rather than baking in a stale value) so
   * this never freezes a tall card for a long, dead scroll distance the way pinning
   * a whole multi-thousand-px case study would — only the already-fully-visible tail
   * ever gets pinned, for one screen's worth of transition.
   */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        for (let i = 1; i < projects.length; i++) {
          const prevRow = rowRefs.current[projects[i - 1].slug];
          if (!prevRow) continue;
          ScrollTrigger.create({
            trigger: prevRow,
            start: "bottom bottom",
            end: () => `+=${window.innerHeight}`,
            pin: true,
            pinSpacing: false,
          });
        }
      });
      return () => mm.revert();
    },
    { scope: containerRef },
  );

  useEffect(() => {
    if (openParam && projects.some((p) => p.slug === openParam)) {
      const row = rowRefs.current[openParam];
      if (row) {
        // No transform/margin trick on any row anymore (see the useGSAP block above
        // — the new mechanic pins the *outgoing* card instead of moving the
        // incoming one), so the row's own natural document position is once again
        // exactly where its hero sits — no offset math needed.
        const targetY = row.getBoundingClientRect().top + window.scrollY;

        // Always an instant jump (`immediate: true` / `behavior: "auto"`), not an
        // animated scroll — deliberate, requested: this is a page-to-page
        // navigation (homepage teaser -> /work?open={slug}), not an in-page scroll
        // interaction, so it should land on the target section immediately with no
        // visible scrolling motion, the same way a normal anchor-link jump would.
        // Independent of prefers-reduced-motion, which governs *animated* motion —
        // there's no animation here to gate either way.
        //
        // Prefer Lenis's own scrollTo — native scrollIntoView/window.scrollTo change
        // window.scrollY directly, which Lenis doesn't treat as authoritative (it
        // keeps driving toward its own last-known targetScroll), silently no-opping
        // the jump once this page's ScrollTrigger pins exist. Lenis is only absent
        // under prefers-reduced-motion (SmoothScroll skips creating it entirely
        // then), so the native fallback there is correct either way — no smooth
        // Lenis animation to prefer when there's no Lenis instance running.
        if (lenisInstance) {
          // A synchronous resize() first, not optional: scrollTo() clamps its target
          // against Lenis's cached `limit` (confirmed in node_modules/lenis/dist/
          // lenis.mjs — `target = clamp(0, target, this.limit)`), and on a
          // client-side <Link> navigation into /work, SmoothScroll.tsx's own resync
          // is deferred (staggered setTimeout(0/100/300)), so this effect can run
          // before any of them fire. resize() here is synchronous and reads the
          // DOM's current (already-correct) state, so the clamp uses a fresh limit
          // regardless of whether SmoothScroll's own resync has fired yet.
          lenisInstance.resize();
          lenisInstance.scrollTo(targetY, { immediate: true });
        } else {
          window.scrollTo({ top: targetY, behavior: "auto" });
        }
      }
    }
    // Only run once on mount, driven by the URL at load time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="work">
      <h2 className="sr-only">Selected Work</h2>

      <div ref={containerRef} className="flex flex-col">
        {projects.map((project, i) => (
          <div
            key={project.slug}
            ref={(el) => {
              rowRefs.current[project.slug] = el;
            }}
            data-project-accent
            style={accentStyle(project.accent)}
            className="bg-background pb-[160px]"
          >
            <h3 className="sr-only">{project.name}</h3>

            <div>
              <ProjectShowcase
                project={project}
                priority={openParam ? project.slug === openParam : i === 0}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
