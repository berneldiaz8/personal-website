import Link from "next/link";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";
import { Grid } from "./showcase/Grid";
import { textStyles } from "@/lib/typography";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background">
      <Grid className="items-center py-5">
        <Link
          href="/"
          aria-label="berneldiaz, home"
          className="col-span-2 w-fit sm:col-span-2 lg:col-span-3"
        >
          <Logo className="h-[14px] w-auto text-foreground" aria-hidden="true" />
        </Link>

        {/* Aligned to the same column body copy starts at (see ParagraphPair's
            lg:col-start-7 in ProjectShowcase.tsx). Gallery moves out of this
            group at sm+ (see the standalone block below, replacing the
            clock's old slot) — on mobile there's no separate slot for it, so
            it stays tagged onto this group instead. */}
        <nav
          className={`col-span-2 col-start-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 sm:col-span-2 sm:col-start-5 lg:col-span-3 lg:col-start-7 ${textStyles.eyebrowPrimary}`}
        >
          <NavLink href="/work">Work,</NavLink>
          <NavLink href="/info">Info</NavLink>
          <span className="-ml-2 sm:hidden" aria-hidden="true">
            ,
          </span>
          <NavLink href="/gallery" className="sm:hidden">
            Gallery
          </NavLink>
        </nav>

        {/* Gallery alone, replacing the clock's old slot (and, later, the
            Contact link's slot) — right-aligned the same way the clock was
            (flush with the grid's right edge). Hidden on mobile since it
            already appears in the group above there. */}
        <div
          className={`hidden sm:col-span-2 sm:col-start-7 sm:flex sm:justify-end lg:col-span-3 lg:col-start-10 ${textStyles.eyebrowPrimary}`}
        >
          <NavLink href="/gallery">Gallery</NavLink>
        </div>
      </Grid>
    </header>
  );
}
