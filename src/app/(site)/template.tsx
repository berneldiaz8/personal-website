import { PageTransition } from "@/components/PageTransition";

/**
 * Scoped to (site) specifically so only the routed page content fades on
 * navigation, not Nav/Footer — those live in this group's layout.tsx, one
 * level up, which (unlike template.tsx) does not remount on navigation. See
 * PageTransition.tsx's own doc comment for the actual transition mechanic.
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
