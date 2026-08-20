import { PageTransition } from "@/components/PageTransition";

/**
 * /gallery sits outside the (site) route group (see gallery/page.tsx's own
 * doc comment) and renders its own Nav rather than sharing (site)'s
 * persistent one — so unlike (site)/template.tsx, there's no way to scope
 * this to "content only, not chrome" the same way. The whole page (Nav
 * included) fades in together on arrival here, which is fine: this route is
 * already its own fully independent, single-viewport experience. See
 * PageTransition.tsx's own doc comment for the actual transition mechanic.
 */
export default function GalleryTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
