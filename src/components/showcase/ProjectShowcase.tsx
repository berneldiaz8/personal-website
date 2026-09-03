import Image from "next/image";
import type { Project } from "@/data/projects";
import { RevealText } from "../RevealText";
import { Grid } from "./Grid";
import { ShowcaseHeadline } from "./ShowcaseHeadline";
import { textStyles } from "@/lib/typography";
import { useFadeInOnLoad } from "@/lib/useFadeInOnLoad";
import { useVideoReady } from "@/lib/useVideoReady";
import { ensureVideoMuted } from "@/lib/ensureVideoMuted";
import { VideoLoadingSpinner } from "../VideoLoadingSpinner";
import { ImageSkeleton } from "../ImageSkeleton";

function ShowcaseImage({
  src,
  alt,
  aspect = "",
  bordered = true,
  sizes = "100vw",
  position = "object-center",
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  /** Omit when the wrapper's height is already driven by its parent (e.g. a
   * flex-1 child of a split-stacked column) rather than by its own ratio. */
  aspect?: string;
  bordered?: boolean;
  sizes?: string;
  position?: string;
  priority?: boolean;
  /** Extra classes appended to the wrapper — e.g. flex-1/min-h-0 for a
   * split-stacked slot whose height comes from its flex parent. */
  className?: string;
}) {
  const { loaded, onLoad } = useFadeInOnLoad(priority);
  return (
    <div
      className={`relative w-full overflow-hidden bg-background ${aspect} ${
        bordered
          ? "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
          : ""
      } ${className}`}
    >
      {/* No `forceDark`/width/height — unlike GalleryCarousel's lightbox
          usage, this renders in the normal tree (no portal to escape the
          site's token cascade) and this image is `object-cover` (always
          fills its box exactly, no letterboxing to replicate), so the
          plain inset-0 fill is correct as-is. bg-border resolves to the
          site's one fixed light-mode value (#e5e1d9) — the main site no
          longer has a dark palette to accidentally pick up (see
          globals.css; only /gallery's [data-force-dark] still does). */}
      <ImageSkeleton loaded={loaded} />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={90}
        priority={priority}
        onLoad={onLoad}
        className={`object-cover ${position} transition-opacity duration-500 motion-reduce:transition-none ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

function ShowcaseVideo({
  src,
  poster,
  alt,
  aspect = "",
  bordered = true,
  fillHeight = false,
  fillWidth = false,
  className = "",
}: {
  src: string;
  poster: string;
  alt: string;
  /** Omit when the wrapper's height is already driven by its parent (e.g. a
   * flex-1 child of a split-stacked column) rather than by its own ratio. */
  aspect?: string;
  bordered?: boolean;
  /** For portrait clips in a wider/square slot — scales to fill the
   * container's height and lets width follow the clip's own aspect ratio
   * (centered), instead of object-cover cropping the sides off to fill the
   * full width. */
  fillHeight?: boolean;
  /** Inverse of fillHeight — scales to fill the container's width and lets
   * height follow the clip's own aspect ratio (centered vertically), instead
   * of object-cover cropping the top/bottom off to fill the full height. */
  fillWidth?: boolean;
  /** Extra classes appended to the wrapper — e.g. flex-1/min-h-0 for a
   * split-stacked slot whose height comes from its flex parent. */
  className?: string;
}) {
  const letterboxed = fillHeight || fillWidth;
  const { ready, onLoadedData } = useVideoReady();
  return (
    <div
      className={`relative w-full overflow-hidden ${letterboxed ? "" : "bg-background"} ${aspect} ${
        bordered
          ? "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
          : ""
      } ${className}`}
      // Letterbox background behind fillHeight/fillWidth clips (a clip whose
      // aspect ratio doesn't match its slot) — a flat white bg reads as a bug
      // there, so this covers the visible letterbox bars with a soft
      // gradient instead.
      style={letterboxed ? { background: "linear-gradient(to bottom, #E9E8E6 0%, #DAD9D6 100%)" } : undefined}
    >
      <video
        ref={ensureVideoMuted}
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        onLoadedData={onLoadedData}
        className={
          fillHeight
            ? "absolute left-1/2 top-0 h-full w-auto -translate-x-1/2"
            : fillWidth
              ? "absolute left-0 top-1/2 h-auto w-full -translate-y-1/2"
              : "absolute inset-0 h-full w-full object-cover"
        }
      />
      <VideoLoadingSpinner ready={ready} />
    </div>
  );
}

function ParagraphPair({
  bodies,
  label,
  pt = "pt-20",
  pb = "pb-[136px]",
  showBorder = true,
}: {
  bodies: string[];
  label?: string;
  /** Top padding override — defaults to the original 80px. */
  pt?: string;
  /** Bottom padding override — defaults to the original 136px. */
  pb?: string;
  /** Set false to omit the full-bleed border above this block. */
  showBorder?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-3 px-6 ${pt} ${pb}`}>
      {/* Border spans full-bleed within this section's own inset (px-6 on the
          outer wrapper), not scoped to just the paragraph's own column — a
          12px gap (gap-3 on this wrapper) to the label/paragraph row below. */}
      {showBorder && <div className="border-t border-border" />}
      <Grid margin={false}>
        {label ? (
          <p
            className={`col-span-4 sm:col-span-4 lg:col-span-3 lg:col-start-4 ${textStyles.labelXs}`}
          >
            {label}
          </p>
        ) : (
          <div
            aria-hidden="true"
            className="col-span-4 hidden sm:col-span-4 sm:block lg:col-span-3 lg:col-start-4"
          />
        )}
        <div className="col-span-4 flex max-w-[65ch] flex-col gap-4 text-sm leading-relaxed text-foreground sm:col-span-4 lg:col-span-3 lg:col-start-7">
          {bodies.map((body, i) => (
            <p key={i}>{body}</p>
          ))}
        </div>
      </Grid>
    </div>
  );
}

/** Cycles through a project's existing media/images so every visual slot always has something, even for projects with fewer items than slots. */
function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

/**
 * Slugs with a real, dedicated hero asset uploaded to `public/work/{slug}/`
 * (`showcase-hero.jpg`). Every other media slot in the layout below (secondary
 * hero, image pairs, closing video, etc.) is a structural placeholder for all
 * 4 projects — Opinly's dedicated assets for those slots were pulled pending a
 * full media pass across every project, per the user: "I will be updating the
 * medias." Only the Hero stays real per project until then.
 */
const HAS_HERO_IMAGE = new Set(["opinly", "lexora", "the-dividend-tracker", "foodops"]);

/**
 * Full project case-study layout: hero, mixed-weight headline, meta row, paired
 * image/video rows, a secondary full-bleed hero, stats, and narrative paragraphs. Originally built for
 * Opinly (which has its own dedicated, uploaded showcase-*.jpg/mp4 assets) and now
 * shared by every project.
 *
 * PLACEHOLDER CONTENT (2026-07-17): only Opinly has its own dedicated showcase assets
 * so far. Every other project reuses its existing `project.media`/`project.images`
 * (cycled via `pick`) to fill the same slots — this is explicitly temporary, per the
 * user: "I will give you the exact information later on once all of the layout
 * structures are similar across all projects." When a project gets its own dedicated
 * showcase-*.jpg/mp4 set (following the `/work/{slug}/showcase-*` naming convention
 * already used by Opinly), swap its branch here to match Opinly's rather than
 * continuing to cycle placeholders.
 */
export function ProjectShowcase({
  project,
  priority = false,
}: {
  project: Project;
  /** True only for whichever project's hero is actually visible on load —
   * the first project by default, or the `?open={slug}` deep-linked one
   * when WorkBrowser.tsx jumps straight to a specific project (see its own
   * `openParam` handling). That hero is the page's LCP candidate, unlike
   * every other project's hero which sits below the fold until scrolled
   * to. Threads into next/image's `priority` so this one image gets
   * preloaded (a real <link rel="preload">) instead of the default
   * lazy/intersection-observer load, which otherwise leaves a genuine
   * blank gap (network fetch + decode) on first navigation to /work
   * before it's cached — confirmed via frame-by-frame screencast capture,
   * not assumed. */
  priority?: boolean;
}) {
  const headline =
    project.tagline.charAt(0).toLowerCase() + project.tagline.slice(1);
  const isOpinly = project.slug === "opinly";
  const hasHeroImage = HAS_HERO_IMAGE.has(project.slug);
  const base = `/work/${project.slug}`;

  return (
    <div className="flex flex-col">
      {/* ── HERO ── opening full-bleed image/video, the page's LCP candidate.
          Renders statically, no fade-on-scroll — the scroll-reveal fade
          (Reveal.tsx) was removed site-wide per explicit user request,
          alongside RevealWipe.tsx before it. */}
      {hasHeroImage ? (
        <ShowcaseImage
          src={`${base}/showcase-hero.jpg`}
          alt={
            project.slug === "the-dividend-tracker"
              ? `${project.name} dashboard shown on a phone, held next to a card`
              : project.slug === "foodops"
                ? `${project.name} products dashboard shown on a tablet`
                : `${project.name} dashboard shown on a laptop screen`
          }
          aspect="aspect-[16/10]"
          bordered={false}
          priority={priority}
        />
      ) : (
        <ShowcaseVideo
          src={pick(project.media, 0).src}
          poster={pick(project.media, 0).poster}
          alt={pick(project.media, 0).alt}
          aspect="aspect-[16/10]"
          bordered={false}
        />
      )}

      {/* ── HEADLINE ── mixed-weight "Name—description" display line. Owns
          its own bespoke scroll-reveal internally (two-beat word-mask), no
          RevealText wrapper needed here. */}
      <ShowcaseHeadline name={project.name} description={headline} caption={project.ndaCaption} />

      {/* ── META ROW ── Role / Services / Scope / Timeline, four even columns
          filling the full row width (no inner 6/6 grouping) — each item gets
          an equal share instead of Role/Services and Scope/Timeline competing
          for space within their own half. */}
      <div className="pt-6">
        {/* Inset to match the Grid's own margin (px-4 sm:px-5 lg:px-6) rather than
            full-bleed — same separator pattern as Footer.tsx / the /info page's
            Experience section. gap-3 (12px) to the meta row content below. */}
        <div className="mx-4 border-t border-border sm:mx-5 lg:mx-6" />
        <Grid as="dl" className="pt-3 pb-2">
          <div className="col-span-4 sm:col-span-4 lg:col-span-3">
            <RevealText as="dt" className={textStyles.showcaseMetaLabel}>
              Role
            </RevealText>
            {/* 1 column wide (col-span-1 of this row's own 4-col grid), 16px
                gap (gap-x-4) to the value on its left — same spacer pattern
                as the Outcomes row below. RevealText as="dt"/as="dd" — the
                real dt/dd element is itself the SplitText target, not
                nested inside a plain wrapper div, so it keeps its role and
                the dl's term/definition pairing stays intact for
                screen readers (confirmed via a real ARIA snapshot; see
                RevealText.tsx's own comment for why a plain-div wrapper
                broke this the first time). */}
            <div className="grid grid-cols-4 gap-x-4">
              <RevealText as="dd" className={`col-span-3 ${textStyles.showcaseMetaValue}`}>
                {project.role}
              </RevealText>
              <div aria-hidden="true" className="col-span-1" />
            </div>
          </div>
          <div className="col-span-4 sm:col-span-4 lg:col-span-3">
            <RevealText as="dt" className={textStyles.showcaseMetaLabel}>
              Scope
            </RevealText>
            <div className="grid grid-cols-4 gap-x-4">
              <RevealText as="dd" className={`col-span-3 ${textStyles.showcaseMetaValue}`}>
                {project.ownership}
              </RevealText>
              <div aria-hidden="true" className="col-span-1" />
            </div>
          </div>
          <div className="col-span-4 sm:col-span-4 lg:col-span-3">
            <RevealText as="dt" className={textStyles.showcaseMetaLabel}>
              Team
            </RevealText>
            <div className="grid grid-cols-4 gap-x-4">
              <RevealText as="dd" className={`col-span-3 ${textStyles.showcaseMetaValue}`}>
                {project.team}
              </RevealText>
              <div aria-hidden="true" className="col-span-1" />
            </div>
          </div>
          <div className="col-span-4 sm:col-span-4 lg:col-span-3">
            <RevealText as="dt" className={textStyles.showcaseMetaLabel}>
              Timeline
            </RevealText>
            <div className="grid grid-cols-4 gap-x-4">
              <RevealText as="dd" className={`col-span-3 ${textStyles.showcaseMetaValue}`}>
                {project.timeline}
              </RevealText>
              <div aria-hidden="true" className="col-span-1" />
            </div>
          </div>
        </Grid>
      </div>

      {/* ── MEDIA SINGLE ── directly below the meta row. Opinly and Lexora
          each have their own dedicated full-bleed asset now
          (showcase-app.mp4 / showcase-wb.mp4). The Dividend Tracker-only
          exception: this slot is split-width (two half columns) here instead
          of the single full-bleed block every other project uses. Every
          other project still placeholders pending a future media pass. */}
      {project.slug === "the-dividend-tracker" ? (
        <Grid className="pt-4 pb-6">
          <div className="col-span-4 sm:col-span-4 lg:col-span-6">
            <ShowcaseVideo
              src={`${base}/showcase-holdings.mp4`}
              poster={`${base}/showcase-holdings-poster.jpg`}
              alt="The Dividend Tracker portfolio dashboard on a phone mockup"
              aspect="aspect-[16/19]"
            />
          </div>
          <div className="col-span-4 sm:col-span-4 lg:col-span-6">
            <ShowcaseVideo
              src={`${base}/showcase-diversification.mp4`}
              poster={`${base}/showcase-diversification-poster.jpg`}
              alt="The Dividend Tracker sector and industry diversification donut charts"
              aspect="aspect-[16/19]"
            />
          </div>
        </Grid>
      ) : (
        <div className="px-4 pt-4 pb-6 sm:px-5 lg:px-6">
          {isOpinly ? (
            <ShowcaseVideo
              src={`${base}/showcase-app.mp4`}
              poster={`${base}/showcase-app-poster.jpg`}
              alt="Opinly product walkthrough"
              aspect="aspect-[16/9.5]"
            />
          ) : project.slug === "lexora" ? (
            <ShowcaseVideo
              src={`${base}/showcase-wb.mp4`}
              poster={`${base}/showcase-wb-poster.jpg`}
              alt="Lexora product walkthrough"
              aspect="aspect-[16/9.5]"
            />
          ) : project.slug === "foodops" ? (
            <ShowcaseVideo
              src={`${base}/showcase-app.mp4`}
              poster={`${base}/showcase-app-poster.jpg`}
              alt="FoodOps product walkthrough"
              aspect="aspect-[16/9.5]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="aspect-[16/9.5] w-full bg-neutral-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
            />
          )}
        </div>
      )}

      {/* ── CONTEXT ── labeled ParagraphPair, project.context. Line-mask
          reveal via RevealText — this is narrative prose, the flagship case
          for the per-line treatment. */}
      <RevealText>
        <ParagraphPair bodies={[project.context]} label="Context" />
      </RevealText>

      {/* ── THE PROBLEM ── labeled ParagraphPair, project.problem. Same
          treatment as Context above (line-mask reveal via RevealText) —
          replaced the old Overview/stats row so this reads as narrative
          prose instead of a stat block. */}
      <RevealText>
        <ParagraphPair bodies={[project.problem]} label="Problem" pt="pt-6" pb="pb-20" />
      </RevealText>

      {/* ── MEDIA GROUP A ── secondary hero (full-bleed) → idea-ads/table
          (2-paired split-width) → slide-video (full-bleed), all sharing one
          container instead of each sitting in its own. Full-bleed items span
          the full row (lg:col-span-12); the paired images keep their
          existing lg:col-span-6 half-width split. */}
      <Grid className="pt-6 pb-6">
        {project.slug === "the-dividend-tracker" ? (
          // The Dividend Tracker-only exception: full row order is
          // split-width → full-bleed → split-width-with-split-stacked,
          // instead of the full-bleed → split-width → full-bleed order
          // every other project uses for MEDIA GROUP A.
          <>
            {/* Row 1: split-width. */}
            <div className="col-span-4 sm:col-span-4 lg:col-span-6">
              <ShowcaseImage
                src={`${base}/showcase-signin.jpg`}
                alt="The Dividend Tracker sign-in screen reading 'Welcome back! Your dividends are waiting.'"
                aspect="aspect-[16/19]"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div className="col-span-4 sm:col-span-4 lg:col-span-6">
              <ShowcaseVideo
                src={`${base}/showcase-onboarding.mp4`}
                poster={`${base}/showcase-onboarding-poster.jpg`}
                alt="The Dividend Tracker onboarding screen reading 'Track Your Dividends with Ease'"
                aspect="aspect-[16/19]"
              />
            </div>

            {/* Row 2: full-bleed — moved here from the last-row position
                every other project uses. */}
            <div className="col-span-4 sm:col-span-8 lg:col-span-12">
              <ShowcaseImage
                src={`${base}/showcase-holdings-detail.jpg`}
                alt="The Dividend Tracker holdings detail, edit holdings, and retirement value conversion screens"
                aspect="aspect-[16/9.5]"
              />
            </div>

            {/* Row 3 (last row): split-width, right slot split-stacked —
                moved here from the middle-row position every other project
                uses. Split-height structure: outer wrapper carries the same
                aspect-[16/19] as the left slot so both columns end up
                exactly the same total height, two stacked placeholders
                inside are unitless flex children (no aspect ratio of their
                own) that split that fixed height evenly around the Grid's
                own gap value. */}
            <div className="col-span-4 sm:col-span-4 lg:col-span-6">
              <ShowcaseVideo
                src={`${base}/showcase-portfolio.mp4`}
                poster={`${base}/showcase-portfolio-poster.jpg`}
                alt="The Dividend Tracker portfolio dashboard on a phone mockup against a building backdrop"
                aspect="aspect-[16/19]"
              />
            </div>
            <div className="col-span-4 sm:col-span-4 lg:col-span-6">
              <div className="flex aspect-[16/19] w-full flex-col gap-3 sm:gap-4">
                <ShowcaseImage
                  src={`${base}/showcase-empty-portfolio.jpg`}
                  alt="The Dividend Tracker 'Add your first portfolio' empty state"
                  className="min-h-0 flex-1"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
                <ShowcaseImage
                  src={`${base}/showcase-portfolio-goals.jpg`}
                  alt="The Dividend Tracker 'View combined portfolio goals' promo card"
                  className="min-h-0 flex-1"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="col-span-4 sm:col-span-8 lg:col-span-12">
              {isOpinly ? (
                <ShowcaseImage
                  src={`${base}/showcase-secondary-hero.jpg`}
                  alt="Opinly Content Studio blog content list"
                  aspect="aspect-[16/9.5]"
                />
              ) : project.slug === "lexora" ? (
                <ShowcaseImage
                  src={`${base}/showcase-speakup.jpg`}
                  alt="Lexora Speak Up Program confidentiality policy page"
                  aspect="aspect-[16/9.5]"
                />
              ) : project.slug === "foodops" ? (
                <ShowcaseImage
                  src={`${base}/showcase-products.jpg`}
                  alt="FoodOps Products incoming shipments table"
                  aspect="aspect-[16/9.5]"
                />
              ) : (
                // Placeholder — real asset pending a future media pass.
                <div
                  aria-hidden="true"
                  className="aspect-[16/9.5] w-full bg-neutral-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                />
              )}
            </div>
            <div className="col-span-4 sm:col-span-4 lg:col-span-6">
              {isOpinly ? (
                <ShowcaseVideo
                  src={`${base}/showcase-card.mp4`}
                  poster={`${base}/showcase-card-poster.jpg`}
                  alt="Opinly product card"
                  aspect="aspect-[16/19]"
                  fillHeight
                />
              ) : project.slug === "lexora" ? (
                <ShowcaseImage
                  src={`${base}/showcase-submit-report.jpg`}
                  alt="Lexora Submit your report form with a reporting guide sidebar"
                  aspect="aspect-[16/19]"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              ) : project.slug === "foodops" ? (
                <ShowcaseImage
                  src={`${base}/showcase-prep-product.jpg`}
                  alt="FoodOps Preparation of new product form"
                  aspect="aspect-[16/19]"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              ) : (
                // Placeholder — real asset pending a future media pass.
                <div
                  aria-hidden="true"
                  className="aspect-[16/19] w-full bg-neutral-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                />
              )}
            </div>
            <div className="col-span-4 sm:col-span-4 lg:col-span-6">
              {isOpinly ? (
                <ShowcaseImage
                  src={`${base}/showcase-table.jpg`}
                  alt="Opinly content table showing published articles with author, date, and status"
                  aspect="aspect-[16/19]"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              ) : project.slug === "lexora" ? (
                <ShowcaseVideo
                  src={`${base}/showcase-meet.mp4`}
                  poster={`${base}/showcase-meet-poster.jpg`}
                  alt="Lexora video call interface showing participant tiles"
                  aspect="aspect-[16/19]"
                />
              ) : project.slug === "foodops" ? (
                <ShowcaseVideo
                  src={`${base}/showcase-spreadsheet.mp4`}
                  poster={`${base}/showcase-spreadsheet-poster.jpg`}
                  alt="FoodOps Generate sortable spreadsheets form"
                  aspect="aspect-[16/19]"
                />
              ) : (
                // Placeholder — real asset pending a future media pass.
                <div
                  aria-hidden="true"
                  className="aspect-[16/19] w-full bg-neutral-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                />
              )}
            </div>

            <div className="col-span-4 sm:col-span-8 lg:col-span-12">
              {isOpinly ? (
                <ShowcaseImage
                  src={`${base}/showcase-getting-started.jpg`}
                  alt="Opinly Getting Started onboarding checklist"
                  aspect="aspect-[16/9.5]"
                />
              ) : project.slug === "lexora" ? (
                <ShowcaseVideo
                  src={`${base}/showcase-cs.mp4`}
                  poster={`${base}/showcase-cs-poster.jpg`}
                  alt="Lexora Submitted reports case management table"
                  aspect="aspect-[16/9.5]"
                />
              ) : project.slug === "foodops" ? (
                <ShowcaseImage
                  src={`${base}/showcase-product-detail.jpg`}
                  alt="FoodOps product detail page with traceability information"
                  aspect="aspect-[16/9.5]"
                />
              ) : (
                // Placeholder — real asset pending a future media pass.
                <div
                  aria-hidden="true"
                  className="aspect-[16/9.5] w-full bg-neutral-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                />
              )}
            </div>
          </>
        )}
      </Grid>

      {/* ── THE WORK ── merged workIntro/workDetail/(optional workDetail2)/
          workClosing ParagraphPair, in that render order. Line-mask reveal
          (RevealText), same reasoning as Context above. */}
      <RevealText>
        <ParagraphPair
          bodies={[
            project.workIntro.body,
            project.workDetail.body,
            ...(project.workDetail2 ? [project.workDetail2.body] : []),
            project.workClosing.body,
          ]}
          label="Approach"
        />
      </RevealText>

      {/* ── THE OUTCOME ── labeled ParagraphPair, project.outcomeSummary. Same
          treatment as The Work above. pb-20 (80px) on every project, not the
          shared ParagraphPair default of pb-[136px]. */}
      <RevealText>
        <ParagraphPair
          bodies={[project.outcomeSummary]}
          label="Outcome"
          pt="pt-6"
          pb="pb-20"
        />
      </RevealText>

      {/* ── MEDIA GROUP B ── placeholder (full-bleed) → Image pair 1
          (audit/mockup, 2-paired) → placeholder (full-bleed) → closing video
          (full-bleed) — all one shared container. */}
      <Grid className="pt-6 pb-6">
        {/* Structural placeholder — not a real asset yet, same convention as
            the FoodOps slide-video/closing-video placeholders elsewhere in
            this file. First of two new full-bleed slots bracketing Image
            pair 1: this one → Image pair 1 → second placeholder → closing
            video. Removed for FoodOps specifically, per explicit request —
            its Media Group B starts directly at Image pair 1 instead. */}
        {isOpinly ? (
          <div className="col-span-4 sm:col-span-8 lg:col-span-12">
            <ShowcaseImage
              src={`${base}/showcase-cms-integration.jpg`}
              alt="Opinly CMS integration selection screen showing WordPress, Shopify, Wix, Squarespace, Webflow, and Framer options"
              aspect="aspect-[16/9.5]"
            />
          </div>
        ) : project.slug === "lexora" ? (
          <div className="col-span-4 sm:col-span-8 lg:col-span-12">
            <ShowcaseImage
              src={`${base}/showcase-case-report.jpg`}
              alt="Lexora case report detail view showing report CR-01192"
              aspect="aspect-[16/9.5]"
            />
          </div>
        ) : project.slug === "the-dividend-tracker" ? (
          <div className="col-span-4 sm:col-span-8 lg:col-span-12">
            <ShowcaseImage
              src={`${base}/showcase-watchlist-calendar.jpg`}
              alt="The Dividend Tracker watchlist, dividend calendar, and dividends payout screens"
              aspect="aspect-[16/9.5]"
            />
          </div>
        ) : (
          project.slug !== "foodops" && (
            <div aria-hidden="true" className="col-span-4 sm:col-span-8 lg:col-span-12">
              <div className="aspect-[16/9.5] w-full bg-neutral-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" />
            </div>
          )
        )}

        <div className="col-span-4 sm:col-span-4 lg:col-span-6">
          {isOpinly ? (
            <ShowcaseImage
              src={`${base}/showcase-audit.jpg`}
              alt="Opinly site audit modal showing a score of 93 out of 100"
              aspect="aspect-[16/19]"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          ) : project.slug === "lexora" ? (
            // Split-height variant, Lexora-only: the outer wrapper carries
            // the same aspect-[16/19] as the right slot so both columns end
            // up exactly the same total height — the two stacked
            // placeholders inside are unitless flex children (no aspect
            // ratio of their own) that split that fixed height evenly
            // around the Grid's own gap value.
            <div className="flex aspect-[16/19] w-full flex-col gap-3 sm:gap-4">
              <ShowcaseVideo
                src={`${base}/showcase-status.mp4`}
                poster={`${base}/showcase-status-poster.jpg`}
                alt="Lexora report status list animation"
                className="min-h-0 flex-1"
              />
              <ShowcaseImage
                src={`${base}/showcase-reports-heatmap.jpg`}
                alt="Lexora total reports heatmap by department"
                className="min-h-0 flex-1"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          ) : project.slug === "the-dividend-tracker" ? (
            <ShowcaseImage
              src={`${base}/showcase-goals-cashflow.jpg`}
              alt="The Dividend Tracker dividend calendar, portfolio goals, and cash flow plan screens"
              aspect="aspect-[16/19]"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          ) : project.slug === "foodops" ? (
            <ShowcaseVideo
              src={`${base}/showcase-mobile.mp4`}
              poster={`${base}/showcase-mobile-poster.jpg`}
              alt="FoodOps mobile scan screen against a commercial kitchen backdrop"
              aspect="aspect-[16/19]"
            />
          ) : (
            // Placeholder — real asset pending a future media pass.
            <div
              aria-hidden="true"
              className="aspect-[16/19] w-full bg-neutral-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
            />
          )}
        </div>
        <div className="col-span-4 sm:col-span-4 lg:col-span-6">
          {isOpinly ? (
            // Split-height variant, Opinly: same structure as Lexora/The
            // Dividend Tracker's split-stacked slots — outer wrapper carries
            // the aspect-[16/19] so this column matches its sibling's total
            // height, two flex-1 children (no aspect ratio of their own)
            // split that height evenly around the Grid's own gap value.
            <div className="flex aspect-[16/19] w-full flex-col gap-3 sm:gap-4">
              <ShowcaseVideo
                src={`${base}/showcase-pill.mp4`}
                poster={`${base}/showcase-pill-poster.jpg`}
                alt="Opinly product pill animation"
                className="min-h-0 flex-1"
              />
              <ShowcaseImage
                src={`${base}/showcase-traffic-chart.jpg`}
                alt="Opinly organic traffic comparison bar chart against competitors"
                className="min-h-0 flex-1"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          ) : project.slug === "lexora" ? (
            <ShowcaseImage
              src={`${base}/showcase-speakup-detail.jpg`}
              alt="Lexora Speak Up Program confidentiality policy page"
              aspect="aspect-[16/19]"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          ) : project.slug === "the-dividend-tracker" ? (
            <ShowcaseImage
              src={`${base}/showcase-market-summary.jpg`}
              alt="The Dividend Tracker AAPL market summary screen"
              aspect="aspect-[16/19]"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          ) : project.slug === "foodops" ? (
            <ShowcaseImage
              src={`${base}/showcase-product-details-panel.jpg`}
              alt="FoodOps product details panel with traceability information"
              aspect="aspect-[16/19]"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          ) : (
            // Placeholder — real asset pending a future media pass.
            <div
              aria-hidden="true"
              className="aspect-[16/19] w-full bg-neutral-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
            />
          )}
        </div>

        {/* Second of the two new placeholder slots — sits between Image
            pair 1 and the closing video. */}
        <div className="col-span-4 sm:col-span-8 lg:col-span-12">
          {isOpinly ? (
            <ShowcaseVideo
              src={`${base}/showcase-website-tour.mp4`}
              poster={`${base}/showcase-website-tour-poster.jpg`}
              alt="Opinly website tour"
              aspect="aspect-[16/9.5]"
            />
          ) : project.slug === "lexora" ? (
            <ShowcaseImage
              src={`${base}/showcase-reports-list.jpg`}
              alt="Lexora Submitted reports full list view"
              aspect="aspect-[16/9.5]"
            />
          ) : project.slug === "the-dividend-tracker" ? (
            <ShowcaseVideo
              src={`${base}/showcase-website-tour.mp4`}
              poster={`${base}/showcase-website-tour-poster.jpg`}
              alt="The Dividend Tracker website tour"
              aspect="aspect-[16/9.5]"
            />
          ) : project.slug === "foodops" ? (
            <ShowcaseImage
              src={`${base}/showcase-shipping-modal.jpg`}
              alt="FoodOps Shipping of products modal form"
              aspect="aspect-[16/9.5]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="aspect-[16/9.5] w-full bg-neutral-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
            />
          )}
        </div>

        <div className="col-span-4 sm:col-span-8 lg:col-span-12">
          {isOpinly ? (
            <ShowcaseImage
              src={`${base}/showcase-idea-ads.jpg`}
              alt="Opinly promotional ads reading 'Ditch the $200/month SEO stack. Get it all with Opinly.', 'Why pay $500 for one backlink?', and 'Too busy to optimize your site for Google?'"
              aspect="aspect-[16/9.5]"
            />
          ) : project.slug === "lexora" ? (
            <ShowcaseVideo
              src={`${base}/showcase-website-tour.mp4`}
              poster={`${base}/showcase-website-tour-poster.jpg`}
              alt="Lexora website tour"
              aspect="aspect-[16/9.5]"
            />
          ) : project.slug === "the-dividend-tracker" ? (
            <ShowcaseImage
              src={`${base}/showcase-marketing-cards.jpg`}
              alt="The Dividend Tracker promotional cards showing dividend tracking, investing decisions, and future income calculator"
              aspect="aspect-[16/9.5]"
            />
          ) : project.slug === "foodops" ? (
            <ShowcaseImage
              src={`${base}/showcase-traceability-plan.jpg`}
              alt="FoodOps Traceability Plan document view"
              aspect="aspect-[16/9.5]"
            />
          ) : (
            // Placeholder — real asset pending a future media pass.
            <div
              aria-hidden="true"
              className="aspect-[16/9.5] w-full bg-neutral-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
            />
          )}
        </div>
      </Grid>
    </div>
  );
}
