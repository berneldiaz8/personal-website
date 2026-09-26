"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink } from "./NavLink";
import { NavEntrance } from "./NavEntrance";
import { WordmarkLink } from "./WordmarkLink";
import { MobileMenu } from "./MobileMenu";
import { Grid } from "./showcase/Grid";
import { textStyles } from "@/lib/typography";

/**
 * Client component (was a server component before the mobile menu existed)
 * — it now owns the menu's open/close state, since that state has to reach
 * the Menu button, WordmarkLink, and MobileMenu, all of which live here.
 *
 * The matchMedia effect force-closes the menu the instant the viewport
 * crosses into `sm` (640px, Tailwind's default breakpoint — unmodified in
 * this project) — necessary since `isOpen`'s own UI (WordmarkLink/Menu
 * button going `invisible`, MobileMenu itself) has to stop applying the
 * instant the desktop Work/Info/Gallery/Contact row (sm:flex) becomes
 * visible instead.
 *
 * MobileMenu.tsx renders its own wordmark + Close row at the top of the
 * black panel (explicit request — an earlier version had this header
 * recolor via `data-force-dark` instead of MobileMenu owning its own copy,
 * which wasn't a reliable enough way to guarantee that row reads correctly).
 * That means this header's own wordmark/Menu button must get out of the way
 * while open, not recolor to match — both go `invisible` (not `hidden` —
 * keeps their grid slots so nothing reflows, and keeps the Menu button a
 * valid, eventually-refocusable target for `returnFocusRef`); `invisible`
 * elements aren't part of the tab order or the accessibility tree, so
 * there's no double wordmark/Close control competing with MobileMenu's own.
 *
 * **Header background stays `bg-background` unconditionally, always
 * (2026-09-26 fix)** — an earlier version made it `bg-transparent` while
 * `isOpen`, reasoning that MobileMenu's own panel (`fixed inset-0`, same
 * top:0 origin) would already be there underneath to show through. Two real
 * bugs came from that assumption: (1) MobileMenu's own close isn't instant —
 * it stays mounted and visible for its full retraction tween after `isOpen`
 * already goes false, so an opaque-on-`isOpen` background snapped back
 * *before* the panel had actually finished closing, flickering on top of it
 * (in a later commit this got patched with an `onRenderedChange` callback
 * lagging the header's toggle behind MobileMenu's real mounted state — that
 * patch was reverted per explicit request in favor of this simpler fix,
 * which removes the underlying race instead of resolving it). (2) Symmetric
 * bug on *open*: MobileMenu's own black curtain is a `clipPath` tween
 * growing down from the top over `OPEN_DURATION` (not an instant reveal) —
 * making the header transparent the instant `isOpen` flips true, before that
 * curtain has visually grown to cover the header's own strip, exposed
 * whatever real page content was scrolled just underneath the header (a
 * confirmed real-device report: a page's own H1 text visibly bled through,
 * overlapping this header's wordmark, for the first fraction of a second of
 * every open). Keeping the header's own `bg-background` fixed sidesteps both
 * — MobileMenu is a `fixed`, `z-40` *child* of this `<header>` (`z-50`), and
 * a positioned descendant with an explicit z-index always paints above this
 * header's own non-positioned Grid content regardless of that header/panel
 * z-index comparison (that comparison only governs stacking against this
 * header's own *siblings* elsewhere on the page, e.g. Footer) — confirmed
 * directly via `document.elementFromPoint` at the wordmark's own coordinates
 * mid-open, which already resolved to MobileMenu's panel. So the growing
 * curtain still naturally paints over this header's plain (now permanently
 * opaque) strip as it grows, with the header's own opaque background as a
 * safe, unchanging floor underneath it the whole time — nothing behind the
 * header can ever show through, on open or close, since there's no
 * transparency window left to race against the animation at all.
 */
export function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  // Stable identity across renders (empty deps — setIsOpen is guaranteed
  // stable by React) — MobileMenu.tsx's focus-trap effect depends on this,
  // and a fresh inline arrow function here on every Nav render would make
  // that effect tear down and re-run (stealing/re-stealing focus) on every
  // Nav re-render while the menu is open, not just on an actual open/close.
  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background">
      <Grid className="items-center py-5">
        {/* NavEntrance is a display:contents wrapper (see that file) so these
            three stay direct Grid children for col-span placement — it only
            exists to scope the mount-time slide-up on the wordmark and
            Work/Info/Gallery/Contact. */}
        <NavEntrance>
          <WordmarkLink invisible={isOpen} />

          {/* Desktop/tablet only now (hidden sm:flex) — mobile gets the MENU
              button + MobileMenu overlay below instead of this wrapped row.
              Aligned to the same column body copy starts at (see
              ParagraphPair's lg:col-start-7 in ProjectShowcase.tsx). Gallery
              lives permanently in this group now (beside Info). */}
          <nav
            className={`col-span-2 col-start-3 hidden flex-wrap items-center gap-x-2 gap-y-0.5 sm:col-span-2 sm:col-start-5 sm:flex lg:col-span-3 lg:col-start-7 ${textStyles.eyebrowPrimary}`}
          >
            <NavLink href="/work" size="md">
              Work,
            </NavLink>
            <NavLink href="/info" size="md">
              Info,
            </NavLink>
            <NavLink href="/gallery" size="md">
              Gallery
            </NavLink>
          </nav>

          {/* Contact alone, in the slot that used to hold the old clock and
              then Gallery — right-aligned the same way the clock was (flush
              with the grid's right edge). Hidden on mobile since it already
              appears in the group above there. */}
          <div
            className={`hidden sm:col-span-2 sm:col-start-7 sm:flex sm:justify-end lg:col-span-3 lg:col-start-10 ${textStyles.eyebrowPrimary}`}
          >
            <NavLink href="mailto:diaz.bernel@gmail.com" size="md">
              Contact
            </NavLink>
          </div>

          {/* Mobile only — replaces the old wrapped Work/Info/Gallery/Contact
              row. Only ever shows "Menu" — MobileMenu.tsx's own Close button
              is what's visible/interactive while open, this one fades to
              `invisible` then (see the file doc comment above and
              WordmarkLink.tsx's own comment on the same transition — same
              duration/easing, so both fade together). Text is plain-case;
              `uppercase` in eyebrowPrimary handles the visual casing,
              matching how NavLink's own children are written elsewhere in
              this file. */}
          <button
            type="button"
            ref={toggleButtonRef}
            aria-expanded={isOpen}
            aria-controls="mobile-menu-panel"
            onClick={() => setIsOpen(true)}
            className={`col-span-2 col-start-3 justify-self-end transition-[opacity,visibility] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:hidden ${isOpen ? "invisible opacity-0" : "visible opacity-100"} ${textStyles.eyebrowPrimary}`}
          >
            Menu
          </button>
        </NavEntrance>
      </Grid>

      <MobileMenu isOpen={isOpen} onClose={handleClose} returnFocusRef={toggleButtonRef} id="mobile-menu-panel" />
    </header>
  );
}
