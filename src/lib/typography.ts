/**
 * Named text-style tokens shared across the site, mirroring the Display/Heading/Body/
 * Caption vocabulary already used in the source Figma file. Plain className strings
 * rather than wrapper components, so they compose with framer-motion elements (e.g.
 * Hero.tsx's motion.h1) and any HTML tag without an extra `as`-prop layer.
 *
 * Every value here was copied verbatim from its existing call site — this module only
 * gives names to patterns that already repeat, it doesn't change any visual output.
 */
export const textStyles = {
  /** Small uppercase tracked label. Nav links, case-study meta dt labels. */
  eyebrow: "text-xs font-medium uppercase tracking-wide text-muted",
  /** Same as eyebrow, tinted with the active project's accent color instead of muted. */
  eyebrowAccent: "text-xs font-medium uppercase tracking-wide text-accent",
  /** Same as eyebrow, in the primary (foreground) color instead of muted. Nav links. */
  eyebrowPrimary: "text-sm font-medium uppercase tracking-wide text-foreground",
  /** Slightly larger uppercase tracked label. Hero's "Bernel Diaz" line, section h2s ("Selected Work"). */
  eyebrowLg: "text-sm font-medium uppercase tracking-wide text-muted",
  /** Tabular numerals (still tabular-nums for consistent digit width, just no longer
   * a monospace family — Geist Mono was removed from the codebase). Clock, case-study
   * beat numbers (00, 01, 02...). */
  numeral: "text-xs tabular-nums text-muted",
  /** Same as numeral, in the primary (foreground) color instead of muted. Nav clock. */
  numeralPrimary: "text-xs tabular-nums text-foreground",
  /** Card/project-name heading. Append `sm:text-2xl` at call sites that scale up. */
  h3: "text-xl font-medium tracking-tight",
  /** Muted body copy at base size. Case-study Beat body text and Context paragraph. */
  body: "text-pretty leading-relaxed text-muted",
  /** Muted body copy at text-sm. Case-study outcome descriptions. */
  bodySm: "text-pretty text-sm leading-relaxed text-muted",
  /** Tabular stat figure, case-study Outcomes scale. */
  stat: "text-2xl font-medium tabular-nums tracking-tight",
  /** Meta dt/dd value (Role/Areas/Scope), case-study scale — pair with `eyebrow` for the label. */
  metaValue: "mt-1 text-sm text-foreground",

  /**
   * Larger "showcase" scale introduced for OpinlyShowcase.tsx — will get reused as
   * Lexora/The Dividend Tracker/FoodOps get their own Opinly-style showcase built out.
   */
  /** Matched to the /info page's "Experience" section label (`eyebrowLg`) —
   * uppercase, tracking-wide, muted instead of foreground (2026-09-16,
   * explicit request). */
  showcaseMetaLabel: "text-sm font-medium uppercase tracking-wide text-muted",
  /** text-base (regular size step) instead of text-sm, font-medium instead
   * of font-normal (2026-09-16, explicit request). */
  showcaseMetaValue: "text-pretty text-base font-medium text-foreground",
  showcaseStat: "text-4xl font-medium tabular-nums tracking-tight text-foreground",
  /** Formerly a `font-mono` (Geist Mono) exception to the single-font-family rule —
   * Geist Mono was removed from the codebase, so this is General Sans like everything
   * else now. Kept as its own token since the outcome-stat caption scale/uppercase
   * treatment is still distinct from body copy. */
  showcaseCaption: "text-xs font-normal uppercase leading-[18px] text-muted",

  /**
   * Figma's "Heading/2xl Medium" style (24px/29px, -0.2px tracking) — sourced from
   * the /info page redesign (node 1634:17015), where it's reused for both the bio
   * paragraphs and each experience entry's company name. Full foreground color, not
   * muted — despite reading visually lighter/grayer in the Figma screenshot next to
   * this, the file's own bound variable data confirmed that's just an optical effect
   * of the lighter font weight at that size, not an actual distinct color (no muted
   * variable is bound anywhere in that node).
   */
  heading2xl: "text-2xl font-medium leading-[29px] tracking-[-0.2px] text-foreground",
  /** Figma's "Heading/xl Medium" style (20px/25px, -0.1px tracking, 500 weight)
   * — distinct from `heading2xl` above (24px/29px, -0.2px). Originally used for
   * the `/work` case-study section labels (Context/Problem/Discovery/Approach/
   * Outcome) in `ProjectShowcase.tsx`'s `ParagraphPair`, but superseded there
   * (2026-09-16, explicit request) by a bump *to* `heading2xl` — see that
   * file's own comment on the label, which now uses `heading2xl` and is the
   * source of truth. Reused (2026-09-21, explicit request) for WorkTeaser's
   * project tagline, stepped down from heading2xl to create more size
   * distinction against the row's h3 project name. */
  headingXl: "text-xl font-medium leading-[25px] tracking-[-0.1px] text-foreground",
  /** Same metrics as `heading2xl`, font-light instead of font-medium, text-muted
   * instead of text-foreground — the experience entries' role/title line sits
   * directly under the company name in this weight/color. Needed adding General
   * Sans Light/300 to the site's font files (previously only 200/400/500 were
   * loaded) since this is the first call site for it. */
  heading2xlLight: "text-2xl font-light leading-[29px] tracking-[-0.2px] text-muted",
  /** Same metrics as `heading2xlLight`, font-normal instead of font-light —
   * the /info page's experience entries' role/title line, bumped up to
   * Regular/400 (already loaded, no new font file needed). */
  heading2xlRegular: "text-2xl font-normal leading-[29px] tracking-[-0.2px] text-muted",
  /** Figma's "Label/xs Regular" style (12px/15px, 0.4px tracking) — distinct from
   * `eyebrow` above: font-normal not font-medium. Used for the /info page's
   * EXPERIENCE section label, text-muted like every other supporting-text
   * element in that section (company/role stay foreground/muted respectively;
   * everything smaller and label-like reads as muted). */
  labelXs: "text-xs font-normal uppercase tracking-[0.4px] text-muted",
  /** Same as `labelXs`, at text-sm instead of text-xs — the /info page's
   * experience entries' location/years line, bumped up from labelXs to read
   * consistently with the section's other text after the Experience label
   * itself moved to eyebrowLg. */
  labelSm: "text-sm font-normal uppercase tracking-[0.4px] text-muted",
  /** Hero's h1 ("berneldiaz is a UI/UX designer who..."). Responsive display
   * headline: text-4xl -> sm:text-5xl -> lg:text-[48px]. Bumped up from
   * text-3xl/sm:text-4xl (2026-09-21, explicit request) to restore a clear
   * size hierarchy against WorkTeaser's project-title h3, which sits at the
   * same text-3xl/sm:text-4xl steps — with both at identical sizes on mobile
   * and sm, the two had no visual distinction at those breakpoints (lg was
   * already fine, since the teaser title caps at sm:text-4xl with no lg step
   * of its own). text-5xl resolves to the same 48px as the existing
   * lg:text-[48px] step, so the size plateaus from sm upward rather than
   * jumping past it. `showcaseHeadline` below briefly diverged from this at
   * mobile/sm as a result, then was re-matched to it the same day (explicit
   * request) — the two are identical at every step again. leading-[1]
   * is a deliberate content choice, not clipping-constrained — see Hero.tsx's
   * own comment on why (RevealText's mask carries its own descender/ascender
   * headroom now, independent of whatever leading a call site picks). Grid
   * col-span classes stay at the call site, same as every other token here
   * that pairs with layout classes it doesn't own. */
  hero: "text-balance text-4xl font-normal leading-[1] tracking-[-0.5px] text-foreground sm:text-5xl lg:text-[48px]",
  /** ShowcaseHeadline's project-name run ("Name—description" on each `/work`
   * case study). Originally matched `hero`'s size/leading/tracking/color
   * steps exactly (2026-09-16, explicit request); `hero` was later bumped at
   * mobile/sm (2026-09-21) to disambiguate it from WorkTeaser's title, which
   * temporarily left this token behind at the old text-3xl/sm:text-4xl
   * steps. Re-matched to `hero` again same day (explicit request, "emulate
   * the hero headline's mobile responsive size") — text-4xl -> sm:text-5xl
   * -> lg:text-[48px], identical to `hero` at every step once more.
   * font-medium (reverted from a brief font-semibold stint, 2026-09-17,
   * explicit request) — the em-dash + description half stays font-normal via
   * its own span at the call site, not part of this token. Grid col-span
   * classes stay at the call site too, same as `hero`. */
  showcaseHeadline:
    "text-balance text-4xl font-medium leading-[1] tracking-[-0.5px] text-foreground sm:text-5xl lg:text-[48px]",
} as const;
