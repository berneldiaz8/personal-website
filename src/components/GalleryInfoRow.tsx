import { NavLink } from "./NavLink";
import { Grid } from "./showcase/Grid";

/**
 * Gallery page's own bottom info row. Deliberately a full duplicate of
 * Footer.tsx's Grid row rather than a shared component — an earlier shared
 * FooterTopRow.tsx extraction was suspected of affecting Footer.tsx on other
 * routes, so this stays fully independent by design: nothing here imports
 * from or is imported by Footer.tsx. No sticky-reveal peel and no wordmark —
 * /gallery has nothing to scroll against (see gallery/page.tsx's h-dvh
 * layout).
 */
export function GalleryInfoRow() {
  return (
    <footer className="text-muted">
      <div className="mx-4 border-t border-border sm:mx-5 lg:mx-6" />
      <Grid className="items-start pt-3 pb-6 text-sm gap-y-4">
        <div className="col-span-4 flex flex-col items-start gap-1 font-medium text-foreground sm:col-span-4 lg:col-span-6">
          <span className="font-medium uppercase text-muted">Contact</span>
          <NavLink href="mailto:diaz.bernel@gmail.com" size="md">
            diaz.bernel@gmail.com
          </NavLink>
        </div>
        <div className="col-span-4 flex flex-col items-start gap-1 font-medium uppercase text-foreground sm:col-span-2 sm:col-start-5 lg:col-span-2 lg:col-start-7">
          <span className="font-medium uppercase text-muted">Connect</span>
          <NavLink href="https://linkedin.com/in/berneldiaz" target="_blank" rel="noopener noreferrer" size="md">
            LinkedIn
          </NavLink>
        </div>
        <div className="col-span-4 flex flex-col items-start gap-1 font-medium uppercase text-foreground sm:col-span-2 sm:col-start-7 lg:col-span-2 lg:col-start-9">
          <span className="font-medium uppercase text-muted">Snapshots</span>
          <NavLink href="https://dribbble.com/berneldiaz" target="_blank" rel="noopener noreferrer" size="md">
            Dribbble
          </NavLink>
        </div>
        <div className="col-span-4 flex flex-col items-start gap-1 sm:col-span-2 sm:col-start-1 sm:items-start lg:col-span-2 lg:col-start-11 lg:items-end">
          <p className="font-medium text-muted">&copy; {new Date().getFullYear()}</p>
          <p className="font-medium leading-[20px] text-foreground">Open to work</p>
        </div>
      </Grid>
    </footer>
  );
}
