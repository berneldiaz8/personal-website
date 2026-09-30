import { PageTransition } from "@/components/PageTransition";

/**
 * Scoped to (site) specifically because template.tsx is what Next.js
 * remounts fresh on every route-segment navigation (Nav/Footer live in this
 * group's layout.tsx, one level up, which doesn't remount) — that's what
 * triggers PageTransition's curtain on each navigation. The curtain itself
 * covers the whole viewport (`fixed inset-0`), Nav/Footer included, not
 * just this template's own subtree — see PageTransition.tsx's own doc
 * comment for the actual transition mechanic.
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
