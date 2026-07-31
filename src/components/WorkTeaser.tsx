"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { projects } from "@/data/projects";
import { CursorLabel } from "./CursorLabel";
import { Reveal } from "./Reveal";
import { VideoLoadingSpinner } from "./VideoLoadingSpinner";
import { useVideoReady } from "@/lib/useVideoReady";
import { ensureVideoMuted } from "@/lib/ensureVideoMuted";

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
 * of Hooks disallow — same reasoning as GalleryMarquee.tsx's MarqueeTile.
 */
function TeaserVideo({ preview, projectName }: { preview: { src: string; poster: string }; projectName: string }) {
  const { ready, onLoadedData } = useVideoReady();
  return (
    <div
      data-cursor-video-zone
      // lg:self-start overrides the parent's lg:items-stretch for this box
      // specifically — Safari resolves a stretched grid item's aspect-ratio
      // by computing height first (from the row's stretch target) and
      // deriving width backward from that — producing a much narrower box
      // than the col-span-8 track actually allows. Chrome resolves the same
      // markup correctly (width from the grid track, height derived forward
      // from aspect-ratio). Opting this item out of stretch removes the
      // ambiguity outright instead of depending on both engines agreeing on
      // resolution order.
      className="relative col-span-4 aspect-[16/9] self-start overflow-hidden bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] sm:col-span-8 lg:col-span-8"
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
    <section className="px-6">
      <h2 className="sr-only">Selected Work</h2>

      <div className="flex flex-col">
        {projects.map((project, i) => {
          const preview = previewFor(project);

          return (
            <Reveal key={project.slug} delay={i * 0.08}>
              {/* border-t + the 184px gap to the next row live on this plain
                  wrapper, not the Link itself — a Link's hover/click box
                  covers its own padding too, so putting that spacing directly
                  on the Link made hovering the empty space below each row
                  trigger the cursor-follow label. This keeps the Link's box
                  tight to its actual visible content (text + video). */}
              <div className="border-t border-border pb-[184px]">
                <Link href={`/work?open=${project.slug}`} data-project-accent style={accentStyle(project.accent)}>
                  <CursorLabel
                    label="View Project"
                    className="relative grid grid-cols-4 gap-y-6 pt-4 sm:grid-cols-8 lg:grid-cols-12 lg:items-stretch lg:gap-x-4"
                  >
                    <div className="col-span-4 flex flex-col gap-4 sm:col-span-8 lg:col-span-3 lg:justify-between">
                      <h3 className="text-balance text-3xl font-medium leading-[1.1] tracking-[-0.4px] sm:text-4xl">
                        {project.slug === "the-dividend-tracker" ? (
                          <>
                            The Dividend
                            <br />
                            Tracker
                          </>
                        ) : (
                          project.name
                        )}
                      </h3>
                      <div className="flex flex-col gap-5">
                        <p className="w-full text-pretty text-xs font-medium uppercase leading-[18px] text-foreground">
                          {project.slug === "foodops" ? (
                            "Product. Design System. PRD Documentation."
                          ) : project.slug === "opinly" ? (
                            <>
                              Product. Website. Design System.
                              <br />
                              Digital Creatives
                            </>
                          ) : project.slug === "lexora" ? (
                            <>
                              Product. Website. Design System.
                              <br />
                              Digital Creatives.
                            </>
                          ) : (
                            project.areas
                          )}
                        </p>
                        <p className="w-full text-pretty text-xs font-normal uppercase leading-[18px] text-foreground">
                          {project.tagline}
                        </p>
                      </div>
                    </div>
                    {/* 1-column gap between the text and video columns, matching
                        the site's 12-col grid (only meaningful at lg, where the
                        grid actually has 12 tracks — 3 text + 1 gap + 8 video). */}
                    <div aria-hidden="true" className="hidden lg:col-span-1 lg:block" />
                    <TeaserVideo preview={preview} projectName={project.name} />
                  </CursorLabel>
                </Link>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
