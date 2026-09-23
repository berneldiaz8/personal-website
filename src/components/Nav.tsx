import { NavLink } from "./NavLink";
import { NavEntrance } from "./NavEntrance";
import { WordmarkLink } from "./WordmarkLink";
import { Grid } from "./showcase/Grid";
import { textStyles } from "@/lib/typography";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background">
      <Grid className="items-center py-5">
        {/* NavEntrance is a display:contents wrapper (see that file) so these
            three stay direct Grid children for col-span placement — it only
            exists to scope the mount-time slide-up on the wordmark and
            Work/Info/Gallery/Contact. */}
        <NavEntrance>
          <WordmarkLink />

          {/* Aligned to the same column body copy starts at (see ParagraphPair's
              lg:col-start-7 in ProjectShowcase.tsx). Gallery lives permanently
              in this group now (beside Info, at every breakpoint). Contact
              also gets a copy here, but only on mobile (sm:hidden) — mobile
              has no spare grid column for its own standalone slot the way
              sm+ does (see the block below), so its mobile appearance is
              tagged onto this group instead. */}
          <nav
            className={`col-span-2 col-start-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 sm:col-span-2 sm:col-start-5 lg:col-span-3 lg:col-start-7 ${textStyles.eyebrowPrimary}`}
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
            <span className="-ml-2 sm:hidden" aria-hidden="true">
              ,
            </span>
            <NavLink href="mailto:diaz.bernel@gmail.com" size="md" className="sm:hidden">
              Contact
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
        </NavEntrance>
      </Grid>
    </header>
  );
}
