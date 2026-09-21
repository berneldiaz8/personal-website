"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { projects } from "@/data/projects";
import { CursorLabel } from "./CursorLabel";
import { RevealText } from "./RevealText";
import { VideoLoadingSpinner } from "./VideoLoadingSpinner";
import { useVideoReady } from "@/lib/useVideoReady";
import { ensureVideoMuted } from "@/lib/ensureVideoMuted";
import { textStyles } from "@/lib/typography";

function accentStyle(accent: { light: string; dark: string }): CSSProperties {
  return {
    "--accent-light": accent.light,
    "--accent-dark": accent.dark,
  } as CSSProperties;
}

/** Every project's homepage preview reuses a dedicated, higher-quality
 * showcase clip already shown on /work, rather than falling back to
 * project.media[0] — Opinly's and FoodOps' product walkthroughs, Lexora's
 * Submitted reports case management table, and The Dividend Tracker's
 * portfolio dashboard mockup. */
function previewFor(project: Project) {
  if (project.slug === "opinly") {
    return {
      src: "/work/opinly/showcase-app.mp4",
      poster: "/work/opinly/showcase-app-poster.jpg",
    };
  }
  if (project.slug === "lexora") {
    return {
      src: "/work/lexora/showcase-cs.mp4",
      poster: "/work/lexora/showcase-cs-poster.jpg",
    };
  }
  if (project.slug === "foodops") {
    return {
      src: "/work/foodops/showcase-app.mp4",
      poster: "/work/foodops/showcase-app-poster.jpg",
    };
  }
  if (project.slug === "the-dividend-tracker") {
    return {
      src: "/work/the-dividend-tracker/showcase-portfolio-2.mp4",
      poster: "/work/the-dividend-tracker/showcase-portfolio-2-poster.jpg",
    };
  }
  return project.media[0];
}

/**
 * Extracted so useVideoReady (a hook) can be called once per project
 * instance rather than inside the parent's .map() callback, which the Rules
 * of Hooks disallow — same reasoning as GalleryCarousel.tsx's CarouselTile.
 */
function TeaserVideo({ preview, projectName }: { preview: { src: string; poster: string }; projectName: string }) {
  const { ready, onLoadedData } = useVideoReady();
  return (
    <div
      // lg:self-start overrides the parent's lg:items-stretch for this box
      // specifically — Safari resolves a stretched grid item's aspect-ratio
      // by computing height first (from the row's stretch target) and
      // deriving width backward from that — producing a much narrower box
      // than the col-span-8 track actually allows. Chrome resolves the same
      // markup correctly (width from the grid track, height derived forward
      // from aspect-ratio). Opting this item out of stretch removes the
      // ambiguity outright instead of depending on both engines agreeing on
      // resolution order.
      //
      // mt-2 (8px, 2026-09-16 explicit request), not pt-2 — the <video>
      // inside is `absolute inset-0`, and an absolutely positioned child's
      // containing block is its ancestor's *padding* box, which already
      // includes the padding area. Padding-top on this div wouldn't move
      // that boundary at all (the video would still render flush to the
      // very top, ignoring the padding entirely) — margin-top does, since
      // margin shifts the box itself in normal flow before the video's
      // inset:0 is even resolved against it.
      //
      // aspect-[4/3] on mobile, stepping up to 16/9 at sm+ (2026-09-21,
      // explicit request) — a taller, more mobile-native tile than 16:9 gave
      // at that width, without going tall enough (4:5, 1:1) to risk cropping
      // into UI content below the fold, since the video itself is
      // object-cover object-top and a taller box only ever crops from the
      // bottom.
      className="relative col-span-4 mt-2 aspect-[4/3] self-start overflow-hidden bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] sm:col-span-8 sm:aspect-[16/9] lg:col-span-8"
    >
      <video
        ref={ensureVideoMuted}
        src={preview.src}
        poster={preview.poster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={`${projectName} product walkthrough`}
        onLoadedData={onLoadedData}
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      <VideoLoadingSpinner ready={ready} />
    </div>
  );
}

export function WorkTeaser() {
  return (
    <section className="px-4 sm:px-5 lg:px-6">
      <h2 className="sr-only">Selected Work</h2>

      {/* Visible section label above the first row (2026-09-16, explicit
          request) — same font style as the /info page's "Experience"
          section label (`textStyles.eyebrowLg`). text-muted again (reverted
          from a brief text-foreground stint), which is exactly what
          `eyebrowLg` already provides, so back to using that token directly.
          Separate from the sr-only h2 above, which keeps the heading
          hierarchy intact; this is purely a visual label, not a second
          heading. */}
      <RevealText as="div" className="mb-3">
        <p className={textStyles.eyebrowLg}>(SELECTED WORKS)</p>
      </RevealText>

      <div className="flex flex-col">
        {projects.map((project, i) => {
          const preview = previewFor(project);
          // Per-row cascade (2026-09-16 and earlier) — each row's reveal
          // starts slightly after the previous one's, instead of every row
          // animating on the same timing basis. Restored after the
          // Reveal->RevealText migration dropped it (RevealText's `delay`
          // prop, added in this same diff for GalleryLightbox, covers it).
          const delay = i * 0.08;

          return (
            // border-t + the 200px gap to the next row live on this plain
            // wrapper, not the Link itself — a Link's hover/click box
            // covers its own padding too, so putting that spacing directly
            // on the Link made hovering the empty space below each row
            // trigger the cursor-follow label. This keeps the Link's box
            // tight to its actual visible content (text + video).
            //
            // id + scroll-mt-28 (2026-09-16, explicit request) — anchor
            // target for Hero.tsx's "SEE SELECTED WORK" button (`/#${slug}`
            // of the first project in `projects`). scroll-mt-28 (112px)
            // offsets the jump so this row's top clears Nav.tsx's `sticky
            // top-0` header instead of landing underneath it. SeeWorkButton.tsx
            // reads this same value automatically via Lenis's own
            // scroll-margin-top support — no separate offset to keep in sync.
            <div
              key={project.slug}
              id={project.slug}
              className="scroll-mt-28 border-t border-border pb-[200px]"
            >
              <Link href={`/work?open=${project.slug}`} data-project-accent style={accentStyle(project.accent)}>
                <CursorLabel
                  label="View case study"
                  portal
                  className="relative grid grid-cols-4 gap-y-6 pt-2 sm:grid-cols-8 lg:grid-cols-12 lg:items-stretch lg:gap-x-4"
                >
                  <div className="col-span-4 flex flex-col gap-4 sm:col-span-8 lg:col-span-3 lg:justify-between">
                    <RevealText
                      as="h3"
                      delay={delay}
                      // leading-[1], matching Hero.tsx's h1 (2026-09-16, explicit
                      // request) — the old leading-[1.2] existed to dodge
                      // RevealText's SplitText mask clipping descender ink at
                      // tight leading (see ShowcaseHeadline.tsx's own comment for
                      // the mechanism), but that's since been fixed at the source
                      // (`.reveal-line-mask` in globals.css carries its own
                      // headroom now), so leading-[1] is safe here the same way
                      // it already is on Hero.tsx/ShowcaseHeadline.tsx.
                      className="text-balance text-3xl font-medium leading-[1] tracking-[-0.4px] sm:text-4xl"
                    >
                      {project.slug === "the-dividend-tracker" ? (
                        <>
                          The Dividend
                          <br />
                          Tracker
                        </>
                      ) : (
                        project.name
                      )}
                    </RevealText>
                    <RevealText as="div" delay={delay} className="flex flex-col gap-5">
                      {/* headingXl (20px), down from heading2xl (24px,
                          2026-09-21, explicit request) — scoped to this call
                          site only, not a change to the shared heading2xl
                          token, since /info and ProjectShowcase.tsx both
                          still use heading2xl and weren't asked to shrink. */}
                      <p className={`w-full text-pretty ${textStyles.headingXl}`}>
                        {project.tagline}
                      </p>
                    </RevealText>
                  </div>
                  {/* 1-column gap between the text and video columns, matching
                      the site's 12-col grid (only meaningful at lg, where the
                      grid actually has 12 tracks — 3 text + 1 gap + 8 video). */}
                  <div aria-hidden="true" className="hidden lg:col-span-1 lg:block" />
                  <TeaserVideo preview={preview} projectName={project.name} />
                </CursorLabel>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
