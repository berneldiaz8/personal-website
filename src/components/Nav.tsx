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
 * both this <header>'s own transparent-background toggle (see below) and
 * the Menu button, and both live here.
 *
 * The matchMedia effect force-closes the menu the instant the viewport
 * crosses into `sm` (640px, Tailwind's default breakpoint — unmodified in
 * this project). This is what makes it safe to make the header's own
 * background transparent whenever `isOpen` (see below) without needing to
 * reason about the desktop Work/Info/Gallery/Contact row (sm:flex, only
 * visible at that width) ever being affected by it — `isOpen` is
 * structurally impossible to be true at a width where those links are
 * visible.
 *
 * MobileMenu.tsx renders its own wordmark + Close row at the top of the
 * black panel (explicit request — the header's own data-force-dark
 * recoloring trick wasn't a reliable enough way to guarantee that row reads
 * correctly, so the panel now owns it outright as real content instead of
 * leaning on a cross-component z-index/color seam). That means this
 * header's own visible content must get out of the way while open, not
 * recolor to match: its background goes transparent (revealing the panel's
 * own black underneath, since the panel is `fixed inset-0` starting at the
 * same top:0 point) and its toggle button goes `invisible` (not `hidden` —
 * keeps its grid slot/layout so nothing reflows, and keeps it a valid,
 * eventually-refocusable target for `returnFocusRef`). The button still
 * exists in the DOM and keeps its ref the whole time; `invisible` elements
 * aren't part of the tab order or the accessibility tree, so there's no
 * double "Close" control competing with MobileMenu's own.
 *
 * The header/button's transparent-vs-opaque styling below reads
 * `menuVisuallyOpen`, not `isOpen` directly (explicit bug report,
 * 2026-09-25, "flickering... when opening/closing" — see MobileMenu.tsx's
 * own "Nav.tsx flicker fix" comment for the full root cause: `isOpen` flips
 * the instant Close is tapped, but MobileMenu's own panel stays visible for
 * its whole close-tween duration afterward, so this header's opaque
 * background used to snap back on top of it mid-retraction). MobileMenu
 * reports its real visual state back up via `onRenderedChange` instead, so
 * this only reverts once the panel has actually finished closing.
 */
export function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  // Lags `isOpen` on close — see the file doc comment above. Starts equal to
  // `isOpen` (both false) since MobileMenu reports its own initial
  // `rendered` value (also false) the moment it mounts.
  const [menuVisuallyOpen, setMenuVisuallyOpen] = useState(false);
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
    <header className={`sticky top-0 z-50 ${menuVisuallyOpen ? "bg-transparent" : "bg-background"}`}>
      <Grid className="items-center py-5">
        {/* NavEntrance is a display:contents wrapper (see that file) so these
            three stay direct Grid children for col-span placement — it only
            exists to scope the mount-time slide-up on the wordmark and
            Work/Info/Gallery/Contact. */}
        <NavEntrance>
          <WordmarkLink />

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
              is what's visible/interactive while open, this one goes
              `invisible` then (see the file doc comment above). Text is
              plain-case; `uppercase` in eyebrowPrimary handles the visual
              casing, matching how NavLink's own children are written
              elsewhere in this file. */}
          <button
            type="button"
            ref={toggleButtonRef}
            aria-expanded={isOpen}
            aria-controls="mobile-menu-panel"
            onClick={() => setIsOpen(true)}
            className={`col-span-2 col-start-3 justify-self-end sm:hidden ${menuVisuallyOpen ? "invisible" : ""} ${textStyles.eyebrowPrimary}`}
          >
            Menu
          </button>
        </NavEntrance>
      </Grid>

      <MobileMenu
        isOpen={isOpen}
        onClose={handleClose}
        returnFocusRef={toggleButtonRef}
        id="mobile-menu-panel"
        onRenderedChange={setMenuVisuallyOpen}
      />
    </header>
  );
}
