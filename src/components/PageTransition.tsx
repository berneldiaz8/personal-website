"use client";

import { useLayoutEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { holdPageReady, markPageReady, markPageVisible, notifyPageTransition } from "@/lib/pageReady";

/**
 * Dark-fade page transition: on client-side route navigation, an opaque
 * bg-neutral-950 curtain covers the *entire viewport* (a fixed inset-0
 * overlay, not scoped to this component's own DOM bounding box) over the
 * incoming page — already fully rendered underneath, no content-opacity
 * animation of its own. The curtain mounts fully opaque, HOLDs on solid
 * black, then FADEs to opacity 0, revealing the page — one tween with a
 * delay. Deliberately the same "dark curtain dissolve" mechanic
 * useMediaReveal.ts already uses for individual image/video slots on
 * /work, extended here with a hold up front — still the same
 * curtain-over-already-rendered-content idea, not a second,
 * differently-styled transition. Mounted via
 * template.tsx (see that file's own doc comment), which Next.js remounts
 * fresh on every route-segment navigation — the previous page's DOM is
 * torn down synchronously by React before this one mounts, so the hard cut
 * underneath the curtain is free, not something this component has to
 * engineer.
 *
 * The curtain is set to opacity 1 the instant it mounts, pre-paint via
 * `fromTo`'s default `immediateRender` (which applies the "from" state
 * right away even though the tween itself is delayed) — so the incoming
 * page never flashes before being covered. Reaching full black can't be
 * animated from anything lower: the outgoing page is already gone by the
 * time this mounts (see above), so any "fade to black" would only be
 * fading over the new page.
 *
 * `fixed inset-0`, not `absolute inset-0` on a `relative`-wrapped parent
 * (the first version of this pass) — `absolute` only covered this
 * component's own subtree, which on (site) routes is scoped to the routed
 * page content alone (template.tsx sits below layout.tsx's persistent
 * Nav/Footer), leaving Nav visible/uncovered during the transition. `fixed`
 * escapes that subtree and covers the whole screen instead, explicit
 * request. Safe against Lenis (SmoothScroll.tsx) hijacking `fixed`'s
 * containing block: this site runs Lenis in default mode with no
 * `wrapper`/`content` reparenting transform, so there's no transformed
 * ancestor between this overlay and the viewport. `z-[70]` clears Nav's own
 * `sticky z-50` (Nav.tsx) and CursorLabel's portal `z-[60]`, and stays below
 * GalleryCarousel's lightbox (`z-[100]`) and LoadingScreen (`z-[200]`) —
 * neither of which is ever mounted at the same time as a route transition
 * in practice, but the ordering is kept correct regardless.
 *
 * The single DURATION constant this replaced went through several rounds
 * of lengthening (0.6s -> 0.9s -> 1.2s -> 1.5s -> 2.0s, all explicit
 * requests) as one continuous ease-out dissolve with no hold — at longer
 * lengths that read as flickering rather than smooth, per explicit
 * follow-up feedback, since REVEAL_EASE's steep early drop made the curtain
 * fall away fast up front then trail off slowly, rather than holding
 * still. A three-phase inhale/hold/exhale timeline replaced it next, with
 * the inhale settling the curtain from 0.92 to 1 opacity — invisible in
 * practice, since the page underneath was already fully covered — so it was
 * collapsed into this single delayed tween (explicit request, 2026-09-30).
 * HOLD_DURATION started at 0.6s (the old inhale + hold combined) and was
 * cut to 0.2s once the fade out was added (explicit request, 2026-09-30),
 * since the fade out already adds its own time. The ease moved
 * from REVEAL_EASE to power2.inOut: REVEAL_EASE's steep early drop is
 * built for content entering, and on a full-screen opacity fade it made the
 * curtain fall away abruptly, then trail. HOLD_DURATION is the one to reach
 * for if the black needs to read more distinctly.
 *
 * Deliberately module-level state, not React state or context — same
 * pattern as pageReady.ts's own mutable binding, and for the same structural
 * reason: this needs to persist across template.tsx's own remounts (a fresh
 * component instance mounts on every client-side navigation, by design) to
 * answer "has *any* PageTransition mounted yet this session", which a
 * plain useState inside this very component can't do, since a fresh instance
 * has no memory of a previous one. Skipping the very first mount is
 * required, not optional: that first paint (hard refresh or a direct URL
 * load) is already owned by LoadingScreen.tsx's own overlay-fade plus each
 * page's RevealText/ShowcaseHeadline/useMediaReveal scroll reveals — dropping
 * a second dark curtain over that on top of LoadingScreen's own overlay
 * would double up, not compose with it. Reset to false only by an actual
 * hard reload, since it's plain module state, not persisted anywhere.
 */
let hasMountedBefore = false;

/**
 * The currently mounted page's curtain, so TransitionLink.tsx can fade it
 * *up* to black before navigating (the fade out). Once the curtain is black,
 * the navigation runs; the incoming page's own PageTransition then mounts
 * its curtain already at opacity 1 and plays the hold + fade in as usual,
 * so the handoff between the two curtains is invisible. Back/forward
 * navigations don't go through TransitionLink, so they still cut straight
 * to black and fade in.
 */
let activeOverlay: HTMLDivElement | null = null;

const FADE_OUT_DURATION = 0.3;
const HOLD_DURATION = 0.2;
const FADE_DURATION = 0.3;
// If the new page hasn't replaced this curtain by then (a failed or
// cancelled navigation), fade back in rather than leave the screen black.
const EXIT_FAILSAFE_MS = 4000;

export function fadeOutThenNavigate(navigate: () => void) {
  const overlay = activeOverlay;
  if (!overlay) {
    navigate();
    return;
  }
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    navigate();
    setTimeout(() => {
      if (activeOverlay !== overlay) return;
      gsap.to(overlay, { opacity: 0, duration: FADE_DURATION, ease: "power2.inOut", overwrite: true });
    }, EXIT_FAILSAFE_MS);
  };
  gsap.to(overlay, {
    opacity: 1,
    duration: FADE_OUT_DURATION,
    ease: "power2.inOut",
    overwrite: true,
    onComplete: go,
  });
  // GSAP runs on requestAnimationFrame, which the browser can pause (e.g. a
  // backgrounded tab) — never let a stalled tween swallow the click.
  setTimeout(go, FADE_OUT_DURATION * 1000 + 100);
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  // Captured once, on this instance's first render, via a lazy ref
  // initializer — must stay fixed for this instance's whole lifetime even
  // though the module flag itself flips to `true` moments later. Reading
  // `hasMountedBefore` directly inside the effect below instead would give
  // every instance the same (wrong, always-true-after-the-first) answer.
  // Only *reading* the module flag here — the write happens inside the
  // effect below, since mutating module state during render (impure) trips
  // React's own lint rule (react-hooks/globals).
  const isFirstMountEver = useRef<boolean | null>(null);
  // Holds every reveal on the incoming page (pageReady.ts) until the curtain
  // has fully faded in, so content starts animating on a visible page rather
  // than finishing half its animation behind the black. Has to happen here,
  // during render, not in the effect below: React runs children's effects
  // before their parent's, so by the time this component's own effect ran,
  // the page's RevealText/useMediaReveal instances would already have
  // subscribed to the old, already-resolved promise. Guarded by the same
  // once-per-instance lazy init, so a re-render never re-arms it. Released
  // via markPageReady() (whichever hold is current): the outgoing page's
  // fade-in tween can't release the incoming page's hold early, since
  // unmounting reverts (kills) it.
  if (isFirstMountEver.current === null) {
    isFirstMountEver.current = !hasMountedBefore;
    if (hasMountedBefore) holdPageReady();
  }

  useGSAP(
    () => {
      hasMountedBefore = true;
      const overlay = overlayRef.current;
      activeOverlay = overlay;
      const unregister = () => {
        if (activeOverlay === overlay) activeOverlay = null;
      };
      if (isFirstMountEver.current) return unregister;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          overlayRef.current,
          { opacity: 1 },
          {
            opacity: 0,
            delay: HOLD_DURATION,
            duration: FADE_DURATION,
            ease: "power2.inOut",
            onStart: markPageVisible,
            onComplete: markPageReady,
          },
        );
      });
      // The overlay's own JSX class defaults to opacity-0 (curtain already
      // gone), matching every other full-bypass reveal in this codebase —
      // this branch only has to let the page's reveals go straight away.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        markPageReady();
      });
      return () => {
        unregister();
        mm.revert();
      };
    },
    { scope: containerRef },
  );

  // Lets persistent chrome (Nav's entrance, MountReveal.tsx) replay its
  // reveal behind this curtain. A layout effect, so it fires in the same
  // commit the curtain goes black in — not alongside holdPageReady() during
  // render, when a back/forward navigation is still showing the old page.
  // Deliberately its own plain effect, *not* inside the useGSAP callback
  // above: GSAP files any context created or added to while another is
  // active as a child of that one, so listeners run from in there had their
  // whole GSAP context adopted by this component's — and reverted along with
  // it (StrictMode's dev double-effect, or this page unmounting), which
  // silently cancelled the nav's reveal. Declared after useGSAP so the
  // curtain is already set to black when it runs.
  useLayoutEffect(() => {
    if (!isFirstMountEver.current) notifyPageTransition();
  }, []);

  return (
    <div ref={containerRef}>
      {children}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[70] bg-neutral-950 opacity-0"
      />
    </div>
  );
}
