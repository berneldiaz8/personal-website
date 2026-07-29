# Personal Website — Bernel Diaz

Design portfolio site. Goal: showcase project case studies to land work/clients.

## Stack
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- ESLint (flat config)
- `motion` (import from `motion/react`) for scroll reveals, `@phosphor-icons/react` for icons (`/dist/ssr` entry point in Server Components, no `/dist/ssr` needed once a component is already `'use client'`)
- Single font family: General Sans (`font-sans`, default) truly everywhere now, including narrative prose, numerals, and captions — [Fontshare](https://www.fontshare.com/fonts/general-sans), self-hosted via `next/font/local` (`src/app/layout.tsx`, files in `src/app/fonts/`), swapped in 2026-07-19 replacing the original Geist Sans. Only the weights actually used in the codebase are loaded (Extralight/200, Regular/400, Medium/500) — check `grep -rohE "font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)" src` before assuming a new weight is available; adding one means pulling another file from Fontshare's API (or, for Semibold/600, re-adding the already-downloaded file already sitting in `src/app/fonts/`), not just adding a Tailwind class. A Newsreader serif/sans pairing was tried (2026-07-16) and explicitly reverted at the user's request — don't reintroduce a serif without being asked again. **Geist Mono removed entirely (2026-07-19):** it used to power the Clock, project numbers ("01"), case-study beat numbers, and — as an explicit, scoped exception to the single-family rule — the outcome-stat caption text in `ProjectShowcase.tsx`. All of that now renders in General Sans; `--font-mono` was dropped from `globals.css`'s `@theme inline` block entirely (not repointed at General Sans, since a `font-mono` utility class that isn't monospace would be a misleading name) and every call site (`src/lib/typography.ts`'s `mono` token, renamed to `numeral` since it's no longer mono; `showcaseCaption`) had its `font-mono` class stripped directly. `tabular-nums` was kept wherever it existed — that's a digit-width feature independent of font family, not part of the mono exception. **`font-semibold` → `font-medium` site-wide (2026-07-19):** every heading/stat/meta-value that used to be Semibold/600 (Hero's H1, the contact page H1, `typography.ts`'s `h3`/`stat`/`showcaseMetaValue`/`showcaseStat` tokens) now uses Medium/500 instead — this dropped Semibold/600 usage to zero, so the font file itself was removed from `layout.tsx`'s `localFont` load list too (still present on disk in `src/app/fonts/` if it's needed again, just not loaded).

@AGENTS.md

## Structure
- `src/app/` — routes (App Router): `/` (bio + a lightweight `WorkTeaser` grid), `/work` (the
  full work browser, see `## Work page architecture`), `/info`, `/gallery`. **No `/work/[slug]`
  per-project routes** — case studies render inline within `/work`, they don't navigate anywhere.
  `/`, `/work`, and `/info` live inside the `(site)` route group (`src/app/(site)/`), whose
  `layout.tsx` wraps them in the shared `Nav`/`Footer`. `/gallery` (added 2026-07-29, replacing
  `/contact`) sits **outside** that group with its own `src/app/gallery/page.tsx` — it renders
  `Nav` + an empty middle (no gallery content built yet) + `GalleryInfoRow` (a standalone
  Contact/Connect/Snapshots/Year row, `src/components/GalleryInfoRow.tsx`, deliberately **not**
  shared with `Footer.tsx` — a full duplicate on purpose, kept fully independent after an earlier
  shared-component extraction was suspected of affecting `Footer.tsx` on other routes). No
  sticky-reveal peel, no `FooterWordmark` — the page is sized to exactly one viewport (`h-dvh`
  flex column) so there's genuinely nothing to scroll, on the same native-window/Lenis-driven
  scroll as every other route (no isolated `overflow-hidden`/`overflow-y-auto` container). Root
  `src/app/layout.tsx` now only supplies `<html>`/`<body>`/fonts/`SmoothScroll`; `Nav`/`Footer`
  moved down into the `(site)` group layout so `/gallery` can opt out of them.
- `globals.css` sets `html { overflow-y: scroll; }` site-wide (not scoped to `/gallery`) so the
  scrollbar gutter/track renders identically on every route, including `/gallery` which has no
  overflow of its own — without this, `/gallery` would render measurably narrower than pages that
  do overflow, and the scrollbar would flicker in/out when navigating between routes.
- `src/components/` — `Nav`, `Footer`, `Hero`, `WorkTeaser`, `WorkBrowser`, `CaseStudyDetail`,
  `Clock`, `Reveal`
- `src/data/projects.ts` — typed `Project[]` with all case study copy (context/challenge/approach/
  outcomes/reflection are still fully populated even though the UI no longer renders them — see
  `## Work page architecture` before deleting any of these fields); `getProject(slug)` helper
- `public/work/{slug}/N.mp4` + `N-poster.jpg` — looping muted product-walkthrough clips (N = 1 to
  however many that project has: Opinly 4, Lexora 5, The Dividend Tracker 5, FoodOps 3). Converted
  from the real source **video** exports at `Documents/Design Journey/Portfolio assets/V2/{Project}/Video/`
  — see `## Media pipeline` before touching these.
- Import alias: `@/*` → `src/*`
- `params`/`searchParams` in page components are **Promises** in this Next version (16) — must `await` them. See `@AGENTS.md`.

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — lint

## Content source
Case study copy and images originate from the Figma Slides deck `iQM6h92VB7Zz5KXUQjAToI` ("Portfolio Deck"). 4 projects: Opinly, Lexora, The Dividend Tracker, FoodOps — each with cover/context/challenge/approach/outcomes/reflection beats plus gallery slides. If new case studies are added later, pull from the same deck structure rather than inventing new fields ad hoc.

## Visual direction
A deliberate blend of the three references below, applied 2026-07-16:

- **vvichael's editorial minimalism** → a functional nav: wordmark left, a live clock center
  fixed to Manila time regardless of visitor (`src/components/Clock.tsx`, tabular-nums, no
  `aria-live` — it's ambient, not a status update screen readers should hear every second),
  `Work, Contact` small-caps links right. (The mixed serif/sans pairing this reference also
  suggested was tried and reverted — see `## Stack`, single Geist Sans family now.)
- **talimi's essay-like storytelling** → numbered case-study sections (`00 Context`, `01
  Challenge`...) are alive and well, just relocated: they used to live on full-page `/work/[slug]`
  routes, now they render **inline and always-expanded** on `/work` (see
  `## Work page architecture`) via `CaseStudyDetail.tsx`. The numbering/labeling system itself
  didn't change, only where it's mounted.
- **aaronpoe's colorful warmth** → each project now has its own locked accent color instead of
  one site-wide accent: Opinly stays orange (`#c2410c`/`#fb923c`), Lexora is blue
  (`#1d4ed8`/`#60a5fa`), The Dividend Tracker is emerald (`#047857`/`#34d399`), FoodOps is amber
  (`#b45309`/`#fbbf24`) — all verified ≥4.5:1 contrast in both themes (see the Python snippet in
  git history / ask to re-derive if adding a project). Global chrome (Nav, Footer, Hero) keeps
  the neutral default (Opinly's orange); only the `WorkBrowser` section shifts accent, tied to
  whichever project is active. This resolves the `Color Consistency Lock` rule per-scope, not
  page-wide: within the billboard, everything is one consistent color at a time, it just changes
  deliberately as the selection changes — the rule is about avoiding random inconsistency, not
  about banning intentional, content-driven color transitions.

**How the per-project accent works:** `Project.accent = { light, dark }` in `projects.ts`. Any
element that should carry a project's color sets `data-project-accent` + inline
`style={{ '--accent-light': ..., '--accent-dark': ... }}` (see `WorkBrowser.tsx`) — a CSS rule in
`globals.css` resolves `--accent` from those two vars against the same `prefers-color-scheme`
switch the global default uses, so every component that already reads `text-accent`/`bg-accent`
etc. just works without changes.

Base tokens (`--background`/`--foreground`/`--muted`/`--border`) stay monochrome and unchanged.
Dark mode via `prefers-color-scheme` media query, as before. Still open to further redirection.

## Media pipeline
Case study visuals are real product-walkthrough video, not screenshots. Source files live outside
this repo at `~/Documents/Design Journey/Portfolio assets/V2/{Project}/Video/*.mp4` — **use this
folder, not the sibling `50fps`/`25fps` GIF folders.** The GIF folders hold the same clips
re-exported as GIF (lossy, 256-color palette, 78-158MB each); the `Video` folder has the original
H.264 source, which is what's actually being converted from now. Filenames don't always match
1:1 between the two folders (e.g. Opinly's `Opinly-Website-V2.gif` is the same clip as
`Video/Slide-8.mp4` — confirmed by matching clip duration, not filename) — if adding a new clip,
verify by duration/content, don't assume the GIF and video folders name things the same way.
`TheDividendTracker/Video` also has near-duplicate exports (`Slide-7-1st.mp4` vs a
`9.44.34 PM`-suffixed version) — the plain filename without the timestamp suffix is the later,
final export; use that one.

Conversion: `ffmpeg -vf "scale='min(1280,iw)':-2,fps=30" -c:v libx264 -preset medium -crf 26 -pix_fmt yuv420p -movflags +faststart -an`,
plus a poster JPG grabbed at `-ss 0.4` into each clip. Source videos were already reasonably
sized (1.7-68MB); re-encoding from them (rather than from GIF) avoids an extra lossy round-trip
through GIF's palette and gets noticeably cleaner gradients/detail at a similar output size
(~22MB total across all 4 projects, vs the 600MB+ raw GIF exports).

Data model: `Project.media: MediaItem[]` (`{ src, poster, alt }`) replaces the old flat
`images: string[]`. `videoMedia(slug, count, name)` in `projects.ts` generates the array from the
`N.mp4`/`N-poster.jpg` naming convention — don't hand-write media entries, add/remove clips by
changing the `count` argument and re-running the conversion for that slug. Every clip is used now:
`media[0]` is the collapsed-row thumbnail *and* the case study's Context-adjacent clip, `media[1]`
sits after Challenge, and everything from `media[2]` onward renders as additional inline clips
after Approach (see `CaseStudyDetail.tsx`).

**Static images (2026-07-16):** `Project.images: ImageItem[]` (`{ src, alt }`), generated by
`imageGallery(slug, count, name)` from `~/Documents/Design Journey/Portfolio assets/V2/Images/`
— a flat folder of 27 generically-named PNGs (`image-01.png`...`image-27.png`) with **no
per-project grouping in the source**; which image belongs to which project was determined by
opening each one and reading the on-screen branding (Opinly=8, Lexora=7, Dividend Tracker=7,
FoodOps=5, in that source order). If more get added to that folder later, they'll need the same
manual visual sort — don't assume filename order maps to project boundaries. Converted from PNG
(some raw files were 4-6.5MB) to JPEG (`ffmpeg -vf "scale='min(1600,iw)':-2" -q:v 4`), landing at
56-292KB each. Rendered by `ImageGrid.tsx` in a `grid-cols-2 sm:grid-cols-3` layout, inserted in
`CaseStudyDetail.tsx` after the Approach beat's clips, before Outcomes.

The `<video autoPlay loop muted playsInline preload="metadata">` + `motion-reduce:` CSS-swap-to-
poster pattern (pure CSS, no JS, so `prefers-reduced-motion` users never trigger the video at all)
now has two call sites: the small always-visible thumbnail in each `WorkBrowser.tsx` row, and the
full-width `InlineVideo` helper inside `CaseStudyDetail.tsx`. There's no standalone `Gallery`
component — it was folded into `CaseStudyDetail` since it's only ever used there now.

## Work page architecture
**Went through several shapes over two days, each an explicit user decision — don't
"simplify" back to an earlier one without being asked:**
1. Full-page `/work/[slug]` case studies, linked from a `/work` grid.
2. Merged into `/` as a hover-swap "billboard" (matching vvichael.com's actual homepage,
   reverse-engineered via raw `curl` — see conversation history), stripped of narrative depth.
3. Narrative depth restored via an inline accordion (`CaseStudyDetail.tsx`), moved onto its own
   `/work` route — the user did not want home and work sharing one page/structure.
   `src/app/page.tsx` dropped to just `<Hero />`; `src/app/work/page.tsx` got its own `h1`/intro
   above `<WorkBrowser />`.
4. Step 3 made the homepage show *zero* projects, which turned out to be a step too far — the
   user still wanted a presence of work on `/`, just not a full duplicate of `/work`. Added
   `WorkTeaser.tsx`: a static (no autoplay video, genuinely lightweight) grid of all 4 project
   posters/names/taglines on `/`, each linking to `/work?open={slug}`.
5. The click-to-expand accordion was removed — every project's case study now renders inline and
   fully visible at all times, no toggle. `WorkBrowser.tsx` no longer has `expandedSlug` state, the
   `<button>`/`aria-expanded`/`aria-controls` toggle, the `CaretDown` icon, or the
   `AnimatePresence`/`motion.div` expand animation — the row header is now a plain
   (non-interactive) `<div>` and the case study sits directly beneath it, unconditionally. The
   `open={slug}` query param mechanism from step 4 still exists but is now purely a
   scroll-to-position aid (`scrollIntoView` on mount via `rowRefs`), since there's no longer an
   expand/collapse state to drive — a teaser click on the homepage still jumps you straight to that
   project's section, it just doesn't need to *open* anything first. Around this point the row
   header itself (thumbnail, number/industry tag, name, tagline) was also removed entirely — each
   project's `h3` name is now `sr-only`, and the case study starts immediately with no visible
   chrome above it. The `divide-y` between projects and each showcase's own internal `border-t`
   were removed too, so projects run together with no divider line at all.
6. **Current (2026-07-17):** `CaseStudyDetail.tsx` (the original talimi-style narrative — meta row
   + numbered `00 Context`→`04 Reflection` beats + Outcomes) was retired in favor of a single
   shared `ProjectShowcase.tsx` (`src/components/showcase/`), originally built as
   `OpinlyShowcase.tsx` for Opinly alone and then generalized to all 4 projects per explicit user
   request ("keep it consistent with other projects"). `CaseStudyDetail.tsx` itself is left in the
   tree, unused, rather than deleted — kept around in case it's still wanted as reference/rollback
   until the new layout is confirmed final.

`WorkBrowser.tsx` (rendered from `src/app/work/page.tsx`) maps every project straight to
`<ProjectShowcase project={project} />`, no per-project branching. `ProjectShowcase.tsx` is the
whole case-study layout: full-bleed hero, `ShowcaseHeadline` (mixed-weight "Name—description"),
Role/Areas/Scope meta row, two paired image/video rows, a full-bleed "secondary hero" (named after
Opinly's original content there — a literal marketing billboard photo — renamed once other
projects started using it for non-billboard content), a 3-stat Outcomes
row, and narrative paragraph blocks (via the internal `ParagraphPair`) interleaved with more
full-bleed video — see the file itself for the exact slot order, it's changed shape many times in
one session and this doc will go stale fast if the order gets duplicated here too.

**Placeholder content (2026-07-17):** only Opinly has its own dedicated, uploaded
`showcase-*.jpg`/`showcase-*.mp4` assets in `public/work/opinly/`. Every other project
(Lexora/The Dividend Tracker/FoodOps) reuses its existing `project.media`/`project.images`
(cycled via a `pick()` helper with modulo wraparound, so projects with fewer items than slots —
e.g. FoodOps' 3 media items across 4 video slots — still render something real rather than
breaking) to fill the exact same slots. This is explicitly temporary per the user: "I will give
you the exact information later on." `ProjectShowcase.tsx` branches on `project.slug === "opinly"`
to choose between the dedicated asset paths and the `pick()` fallback — when a project gets its
own dedicated showcase asset set (same `/work/{slug}/showcase-*` naming convention as Opinly),
add it to that branch rather than continuing to cycle placeholders for it.

The per-project accent mechanism (`data-project-accent` + inline CSS vars) is set once per row in
`WorkBrowser.tsx`, wrapping the whole `ProjectShowcase`, so a project's accent applies
consistently throughout.

See `.claude/rules/skills-used.md` for the full list of design/a11y skills run against this site and the conventions each one left behind — check it before making UI changes so new work doesn't drift from what was already fixed.

## Reference material
- `reference/vvichael/` — 6 screenshots of vvichael.com (Michael Lo's portfolio) saved as design
  inspiration, plus `NOTES.md` breaking down its typography (mixed serif + grotesk), functional
  chrome (live clock, contextual breadcrumb nav), the Overview/Index/Grid work-browsing modes,
  and strict monochrome palette. Not yet applied to this site — read `NOTES.md`'s "Takeaways"
  section before redesigning toward this direction, since a couple of its moves (em-dash in the
  wordmark) conflict with rules already locked in via `design-taste-frontend`.
- `reference/aaronpoe/` — 6 screenshots of aaronpoeandco.com (Aaron Poe), plus `NOTES.md`.
  Deliberately contrasting personality to vvichael: colorful, per-case-study brand-driven hero
  color instead of strict monochrome, floating pill nav, geometric sans only (no serif), Grid/List
  toggle per project. Its per-project accent-color idea directly conflicts with the current
  `Color Consistency Lock` (one accent site-wide) — see `NOTES.md` Takeaways before applying.
- `reference/talimi/` — 8 screenshots of talimi.de (Erfan Talimi), plus `NOTES.md`. The most
  narrative/editorial of the three: neutral monochrome chrome (closest to this project's current
  direction) but case studies read like written essays — numbered sections (0.0/1.0/2.0/3.0), real
  process artifacts (workshop photos, a WHY→HOW→WHAT diagram), and a closing outcome backed by real
  external proof (funding/acquisition news, investor logos). Its most distinctive move — case
  studies opening as a slide-over panel instead of a full page — is a real architecture decision,
  not a small tweak; see `NOTES.md` Takeaways.
- A blend of the three is now live (see `## Visual direction` for exactly what was taken from
  each). The `NOTES.md` files themselves are untouched historical reference — don't edit them to
  reflect what got applied; that record lives in `## Visual direction` instead.
- `reference/raggededge/` — 8 screenshots of one case study (raggededge.com/partnerships/granola),
  plus `NOTES.md`. Added 2026-07-22, not yet applied to this site. Closest in spirit to the talimi
  reference (narrative case studies, real process artifacts as evidence) but with a stricter
  two-track typography rule (bold sans for structure/stats, warm serif for narrative prose only)
  and stat figures prefixed with a small icon-in-circle instead of a bare number. See `NOTES.md`
  Takeaways — its icon+stat pattern is directly relevant to this site's own unrendered
  `outcome.title` field (see the `/work` case-study restructure discussion), and its serif/sans
  split would need the same explicit re-ask CLAUDE.md already requires before reintroducing a
  serif (see `## Stack`).

## Working with me
- Case study content changes should go through `src/data/projects.ts`, not be hardcoded in page components.
- When pulling new images from Figma, prefer the flattened `export` render for pure-visual gallery slides, and `rawImages` (not the composite) for slides that mix narrative text with mockups — the composite bakes caption text into the image.
- New scroll-triggered content should use the `Reveal` component (`src/components/Reveal.tsx`), not ad hoc `whileInView` calls — it already handles `prefers-reduced-motion`.
- Image containers use an inset `box-shadow` outline (`rgba(0,0,0,0.1)` light / `rgba(255,255,255,0.1)` dark), not a `border-border` class — tinted borders read as dirt on image edges.
- Decorative icons need `aria-hidden="true"`. Hover-only visual affordances need a `group-focus-visible:` equivalent. Don't skip heading levels.
