"use client";

import type { ReactNode } from "react";
import { pageReady } from "@/lib/pageReady";
import { MountReveal } from "./MountReveal";

/**
 * Mount-time entrance for Nav.tsx's whole row (wordmark + Work/Info/Gallery/
 * Contact) — a thin, nav-specific wrapper around MountReveal.tsx (see that
 * file for the actual mask/stagger/reduced-motion mechanics, shared with
 * GalleryInfoRow's own entrance). This file only wires up nav's one timing
 * dependency: wait for `pageReady` before starting.
 *
 * Why not route through RevealText/SplitText instead: the wordmark is a Logo
 * SVG, not a text node, so SplitText's line-detection has nothing to split
 * there; and each NavLink is already a single line ("Work,", "Info",
 * "Gallery"), so SplitText's per-line masking would produce exactly one
 * mask, no different a result than animating the link's own content
 * directly — while also fighting NavLink's own hover-swap spans, which
 * already occupy that same box for a *different* transform.
 *
 * This reveal used to also call a `markNavReady()` callback partway through,
 * letting RevealText.tsx's above-the-fold instances (Hero's h1, etc.) and
 * GalleryInfoRow's own entrance on /gallery start only once this nav reveal
 * was underway — one continuous top-to-bottom wave chaining nav into
 * whatever came next. Both of those cross-reveal dependencies were removed
 * per explicit request (2026-09-23; see RevealText.tsx's and
 * GalleryFooterReveal.tsx's own comments), so `onDone`/`navReady`
 * (src/lib/navReady.ts) had no remaining callers and were deleted. Nav's own
 * internal link-to-link stagger (MountReveal's `STAGGER`) is unaffected —
 * only the wave connecting nav's reveal to a *different* reveal is gone.
 */
export function NavEntrance({ children }: { children: ReactNode }) {
  return (
    <MountReveal waitFor={pageReady} playKey="nav-entrance">
      {children}
    </MountReveal>
  );
}
