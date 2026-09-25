"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { RevealText } from "./RevealText";
import { Logo } from "./Logo";
import { lenisInstance } from "./SmoothScroll";
import { REVEAL_EASE } from "@/lib/gsapEase";
import { textStyles } from "@/lib/typography";

gsap.registerPlugin(SplitText);

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/info", label: "Info" },
  { href: "/gallery", label: "Gallery" },
];

const CLIP_HIDDEN = "inset(0% 0% 100% 0%)";
const CLIP_VISIBLE = "inset(0% 0% 0% 0%)";
// REVEAL_EASE (the site's shared premium curve, gsapEase.ts) is an out-curve
// close to expo.out — nearly all its visual motion front-loads into roughly
// the first third of the duration, then trails off almost imperceptibly, so
// lengthening duration alone just stretches that imperceptible tail rather
// than making the reveal itself read as slower. Switched the open tween's
// own ease to "power2.inOut" instead (below, at the call site — REVEAL_EASE
// stays the shared default everywhere else): motion is spread smoothly
// across the whole duration, easing in from a stop and back out to one,
// which is what actually reads as "fluid" for a wipe covering the full
// viewport height, rather than snapping open early and coasting. Applied to
// OPEN only, not CLOSE_DURATION below — closing should still feel brisk,
// per this file's established open-slower/close-quicker asymmetry. Went
// through several values (explicit requests, 2026-09-24: 0.35s -> 0.6s ->
// 0.75s -> 0.9s -> 0.85s -> 0.75s) — still comfortably ahead of
// CLOSE_DURATION so that asymmetry holds.
const OPEN_DURATION = 0.75;
// Went through several values (explicit requests, 2026-09-24: 0.3s -> 0.45s
// -> 0.55s -> 0.6s -> 0.5s) — still under OPEN_DURATION so the
// open-slower/close-quicker asymmetry holds.
const CLOSE_DURATION = 0.5;
// Went through several values before settling here (explicit requests,
// 2026-09-24: OPEN_DURATION itself -> 0.6s -> 0.75s -> 0.65s -> 0.5s ->
// 0.55s) — still slightly before OPEN_DURATION's own curtain finishes, so
// the two stages overlap a little rather than running fully sequentially.
// Both the four links (below) and Contact's own reveal (see the useGSAP
// block) reference this same constant, so they stay in sync with each
// other.
const LINK_BASE_DELAY = 0.55;

/**
 * Full-viewport mobile nav overlay, opened via Nav.tsx's Menu toggle.
 * Modeled on a user-supplied Figma reference for the layout (solid black
 * panel with its own wordmark + Close row at the top, large stacked
 * HOME/WORK/INFO/GALLERY links, a Contact/email block at the bottom) and a
 * user-supplied screen recording for the open/close motion itself
 * (Recordings/menu.mov) — frame-by-frame extraction showed the black area
 * growing down from the top on open (covering the full screen in ~0.33s)
 * and, on close, visibly *retracting back up from the bottom* — a genuine
 * mirror of the open motion, not a flat fade. Both directions leave
 * whatever text is still covered fully undistorted throughout, which rules
 * out a scale transform (scaling would visibly squash/stretch text as it
 * shrinks) and points to a clip/mask reveal instead — reproduced here via a
 * single `clipPath` tween (`inset(0% 0% 100% 0%)` fully hidden <->
 * `inset(0% 0% 0% 0%)` fully shown) on `revealRef`, run forward on open and
 * reversed (a fresh tween back to the hidden value, not GSAP's `.reverse()`
 * method) on close. Individual links still separately use RevealText for
 * their own per-line mask-slide (visible in the recording as e.g. "WORKS"
 * or "STUDIO" caught mid-reveal, cut off — the same signature RevealText's
 * own SplitText masking already produces), layered on top of this panel-
 * level reveal, not replacing it.
 *
 * The wordmark + Close row lives here, as real panel content, rather than
 * leaning on Nav.tsx's own header row recoloring above this (an earlier
 * version tried exactly that — data-force-dark on the whole <header> — but
 * wasn't a reliable enough way to guarantee that row actually reads
 * correctly; explicit follow-up request to just put it in the panel
 * directly). Nav.tsx's own toggle button still exists and still owns
 * opening the menu (and is still what focus returns to on close, via
 * `returnFocusRef`), it just goes `invisible` while this is open — see that
 * file's own comment.
 *
 * Two-layer DOM inside `revealRef` (curtain, then content) rather than
 * one — both need to sit inside the same clipped element, but the content
 * layer needs `relative z-10` on top of the curtain's plain
 * `absolute inset-0` background: an absolutely-positioned sibling at
 * z-index:auto still paints above plain static content regardless of DOM
 * order, so without it the curtain would silently cover the text
 * underneath (this part is unchanged from the scaleY version — only the
 * mechanism controlling `revealRef`'s own visibility changed).
 *
 * `data-force-dark` lives on the outer panel div (the common ancestor of
 * `revealRef`'s curtain and content layers), not on the curtain alone — it
 * was on the curtain alone in an earlier version, which was a real bug:
 * CSS custom properties only cascade through actual DOM ancestry, and the
 * content layer is the curtain's *sibling*, not its descendant, so every
 * `text-foreground` element in the content layer (the links, the wordmark,
 * the Close button, the Contact email) was resolving against the page's
 * light-theme `--foreground: #000000` instead of the forced-dark palette —
 * black text on the curtain's black background, invisible. Only the
 * "Contact" label was ever visible, because it uses `text-muted`
 * (`#66625c` in the light palette, still legible on black), not
 * `text-foreground`. Root-caused from a real screenshot showing exactly
 * that split (label visible, everything else missing). Putting
 * `data-force-dark` on the shared ancestor instead fixes both layers at
 * once and is the same pattern this codebase already uses everywhere else
 * it needs a forced-dark scope (LoadingScreen.tsx, `/gallery`).
 *
 * z-40, one below Nav's own z-50 — deliberately not matching or padding
 * around Nav's rendered height (which Footer.tsx's own comment documents
 * has already drifted once before, 56px -> 60px, when a NavLink size
 * changed). Since Nav's header goes `bg-transparent` while open, its own
 * strip simply reveals this panel underneath rather than needing to know
 * anything about this component's layout.
 *
 * Mount/unmount timing mirrors LoadingScreen.tsx's own `visible` pattern,
 * adapted to this component being driven by an external `isOpen` prop rather
 * than owning its open trigger directly: `rendered = isOpen || closing`
 * gates whether the dialog markup exists in the DOM at all, so the close
 * clip-path tween can finish playing before the panel actually unmounts.
 * `closing` is set to `true` during render (React's documented "adjusting
 * state when a prop changes" pattern — comparing `isOpen` against a
 * `prevIsOpen` state snapshot, guarded so it only fires on an actual
 * transition), not inside a `useEffect` body, since the lint rule this
 * codebase enforces (`react-hooks/set-state-in-effect`) flags a synchronous
 * `setState` call in an effect as a cascading-render risk. The close
 * animation's own effect below only ever sets state from its GSAP
 * `onComplete` callback — an async, event-like callback firing after the
 * effect itself has already returned, which is the pattern React's own
 * guidance explicitly endorses.
 *
 * Nav links are `<Link href>` wrapping `<RevealText as="div">`, not the
 * reverse and not RevealText's own `as="a"` variant. `as="a"` renders a
 * plain anchor with no Next.js client-side routing. Nesting an `<a>` *inside*
 * the text RevealText/SplitText splits is the specific pattern RevealText's
 * own doc comment warns is broken (SplitText sweeps the nested element into
 * an aria-hidden mask, silently dropping it from the accessibility tree,
 * confirmed as a real past bug elsewhere in this codebase). Here the <a> is
 * the ancestor instead, outside anything SplitText touches — SplitText only
 * ever sees the inner div's own text nodes and puts its compensating
 * aria-label there, and the outer <a>'s accessible name resolves through
 * that labeled child per the standard accessible-name-from-content
 * algorithm (the same mechanism that makes
 * `<button><span aria-label="Close">×</span></button>` accessible). Verified
 * via a real accessibility-tree snapshot once built, matching this
 * codebase's own established practice of confirming every SplitText +
 * semantics interaction empirically rather than trusting it blind.
 *
 * The Contact/email block originally deliberately did NOT use RevealText —
 * it reused Footer.tsx/GalleryInfoRow.tsx's own established convention
 * (uppercase muted label + NavLink), since the initial request was scoped
 * to "the navlinks" (the four big links above it). RevealText was later
 * requested here too, first tried via the literal `RevealText` component
 * (matching the `Link > RevealText as="div"` pattern the four links above
 * use) — that reveal never played, a real bug: RevealText's line-mask tween
 * is gated behind a GSAP ScrollTrigger at `start: "top 85%"` (see that
 * file's own comment on above-the-fold instances "already past" that line
 * at creation), and this block sits `mt-auto`-pinned near the very bottom of
 * a `fixed inset-0` panel — below the 85% line on every viewport height this
 * was checked against, not just this one. ScrollTrigger only "enters" that
 * state by the window actually scrolling past the computed threshold, but
 * this panel locks scrolling for its entire open duration (Lenis
 * `.stop()` + wheel/touchmove `preventDefault`, see the scroll-lock effect
 * below) — so the tween's trigger condition can never become true and the
 * text stays permanently masked at `opacity:0`. Confirmed live: the split
 * `.reveal-line` spans sat at `opacity:0`/un-translated indefinitely with no
 * console error, since ScrollTrigger fails silently when its condition is
 * simply never met rather than throwing.
 *
 * Fixed by reproducing RevealText's own line-mask recipe directly
 * (SplitText `type:"lines"`/`mask:"lines"`/`linesClass:"reveal-line"` —
 * same `.reveal-line-mask` CSS in globals.css, which isn't scoped to the
 * RevealText component itself) but driven by a plain `gsap.to` alongside
 * the panel's own open tween below, instead of a ScrollTrigger — this
 * content is inside a `fixed inset-0` overlay that's either fully visible or
 * fully unmounted, never scrolled into view, so gating its
 * reveal on scroll position was never the right mechanism to begin with.
 * NavLink's own hover-swap span pair was dropped for this call site (a
 * plain `Link` wraps the split target `<div>` instead) for the same reason
 * RevealText's own doc comment warns against nesting an anchor *inside*
 * split text — here the anchor is the ancestor, which is the safe
 * direction.
 *
 * Focus trap cycles real Tab order (this panel's own Close button, then the
 * 4 nav links, then the Contact email link — all real focusable elements
 * inside `panelRef`, queried directly rather than assembled from refs on
 * every individual link) rather than GalleryCarousel's GalleryLightbox
 * shortcut of forcing every Tab back to the dialog — that shortcut exists
 * there because the lightbox has nothing to tab through; this menu does.
 * `returnFocusRef` (Nav.tsx's toggle button) is used only to restore focus
 * on close, mirroring GalleryLightbox's exact `trigger`/cleanup pattern —
 * it's not part of the open-state tab cycle, since it's `invisible` (and
 * therefore untabbable) the whole time this is open.
 *
 * Scroll lock is LoadingScreen.tsx's own lenisInstance.stop()/.start() +
 * wheel/touchmove preventDefault recipe, verbatim, in a plain useEffect
 * (not inside useGSAP's useLayoutEffect-based one — SmoothScroll.tsx's own
 * effect that assigns the module-level lenisInstance binding must run
 * first, and plain effects run after layout effects; reading it too early
 * was a real, already-documented bug elsewhere in this codebase). Doesn't
 * touch `overflow` on <html> for the same reason LoadingScreen.tsx doesn't —
 * it would fight globals.css's `html { overflow-y: scroll }` rule and cause
 * a layout shift right as the lock engages/releases.
 */
export function MobileMenu({
  isOpen,
  onClose,
  returnFocusRef,
  id,
}: {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  id: string;
}) {
  const [closing, setClosing] = useState(false);
  const rendered = isOpen || closing;
  const panelRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const contactLabelRef = useRef<HTMLDivElement>(null);
  const contactEmailRef = useRef<HTMLDivElement>(null);

  // Render-time derived-state transition (see the file doc comment above) —
  // React's own documented "adjusting state when a prop changes" pattern:
  // tracking the previous value in state (not a ref — this codebase's
  // react-hooks/refs lint rule forbids reading/writing ref.current during
  // render, even for this exact comparison), and calling `setState` directly
  // in the render body, guarded so it only fires on an actual transition.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) setClosing(true);
  }

  useEffect(() => {
    if (!closing) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(revealRef.current, {
        clipPath: CLIP_HIDDEN,
        duration: CLOSE_DURATION,
        ease: REVEAL_EASE,
        onComplete: () => setClosing(false),
      });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      setClosing(false);
    });
    return () => mm.revert();
  }, [closing]);

  useGSAP(
    () => {
      if (!rendered) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          revealRef.current,
          { clipPath: CLIP_HIDDEN },
          { clipPath: CLIP_VISIBLE, duration: OPEN_DURATION, ease: "power2.inOut" },
        );

        // Contact's own line-mask reveal — see the file doc comment above
        // for why this can't just be a <RevealText> like the four links:
        // ScrollTrigger's "top 85%" gate can never fire for this
        // mt-auto-pinned, near-bottom block while the panel's scroll lock
        // is active, so it's driven by a plain tween instead — delayed by
        // LINK_BASE_DELAY, same as the four links below, so both stages
        // stay in sync with each other and start once the curtain itself
        // has finished opening (see that constant's own comment).
        const contactTargets = [contactLabelRef.current, contactEmailRef.current].filter(
          (el): el is HTMLDivElement => el !== null,
        );
        if (contactTargets.length) {
          SplitText.create(contactTargets, {
            type: "lines",
            mask: "lines",
            linesClass: "reveal-line",
            onSplit(self) {
              gsap.set(self.lines, { yPercent: 110, opacity: 0 });
              gsap.to(self.lines, {
                yPercent: 0,
                opacity: 1,
                duration: 0.9,
                delay: LINK_BASE_DELAY,
                ease: REVEAL_EASE,
              });
            },
          });
        }
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(revealRef.current, { clipPath: CLIP_VISIBLE });
      });
      return () => mm.revert();
    },
    { scope: panelRef, dependencies: [rendered] },
  );

  useEffect(() => {
    if (!rendered) return;
    // Captured once per open, mirroring GalleryLightbox's own
    // trigger/cleanup pattern — restoring focus here (not via a dependency
    // array re-read) is what makes it safe even though Nav's real toggle
    // button is `invisible` (and so un-focusable) for the entire time this
    // effect is active; by the time cleanup runs, `isOpen` has already gone
    // false and the button is visible again (see Nav.tsx's own comment).
    const trigger = returnFocusRef.current;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button");
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [rendered, onClose, returnFocusRef]);

  useEffect(() => {
    if (!isOpen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    lenisInstance?.stop();
    const preventScroll = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      lenisInstance?.start();
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
    };
  }, [isOpen]);

  if (!rendered) return null;

  return (
    // `h-dvh` alongside `inset-0` (explicit request, 2026-09-25, after a
    // user-supplied real-device screen recording — Recordings/
    // ScreenRecording_09-24-2026 13-11-37_1.mp4) — root-caused via
    // frame-by-frame extraction: the panel opened and closed correctly the
    // first time, but on a second open, partway through (while `isOpen`
    // stayed true the whole time — the panel never actually closed and
    // reopened), a gap of real page content appeared bleeding through below
    // the black area, cutting Contact off entirely, and the frame right
    // before it showed Safari's own address bar visibly collapse to its
    // compact state (freeing up extra viewport height). `inset-0` alone
    // gives this fixed panel its height implicitly via `top:0`/`bottom:0`
    // both resolving to 0 against the viewport — the classic iOS Safari bug
    // this hits is that a `position:fixed` element's *implicit* height from
    // top+bottom doesn't reliably re-resolve live as the dynamic toolbar
    // animates (particularly while scroll is locked, which this panel does
    // the whole time it's open — see the scroll-lock effect above), so the
    // panel kept the shorter height computed while the toolbar was still
    // expanded even after the toolbar shrank and the real viewport grew.
    // `h-dvh` sets an *explicit* height in dynamic-viewport-height units,
    // which browsers specifically keep live-updated against the toolbar's
    // current state — CSS's abs-pos rules make an explicit `height` win over
    // `inset-0`'s `bottom:0` when both are present, so this doesn't fight
    // the existing `inset-0` positioning, it just makes the height track
    // correctly. Same `h-dvh` pattern gallery/page.tsx already uses for its
    // own single-viewport, no-overflow layout.
    <div
      ref={panelRef}
      data-force-dark
      role="dialog"
      aria-modal="true"
      id={id}
      tabIndex={-1}
      className="fixed inset-0 z-40 h-dvh focus:outline-none"
    >
      {/* clip-path default (pre-JS) is fully hidden — same reasoning as
          every other overlay in this codebase that must not flash visible
          before its own reveal effect runs: the resting CSS state already
          matches what the animation starts from. */}
      <div ref={revealRef} className="absolute inset-0 [clip-path:inset(0%_0%_100%_0%)]">
        <div aria-hidden="true" className="absolute inset-0 bg-background" />
        <div className="relative z-10 flex h-full flex-col px-4 pb-5">
          {/* Own wordmark + Close row — real panel content, not a reflection
              of Nav's header above (see the file doc comment). Plain <Link>
              + <Logo> rather than the shared WordmarkLink component: that
              component's onClick only handles the same-page smooth-scroll
              case, not closing this menu, and duplicating/extending it for
              one call site wasn't worth it — this is a plain home link,
              closing the menu is the only behavior it needs beyond that. */}
          <div className="flex items-center justify-between pt-5">
            <Link href="/" aria-label="berneldiaz, home" onClick={onClose} className="block h-[16px] w-fit">
              <Logo className="h-[16px] w-auto text-foreground" aria-hidden="true" />
            </Link>
            <button type="button" ref={closeButtonRef} onClick={onClose} className={textStyles.eyebrowPrimary}>
              Close
            </button>
          </div>

          <nav data-tight-reveal-mask className="flex flex-1 flex-col items-start justify-center gap-1">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={onClose}>
                <RevealText
                  as="div"
                  delay={LINK_BASE_DELAY}
                  className="text-[40px] font-medium uppercase leading-[1] tracking-[-0.5px] text-foreground"
                >
                  {link.label}
                </RevealText>
              </Link>
            ))}
          </nav>

          <div
            data-tight-reveal-mask
            className="mt-auto flex flex-col items-start gap-1 text-sm font-medium text-foreground"
          >
            <div ref={contactLabelRef} className="font-medium uppercase text-muted">
              Contact
            </div>
            <Link href="mailto:diaz.bernel@gmail.com" onClick={onClose}>
              <div ref={contactEmailRef} className="font-medium text-foreground">
                diaz.bernel@gmail.com
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
