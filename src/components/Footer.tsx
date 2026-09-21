import { FooterWordmark } from "./FooterWordmark";
import { NavLink } from "./NavLink";
import { Grid } from "./showcase/Grid";

export function Footer() {
  return (
    <footer className="sticky top-0 flex h-[100dvh] flex-col justify-between bg-background text-muted">
      {/* mt-[60px] clears Nav's own rendered height (60px — re-measured
          empirically rather than assumed; an arbitrary value since it falls
          between Tailwind's default spacing steps) — both this row and the
          nav are `sticky top-0`, so once the footer is fully stuck the nav
          (z-50) sits directly on top of it. Was previously mt-[56px], which
          matched Nav's height at the time but went stale when Nav.tsx's
          NavLink instances picked up `size="md"` (14px -> 20px hover-swap
          box) in a later pass, growing Nav's real height from 56px to 60px
          and hiding the separator border below entirely underneath Nav's
          opaque background again — confirmed by measuring both rects at max
          scroll (Nav bottom: 60px, border: 56-57px). This value is coupled
          to Nav.tsx's actual rendered height, not a fixed constant — re-check
          it (`document.querySelector('header').getBoundingClientRect().height`
          at max scroll) any time Nav.tsx's own vertical sizing changes. */}
      <div className="mt-[60px]">
        {/* Separator is inset to match the Grid's own margin (px-4 sm:px-5
            lg:px-6) rather than full-bleed — a plain sibling div, not a
            border-t on the Grid itself, since a border on the Grid would sit
            at the outer edge of its box (outside the padding) and span edge to
            edge. pt-3 below is the exact gap to the row content, independent of
            the Grid's own row-gap value. */}
        <div className="mx-4 border-t border-border sm:mx-5 lg:mx-6" />
        {/* gap-y-4 overrides Grid's own gap-3 (12px) row-gap on mobile to
            16px — no sm: reset needed since that already matches Grid's own
            sm:gap-4, so this cascades upward harmlessly. Column-gap is
            untouched (irrelevant on mobile, where every item stacks in one
            column anyway). */}
        <Grid className="items-start pt-3 text-sm gap-y-4">
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
          <div className="col-span-4 flex flex-col items-start gap-1 font-medium text-foreground sm:col-span-4 lg:col-span-6">
            <span className="font-medium uppercase text-muted">Contact</span>
            <NavLink href="mailto:diaz.bernel@gmail.com" size="md">
              diaz.bernel@gmail.com
            </NavLink>
          </div>
          <div className="col-span-4 flex flex-col items-start gap-1 font-medium uppercase text-foreground sm:col-span-2 sm:col-start-5 lg:col-span-2 lg:col-start-7">
            <span className="font-medium uppercase text-muted">Connect</span>
            <NavLink
              href="https://linkedin.com/in/berneldiaz"
              target="_blank"
              rel="noopener noreferrer"
              size="md"
            >
              LinkedIn
            </NavLink>
          </div>
          <div className="col-span-4 flex flex-col items-start gap-1 font-medium uppercase text-foreground sm:col-span-2 sm:col-start-7 lg:col-span-2 lg:col-start-9">
            <span className="font-medium uppercase text-muted">Snapshots</span>
            <NavLink
              href="https://dribbble.com/berneldiaz"
              target="_blank"
              rel="noopener noreferrer"
              size="md"
            >
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
          <div className="col-span-4 flex flex-col items-start gap-1 sm:col-span-2 sm:col-start-1 sm:items-start lg:col-span-2 lg:col-start-11 lg:items-end">
            <p className="font-medium text-muted">&copy; {new Date().getFullYear()}</p>
            <p className="font-medium leading-[20px] text-foreground">Open to work</p>
          </div>
        </Grid>
      </div>
      <FooterWordmark />
    </footer>
  );
}
