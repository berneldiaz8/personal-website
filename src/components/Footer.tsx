import { FooterWordmark } from "./FooterWordmark";
import { NavLink } from "./NavLink";
import { Grid } from "./showcase/Grid";

export function Footer() {
  return (
    <footer className="sticky top-0 flex h-[100dvh] flex-col justify-between bg-background text-muted">
      {/* mt-[54px] clears Nav's own rendered height (54px — changed again
          after the clock was removed and Contact took its slot, re-measured
          empirically rather than assumed; an arbitrary value since 54px falls
          between Tailwind's default spacing steps) — both this row and the
          nav are `sticky top-0`, so once the footer is fully stuck the nav
          (z-50) sits directly on top of it. */}
      <div className="mt-[54px]">
        {/* Separator is inset to match the Grid's own margin (px-4 sm:px-5
            lg:px-6) rather than full-bleed — a plain sibling div, not a
            border-t on the Grid itself, since a border on the Grid would sit
            at the outer edge of its box (outside the padding) and span edge to
            edge. pt-3 below is the exact gap to the row content, independent of
            the Grid's own row-gap value. */}
        <div className="mx-4 border-t border-border sm:mx-5 lg:mx-6" />
        <Grid className="items-start pt-3 text-sm">
          {/* Contact now takes the wide leading slot the year used to sit in
              (swapped per request), and Connect/Snapshots each shift one slot
              earlier to follow it — Connect, Snapshots, and Contact are each
              their own grid item (not flex children spaced by a fixed gap) so
              every starting position lands exactly on a column line, rather
              than drifting based on a preceding sibling's content width.
              Contact starts at the same column body copy starts at (see
              ParagraphPair's lg:col-start-7 in ProjectShowcase.tsx, and
              Nav.tsx's clock) before the swap; it now starts at col-1 like the
              year used to. */}
          <div className="col-span-4 flex flex-col items-start gap-1 text-xs font-medium text-foreground sm:col-span-4 lg:col-span-6">
            <span className="text-xs font-normal uppercase text-muted">Contact</span>
            <NavLink href="mailto:diaz.bernel@gmail.com">diaz.bernel@gmail.com</NavLink>
          </div>
          <div className="col-span-4 flex flex-col items-start gap-1 text-xs font-medium uppercase text-foreground sm:col-span-2 sm:col-start-5 lg:col-span-2 lg:col-start-7">
            <span className="text-xs font-normal uppercase text-muted">Connect</span>
            <NavLink href="https://linkedin.com/in/berneldiaz" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </NavLink>
          </div>
          <div className="col-span-4 flex flex-col items-start gap-1 text-xs font-medium uppercase text-foreground sm:col-span-2 sm:col-start-7 lg:col-span-2 lg:col-start-9">
            <span className="text-xs font-normal uppercase text-muted">Snapshots</span>
            <NavLink href="https://dribbble.com/berneldiaz" target="_blank" rel="noopener noreferrer">
              Dribbble
            </NavLink>
          </div>
          {/* Left-aligned (items-start) on mobile, matching
              Contact/Connect/Snapshots above it — all four already stack as
              individual full-width rows at this breakpoint, so this is
              purely an alignment match, not a position change.
              On tablet (sm) specifically: also left-aligned, and repositioned
              to col-start-1 so it wraps directly under Contact rather than
              under Snapshots (Contact+Connect+Snapshots already fill all 8
              columns in one row there, so this always wraps to its own row
              regardless of which column it starts at).
              lg explicitly restores the original desktop treatment
              (right-aligned, col-start-11, flush with the grid's true right
              edge, the same edge the nav's clock sits flush against) — since
              without that override it would otherwise inherit the sm
              left-aligned/col-start-1 values upward. */}
          <div className="col-span-4 flex flex-col items-start gap-1 text-xs sm:col-span-2 sm:col-start-1 sm:items-start lg:col-span-2 lg:col-start-11 lg:items-end">
            <p className="font-normal text-muted">&copy; {new Date().getFullYear()}</p>
            <p className="font-medium leading-[14px] text-foreground">Open to work</p>
          </div>
        </Grid>
      </div>
      <FooterWordmark />
    </footer>
  );
}
