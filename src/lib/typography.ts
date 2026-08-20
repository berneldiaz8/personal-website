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
  eyebrowPrimary: "text-xs font-medium uppercase tracking-wide text-foreground",
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
  showcaseMetaLabel: "text-sm font-medium text-foreground",
  showcaseMetaValue: "text-pretty text-sm font-normal text-muted",
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
  /** Same metrics as `heading2xl`, font-light instead of font-medium, text-muted
   * instead of text-foreground — the experience entries' role/title line sits
   * directly under the company name in this weight/color. Needed adding General
   * Sans Light/300 to the site's font files (previously only 200/400/500 were
   * loaded) since this is the first call site for it. */
  heading2xlLight: "text-2xl font-light leading-[29px] tracking-[-0.2px] text-muted",
  /** Figma's "Label/xs Regular" style (12px/15px, 0.4px tracking) — distinct from
   * `eyebrow` above: font-normal not font-medium. Used for the /info page's
   * EXPERIENCE section label, text-muted like every other supporting-text
   * element in that section (company/role stay foreground/muted respectively;
   * everything smaller and label-like reads as muted). */
  labelXs: "text-xs font-normal uppercase tracking-[0.4px] text-muted",
} as const;
