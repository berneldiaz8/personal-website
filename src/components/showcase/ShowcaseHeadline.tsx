import { textStyles } from "@/lib/typography";
import { RevealText } from "../RevealText";

/**
 * Mixed-weight display headline: "Name—description", name in Medium weight (black),
 * description in ExtraLight (muted), both in the site's font-sans family. Figma:
 * Display/5xl Medium + Display/5xl ExtraLight (paired styles — a single Figma text
 * style can't express two weights in one run). The em-dash is an explicit, scoped
 * exception to the site's em-dash ban — see CLAUDE.md and .claude/rules/skills-used.md
 * before touching it.
 *
 * Reveal routes through the shared RevealText component (line-mask stagger,
 * same as Hero.tsx's h1) rather than its own bespoke word-mask timeline —
 * the previous two-beat name/description word stagger was removed per
 * explicit request to keep this consistent with Hero's reveal instead.
 *
 * `leading-[1.2]`, not the Figma-matched 1.1 this originally shipped with —
 * RevealText's `mask: "lines"` wrapper is an empty clone of each line with
 * only `overflow: clip` set; it has no explicit height, so it inherits its
 * box height purely from `line-height`, with no allowance for descender ink
 * the way normal (unmasked) text silently gets. At 1.1 this clipped the
 * bottom of every descender (g/j/p/q/y) in the description text — invisible
 * under `prefers-reduced-motion` (SplitText never runs there) but present
 * for everyone else. 1.2 was the smallest bump that fully cleared it,
 * confirmed by screenshotting "recordkeeping"/"traceability"/"pressure" at
 * 1.1/1.2/1.25/1.3.
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
  /** Optional NDA disclosure line, rendered 24px below the headline, one line. */
  caption?: string;
}) {
  return (
    <div className="px-4 pt-6 pb-[136px] sm:px-5 lg:px-6">
      <RevealText
        as="div"
        className="max-w-[60rem] text-balance text-4xl font-medium leading-[1.2] tracking-[-0.5px] text-foreground sm:text-5xl"
      >
        <span>{name}</span>
        <span className="font-extralight text-muted">
          {"—"}
          {description}
        </span>
      </RevealText>
      {caption && (
        <RevealText as="div" className="mt-6 max-w-[60rem]">
          <p className={textStyles.showcaseCaption}>{caption}</p>
        </RevealText>
      )}
    </div>
  );
}
