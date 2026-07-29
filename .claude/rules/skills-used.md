# Skills applied to this project

Record of which Claude Code skills shaped this site, so future sessions reapply the same
conventions instead of drifting. Re-run a skill listed here before making the kind of change
it covers.

## Content extraction
- `figma-use` + `figma-use-slides` — pulled all case study copy and gallery images from the
  source Figma Slides deck (`iQM6h92VB7Zz5KXUQjAToI`, "Portfolio Deck"). Re-run these if new
  case studies get added to the deck later.

## Visual design
- `design-taste-frontend` — anti-slop pass for the whole site. Declared dials:
  `DESIGN_VARIANCE: 7`, `MOTION_INTENSITY: 6`, `VISUAL_DENSITY: 3`. Hard rules from this skill
  that must keep holding: zero em-dashes anywhere visible, one accent color used consistently,
  hero content fits the viewport (headline ≤ 2 lines, subtext ≤ 20 words), no div-based fake
  screenshots (this site uses real pulled screenshots). **Explicit, scoped exception (2026-07-16):**
  the large display headline treatment ("Name—description") uses a real em-dash, matching the
  source Figma copy exactly — the user asked for this back after it had been swapped to a colon
  during implementation, and confirmed it's not Opinly-specific: the same em-dash applies to this
  headline pattern on all 4 projects, since `ProjectShowcase.tsx` (`src/components/showcase/`,
  originally `OpinlyShowcase.tsx`) is now shared by all of them. Factored into
  `src/components/showcase/ShowcaseHeadline.tsx` precisely so every project reuses it rather than
  re-deriving the em-dash + mixed-weight markup — reuse that component, don't hand-roll the
  pattern again. This exception is scoped to that one display-headline pattern only, not a
  reversal of the site-wide ban — don't propagate em-dashes elsewhere (body copy, meta text, UI
  strings) without the same explicit ask. Two further explicit, scoped exceptions since: page
  `<title>` tags site-wide use the `"Bernel Diaz — [Page]"` pattern (`src/app/layout.tsx` and each
  route's own `metadata.title`), and `GalleryMarquee.tsx`'s per-tile hover caption combines the
  project name and label onto one line as `"Project — Label"` (spaced on both sides — unlike
  `ShowcaseHeadline`'s tight, no-space convention; asked for explicitly after first trying the
  tight version). Each was a separate explicit user request, not a blanket lift of the ban — still
  don't add an em-dash anywhere else without the same explicit ask.
- `make-interfaces-feel-better` — polish pass: scroll-reveal motion via the `Reveal` component
  (respects `prefers-reduced-motion`), image containers use inset box-shadow outlines
  (`rgba(0,0,0,.1)` light / `rgba(255,255,255,.1)` dark) not tinted borders, `text-balance`
  on headings, `text-pretty` on body copy, explicit transition properties (never
  `transition-all`), `active:scale-[0.96]` on the primary CTA.
- `ui-skills-root` — routing skill used to select `fixing-accessibility` as the right
  narrow skill for an a11y pass, rather than guessing.
- `fixing-accessibility` — audited and fixed: all decorative icons need `aria-hidden="true"`,
  hover-only affordances need a `group-focus-visible` equivalent for keyboard users, heading
  hierarchy must not skip a level (`/work` had h1 → h3, fixed with a `sr-only` h2), and the
  light-mode accent color must hit 4.5:1 contrast at the text sizes it's actually used at
  (was ~3.4:1 at orange-600, fixed by moving to orange-700 `#c2410c`).

## Applying to new UI work
Before adding new pages/components: re-check the em-dash ban, the icon `aria-hidden` rule, the
heading-hierarchy rule, and reuse `Reveal` for any new scroll motion rather than writing a new
`whileInView` call inline.
