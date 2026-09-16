import { RevealText } from "./RevealText";
import { Logo } from "./Logo";
import { Grid } from "./showcase/Grid";
import { SeeWorkButton } from "./SeeWorkButton";
import { textStyles } from "@/lib/typography";
import { projects } from "@/data/projects";

/**
 * Line-mask entrance via RevealText (see that file) — swapped from a bespoke
 * mount-time fade-up for a consistent reveal treatment with the case-study
 * narrative text. RevealText's ScrollTrigger ("top 85%") still fires on
 * mount here since the hero sits at the very top of the page, already past
 * that threshold when the trigger is created. Source: Figma node
 * 1587:15147 — the two-line headline + separate subtext this replaced is now
 * one flowing statement, with the wordmark set inline as the sentence's
 * subject rather than sitting in a byline above it.
 *
 * Typographic classes (size steps, weight, leading, tracking, color) live in
 * `textStyles.hero` (src/lib/typography.ts) — see that token's own comment
 * for the `leading-[1]` reasoning. Grid col-span classes stay here since
 * they're layout, not text style.
 */
export function Hero() {
  return (
    <section className="pt-6 pb-16">
      <Grid>
        <RevealText
          as="h1"
          className={`col-span-4 ${textStyles.hero} sm:col-span-8 lg:col-span-10`}
        >
          <span className="sr-only">berneldiaz</span>
          <Logo
            aria-hidden="true"
            className="mr-3.5 inline-block h-[0.73em] w-auto translate-y-[calc(0.05em_-_1px)] align-baseline text-foreground"
          />
          is a UI/UX designer who takes complex products with no design
          foundation and ships them end to end.
        </RevealText>
      </Grid>

      {/* mt-10 (40px, 2026-09-16 explicit request) below the headline, sits
          outside the Grid rather than as a second grid item — Grid's own
          gap-3/gap-4 row gap would otherwise stack on top of this margin
          instead of producing an exact 40px gap. Pulled into its own client
          component (SeeWorkButton.tsx) so it can drive an animated Lenis
          scroll on click and Hero.tsx itself can stay a server component —
          see that file's own comment for the fluid-motion/Lenis mechanics.
          Links to the first project's own row within WorkTeaser.tsx on this
          same page — `projects[0].slug` rather than a hardcoded slug, so
          this stays correct if projects.ts's order ever changes.
          `hidden` (2026-09-16, explicit request, "for now") — temporarily
          hidden, not removed; the markup/logic stays intact to re-enable
          later. */}
      <div className="hidden px-4 sm:px-5 lg:px-6 mt-10">
        <SeeWorkButton targetSlug={projects[0].slug} />
      </div>

      <div className="h-[120px]" />
    </section>
  );
}
