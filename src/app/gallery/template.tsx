import { PageTransition } from "@/components/PageTransition";

/**
 * /gallery sits outside the (site) route group (see gallery/page.tsx's own
 * doc comment) and renders its own Nav rather than sharing (site)'s
 * persistent one. Same PageTransition mount as (site)/template.tsx either
 * way — the curtain covers the whole viewport (`fixed inset-0`) regardless
 * of which Nav instance is on screen. See PageTransition.tsx's own doc
 * comment for the actual transition mechanic.
 */
export default function GalleryTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
