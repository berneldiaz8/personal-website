"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/data/projects";
import { lenisInstance } from "./SmoothScroll";
import { ProjectShowcase } from "./showcase/ProjectShowcase";

gsap.registerPlugin(ScrollTrigger);

// How long the `?open={slug}` deep-link scroll keeps re-correcting itself
// against later layout shifts (see the useLayoutEffect below) — generous
// enough to comfortably cover a project's own hero video reaching its real
// dimensions on an ordinary connection, not just a debounce-length buffer.
const REASSERT_WINDOW_MS = 4000;

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

  useLayoutEffect(() => {
    if (openParam && projects.some((p) => p.slug === openParam)) {
      const row = rowRefs.current[openParam];
      if (row) {
        // No transform/margin trick on any row anymore (see the useGSAP block above
        // — the new mechanic pins the *outgoing* card instead of moving the
        // incoming one), so the row's own natural document position is once again
        // exactly where its hero sits.
        //
        // Nav.tsx's `<header>` is `sticky top-0 z-50`, so without compensating for
        // it here, landing exactly on the row's own top tucks the first 60px of the
        // project's content underneath Nav instead of actually showing it (confirmed
        // by measuring Nav's rendered height — same 60px on mobile and desktop,
        // since `py-5` + its content row's line-height aren't responsive-varied).
        // Measured live via the DOM (`<header>` is unique on the page) rather than a
        // hardcoded constant — a hardcoded value would silently go stale the moment
        // Nav's own height changes, the same staleness Footer.tsx's own `mt-[60px]`
        // comment already flags for exactly this measurement.
        //
        // Computed fresh inside a function, not once up front: this row's own
        // height isn't final at mount — its video/image content hasn't loaded yet,
        // so `getBoundingClientRect()` at this exact instant can be measuring a
        // shorter box than the row will actually end up being, and *earlier* rows
        // growing as their own media loads pushes this row further down the
        // document afterward. A frozen target computed once would go stale the
        // moment that happens (confirmed: landing drifted into the tail end of the
        // previous project's row once its hero video finished sizing, well after
        // this effect had already run). Recomputing on every call means each
        // correction below reflects the document's actual, current layout instead
        // of whatever it looked like at the original jump.
        const computeTargetY = () => {
          const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
          return row.getBoundingClientRect().top + window.scrollY - headerHeight;
        };

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
        const jump = () => {
          const targetY = computeTargetY();
          if (lenisInstance) {
            // A synchronous resize() first, not optional: scrollTo() clamps its
            // target against Lenis's cached `limit` (confirmed in node_modules/
            // lenis/dist/lenis.mjs — `target = clamp(0, target, this.limit)`),
            // and this can run before SmoothScroll's own resize has landed.
            // resize() here is synchronous and reads the DOM's current
            // (already-correct) state, so the clamp uses a fresh limit
            // regardless of whether SmoothScroll's own resync has fired yet.
            lenisInstance.resize();
            // `force: true` is load-bearing, not defensive padding: Lenis's own
            // scrollTo() no-ops entirely (`if ((this.isStopped || this.isLocked)
            // && !force) return;`, confirmed in lenis.mjs) while Lenis is
            // stopped, and LoadingScreen.tsx stops it for the duration of the
            // initial page load, only calling .start() once its own GSAP
            // timeline completes. That timeline runs on gsap.ticker (a
            // requestAnimationFrame loop), so on a slow connection where a
            // visitor reaches and clicks a WorkTeaser link before that timeline
            // has finished, this jump would otherwise be silently dropped,
            // leaving scroll stranded at the top (i.e. Lexora) with nothing to
            // correct it. Forcing through is correct here: LoadingScreen stops
            // Lenis to block a *visitor's* scroll input during the overlay, not
            // our own one-time programmatic positioning once the deep-linked
            // page has actually mounted.
            lenisInstance.scrollTo(targetY, { immediate: true, force: true });
          } else {
            window.scrollTo({ top: targetY, behavior: "auto" });
          }
        };

        jump();

        // Re-assert the jump — recomputing the target fresh each time, see
        // computeTargetY's own comment — every time GSAP's ScrollTrigger
        // finishes a refresh, for a window after mount. Two distinct things
        // both funnel through ScrollTrigger's "refresh" event, which is why
        // reacting to it (rather than only fixing one of them) covers both:
        //
        // 1. `ScrollTrigger.refresh()` (called by SmoothScroll.tsx's own
        //    staggered setTimeout(0/100/300) resync) unconditionally scrolls
        //    every scroller to 0 first to remeasure this page's stacked-card
        //    pins (`_scrollers.forEach(obj => obj(0))` in ScrollTrigger.js),
        //    then tries to restore whatever scroll position it recorded right
        //    before doing that (`obj.rec && obj(obj.rec)`) — a truthy check on
        //    the recorded value, so a refresh that began at exactly scrollY 0
        //    skips its own restore outright.
        // 2. SmoothScroll.tsx also runs a `ResizeObserver` on
        //    `document.documentElement` that debounces into its own
        //    `ScrollTrigger.refresh()` call — so as this page's rows finish
        //    loading their video/image content and grow, that resize reliably
        //    lands here too, which is what actually corrects the drift.
        //
        // Bounded to REASSERT_WINDOW_MS, not indefinite: once a real user
        // starts scrolling, that should never get silently overridden by a
        // late-arriving refresh.
        const reassert = () => {
          if (Math.round(window.scrollY) !== Math.round(computeTargetY())) jump();
        };
        ScrollTrigger.addEventListener("refresh", reassert);
        const stopListening = setTimeout(() => {
          ScrollTrigger.removeEventListener("refresh", reassert);
        }, REASSERT_WINDOW_MS);

        return () => {
          clearTimeout(stopListening);
          ScrollTrigger.removeEventListener("refresh", reassert);
        };
      }
    }
    // Was previously a plain `useEffect`, which — unlike this — runs *after*
    // the browser paints. That gap was a second, independent bug: React would
    // commit and paint one frame at the pre-jump scroll position (the top of
    // the page, i.e. Lexora, the first row) before this effect ever ran, then
    // jump afterward. Landing on Lexora itself never showed it (the target
    // *is* the top), which is exactly why the flash only ever showed on
    // every other project. useLayoutEffect runs synchronously before that
    // first paint, so the initial jump above is resolved before anything
    // reaches the screen.
    //
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
            // `relative` is load-bearing, not decorative: the stacked-cards pin
            // above sets the *outgoing* row to `position: fixed` (z-index auto).
            // Per CSS paint order, a positioned element always paints above a
            // plain `position: static` one regardless of DOM order — so without
            // this, every later project's row (still static) painted *behind*
            // any earlier row currently mid-pin, letting the frozen outgoing
            // card's content bleed through any transparent gap in the incoming
            // one (most visible in the sparse space around/between the
            // headline's animated words, worst on mobile where the headline
            // wraps to many more lines). Making every row `relative` puts them
            // all in the same "positioned" paint bucket as the pin, where
            // z-index is equal (auto) and DOM order is the tiebreaker — so a
            // later project's own opaque `bg-background` now correctly covers
            // an earlier, still-pinned one. Confirmed via computed-style
            // inspection: the pinned row measured `position: fixed` while the
            // next row measured `position: static`, exactly matching this rule.
            className="relative bg-background pb-[160px]"
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
