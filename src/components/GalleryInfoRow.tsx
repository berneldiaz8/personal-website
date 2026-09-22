import { NavLink } from "./NavLink";
import { Grid } from "./showcase/Grid";
import { GalleryFooterReveal } from "./GalleryFooterReveal";
import { MaskedText } from "./MaskedText";

/**
 * Gallery page's own bottom info row. Deliberately a full duplicate of
 * Footer.tsx's Grid row rather than a shared component — an earlier shared
 * FooterTopRow.tsx extraction was suspected of affecting Footer.tsx on other
 * routes, so this stays fully independent by design: nothing here imports
 * from or is imported by Footer.tsx. No sticky-reveal peel and no wordmark —
 * /gallery has nothing to scroll against (see gallery/page.tsx's h-dvh
 * layout).
 *
 * Mount-time entrance (2026-09-22): wrapped in GalleryFooterReveal.tsx (a
 * thin client wrapper around the same MountReveal.tsx mechanism
 * NavEntrance.tsx uses for Nav's wordmark/links) — every label and link here
 * slides up into place out of its own mask box, staggered, once per hard
 * load, gated on `navReady` so it starts only once Nav's own reveal is
 * underway on /gallery too (continuing the same top-to-bottom cascade
 * RevealText's above-the-fold instances already follow elsewhere).
 * GalleryFooterReveal exists specifically so `navReady` — a plain Promise —
 * never gets imported into *this* file: this component has no "use client"
 * and stays a Server Component, and passing a live Promise as a prop across
 * the Server→Client boundary made Next.js's SSR try to serialize/await it,
 * hanging every render of this page indefinitely (confirmed — see that
 * file's own comment for the full story). The three real links
 * (email/LinkedIn/Dribbble) get the reveal for free — NavLink.tsx's own
 * content span already carries `data-nav-mount` inside its `overflow-hidden`
 * box. The plain-text labels and the copyright/"Open to work" lines have no
 * such box to reuse, so those route through MaskedText.tsx instead, which
 * builds one from scratch.
 */
export function GalleryInfoRow() {
  return (
    <footer className="text-muted">
      <div className="mx-4 border-t border-border sm:mx-5 lg:mx-6" />
      <Grid className="items-start pt-3 pb-6 text-sm gap-y-4">
        <GalleryFooterReveal>
          <div className="col-span-4 flex flex-col items-start gap-1 font-medium text-foreground sm:col-span-4 lg:col-span-6">
            <MaskedText className="font-medium uppercase text-muted">Contact</MaskedText>
            <NavLink href="mailto:diaz.bernel@gmail.com" size="md">
              diaz.bernel@gmail.com
            </NavLink>
          </div>
          <div className="col-span-4 flex flex-col items-start gap-1 font-medium uppercase text-foreground sm:col-span-2 sm:col-start-5 lg:col-span-2 lg:col-start-7">
            <MaskedText className="font-medium uppercase text-muted">Connect</MaskedText>
            <NavLink href="https://linkedin.com/in/berneldiaz" target="_blank" rel="noopener noreferrer" size="md">
              LinkedIn
            </NavLink>
          </div>
          <div className="col-span-4 flex flex-col items-start gap-1 font-medium uppercase text-foreground sm:col-span-2 sm:col-start-7 lg:col-span-2 lg:col-start-9">
            <MaskedText className="font-medium uppercase text-muted">Snapshots</MaskedText>
            <NavLink href="https://dribbble.com/berneldiaz" target="_blank" rel="noopener noreferrer" size="md">
              Dribbble
            </NavLink>
          </div>
          <div className="col-span-4 flex flex-col items-start gap-1 sm:col-span-2 sm:col-start-1 sm:items-start lg:col-span-2 lg:col-start-11 lg:items-end">
            <MaskedText as="p" className="font-medium text-muted">
              &copy; {new Date().getFullYear()}
            </MaskedText>
            <MaskedText as="p" className="font-medium leading-[20px] text-foreground">
              Open to work
            </MaskedText>
          </div>
        </GalleryFooterReveal>
      </Grid>
    </footer>
  );
}
