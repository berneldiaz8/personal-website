"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * The live Lenis instance, exposed as a module-level live binding (not React
 * Context — this is read from exactly one other place, WorkBrowser.tsx's
 * `?open={slug}` deep-link scroll, not worth the boilerplate) so other client
 * components can drive scroll through Lenis's own `scrollTo()` API instead of the
 * native `element.scrollIntoView()`. This distinction is load-bearing, not a style
 * preference: native `scrollIntoView` changes `window.scrollY` directly, which
 * Lenis doesn't treat as authoritative — it keeps driving `animatedScroll` toward
 * its own last-known `targetScroll` on every tick. Confirmed empirically that this
 * silently no-ops `scrollIntoView` once /work's own ScrollTrigger instances (see
 * WorkBrowser.tsx's stacked-cards pin setup) exist (their creation appears to
 * trigger a GSAP-internal scroll
 * measurement that races with and wins over the native scrollIntoView call) —
 * `lenis.scrollTo(element)` instead updates Lenis's own `targetScroll`, so there's
 * no second, competing source of truth for scroll position.
 */
export let lenisInstance: Lenis | null = null;

/**
 * Non-rendering — mounts Lenis (smooth/inertia scroll) and wires it to GSAP's ticker
 * so ScrollTrigger-driven animations (RevealWipe.tsx) stay in sync with the smoothed
 * scroll position instead of native scroll events. Standard GSAP+Lenis pairing:
 * Lenis drives off gsap.ticker (one shared clock) rather than its own rAF loop, and
 * every Lenis scroll tick notifies ScrollTrigger.
 *
 * Deliberately default-mode Lenis — no `wrapper`/`content` options. That keeps it
 * smoothing *native* window scroll (still real scrollY/scrollTo) rather than
 * reparenting the page into a transformed wrapper the way GSAP's own ScrollSmoother
 * does by default. That's specifically why it's expected to coexist with Footer.tsx's
 * `position: sticky` reveal and Nav.tsx's `sticky top-0` without restructuring the
 * DOM — verify this empirically before assuming it, don't just trust the theory.
 *
 * No `prefers-reduced-motion` awareness is built into Lenis, so it's gated here:
 * reduced motion means no Lenis instance at all (full bypass, native scroll), not a
 * shortened/dampened one — matching every other animation in this codebase.
 *
 * Also wires Lenis's max-scroll `limit` to ScrollTrigger's own refresh cycle
 * (`ScrollTrigger.addEventListener("refresh", () => lenis.resize())`) and to a
 * `ResizeObserver` on `document.documentElement`. This is the fix for the most
 * commonly reported Lenis+ScrollTrigger bug — the page reporting "stuck, can't
 * scroll past a point" — which happens when Lenis's cached scroll limit goes stale
 * relative to the document's actual height.
 *
 * Confirmed this exact failure mode empirically, twice: first as a client-side
 * `<Link>` navigation from `/` to `/work` leaving scroll permanently stuck ~60px
 * in; then, after adding the ResizeObserver above (which alone wasn't enough),
 * stuck again at exactly `/`'s own max-scroll value (1949px) despite
 * `document.documentElement.scrollHeight` correctly reporting `/work`'s real,
 * much taller height by the time it was checked. Root cause, confirmed via
 * Lenis's own source (`node_modules/lenis/dist/lenis.mjs`): this component
 * mounts once at the root layout and never remounts across client-side route
 * changes (by design — Lenis shouldn't reset on every navigation), so the *same*
 * Lenis instance and its internal `Dimensions` class carry over from the
 * previous route. `Dimensions` does have its own built-in `ResizeObserver` on
 * `content` (defaults to `document.documentElement`, same node either way), but
 * it's internally debounced 250ms — this is a documented, known-flaky
 * interaction between Lenis and Next.js App Router specifically (see
 * darkroomengineering/lenis issues #319, #244, #170), not something either
 * library is "wrong" about in isolation.
 *
 * The fix the Lenis/Next.js community actually converged on — and the one that
 * closed the repro here — is to stop relying on resize *detection* for route
 * changes specifically and instead explicitly resync on every `pathname` change
 * via `usePathname()`, since a known navigation event is a strictly more
 * reliable signal than waiting for a debounced observer to notice. Staggered at
 * 0/100/300ms rather than a single call: new route content (this site's many
 * `ProjectShowcase`/`RevealWipe` instances) doesn't necessarily finish mounting
 * in the same tick the pathname updates, and unlike a single rAF (tried first,
 * insufficient), several cheap staggered attempts don't require guessing the
 * exact right moment.
 */
export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis();
    lenisRef.current = lenis;
    lenisInstance = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener("refresh", onRefresh);

    let debounce: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(() => ScrollTrigger.refresh(), 100);
    });
    resizeObserver.observe(document.documentElement);

    return () => {
      clearTimeout(debounce);
      resizeObserver.disconnect();
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      lenisInstance = null;
    };
  }, []);

  useLayoutEffect(() => {
    // Reset scroll to the top on every route change. Lenis keeps its own
    // internal scroll position across client-side navigations (deliberate —
    // this component never remounts on route change, see the mount effect
    // above), so without this it stays wherever the *previous* page was
    // scrolled to. If the new page is shorter than that old position, Lenis
    // clamps it to the new page's own max scroll, landing on the footer
    // instead of the top — confirmed as the exact bug reported (e.g.
    // scrolling deep into a taller page, then navigating to /info, a much
    // shorter one). Native `window.scrollTo` covers the reduced-motion case
    // (no Lenis instance); `lenis.scrollTo` is also needed when Lenis is
    // active, or it fights back toward its own stale target on the next
    // tick.
    //
    // Must be `useLayoutEffect`, not `useEffect` — this was the actual bug
    // behind a second, distinct symptom reported later (a split-second
    // flash of the still-mounted, always-sticky Footer during navigation,
    // worst when leaving a page scrolled deep into the footer). A plain
    // `useEffect` is a *passive* effect: it's scheduled after the browser
    // has already committed and painted the new route's DOM, not before —
    // "not wrapped in setTimeout" is not the same as "before paint". In
    // that gap, `<main>` has already swapped to the new (often near-empty,
    // pre-hydration) page content while `scrollY` is still wherever the old
    // page left it; if that leftover scrollY exceeds the new, collapsed
    // document height, the browser auto-clamps scroll to fit, which can
    // land squarely on the still-`sticky`, still-100dvh-tall Footer,
    // painting it full-screen for a frame before this effect ever runs.
    // `useLayoutEffect` runs synchronously after DOM mutations but *before*
    // the browser paints, closing that window entirely. This fires before
    // WorkBrowser's own `?open={slug}` deep-link scroll (SmoothScroll sits
    // before `<main>` in layout.tsx, so its effects commit first), which is
    // the correct order — the deep link's own scroll then overrides this
    // top position on purpose.
    window.scrollTo(0, 0);
    lenisRef.current?.scrollTo(0, { immediate: true });

    const timers = [0, 100, 300].map((delay) =>
      setTimeout(() => {
        lenisRef.current?.resize();
        ScrollTrigger.refresh();
      }, delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [pathname]);

  return null;
}
