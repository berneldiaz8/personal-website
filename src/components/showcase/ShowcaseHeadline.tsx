import { textStyles } from "@/lib/typography";
import { RevealText } from "../RevealText";
import { Grid } from "./Grid";

/**
 * Display headline: "Name—description", both in the site's font-sans family,
 * both full foreground color now. Originally a mixed-weight/mixed-color
 * treatment (name in Medium/black, description in ExtraLight/muted) matching
 * Figma's paired Display/5xl Medium + Display/5xl ExtraLight styles — the
 * description span was moved to font-normal/text-foreground (2026-09-16,
 * explicit request) to read closer to Hero's single-weight, single-color
 * headline, and the name's weight was then bumped from Medium to Semibold
 * (2026-09-16, explicit request; Semibold/600 re-added to `layout.tsx`'s
 * `localFont` load list for this) as the one remaining weight step. The
 * em-dash is an explicit, scoped exception to the site's em-dash ban — see
 * CLAUDE.md and .claude/rules/skills-used.md before touching it.
 *
 * Size/leading/tracking/color for the name run now live in
 * `textStyles.showcaseHeadline` (`src/lib/typography.ts`) rather than being
 * hand-typed here — matched to `textStyles.hero`'s steps exactly (2026-09-16,
 * explicit request) rather than Figma's flat 5xl/1.1, weight aside. The mask
 * clipping descender ink at tight leading that motivated the old leading-1.2
 * value has since been fixed at the source (`.reveal-line-mask` in
 * globals.css carries its own headroom), so leading-[1] is safe here the
 * same way it already is on Hero.tsx's h1. Grid col-span classes stay at
 * the call site, same convention as `hero`'s own call site in Hero.tsx.
 *
 * Reveal routes through the shared RevealText component (line-mask stagger,
 * same as Hero.tsx's h1) rather than its own bespoke word-mask timeline —
 * the previous two-beat name/description word stagger was removed per
 * explicit request to keep this consistent with Hero's reveal instead.
 *
 * Shared by every project's ProjectShowcase (originally introduced for Opinly).
 */
export function ShowcaseHeadline({
  name,
  description,
  caption,
}: {
  name: string;
  description: string;
  /** Optional NDA disclosure line, rendered 8px below the headline, one line. */
  caption?: string;
}) {
  return (
    <Grid className="pt-6 pb-[176px]">
      <RevealText
        as="div"
        className={`col-span-4 ${textStyles.showcaseHeadline} sm:col-span-8 lg:col-span-8`}
      >
        <span>{name}</span>
        <span className="font-normal text-foreground">
          {"—"}
          {description}
        </span>
      </RevealText>
      {caption && (
        <RevealText as="div" className="col-span-4 mt-4 sm:col-span-8 lg:col-span-8">
          <p className="text-sm font-normal uppercase leading-[18px] text-muted">{caption}</p>
        </RevealText>
      )}
    </Grid>
  );
}
