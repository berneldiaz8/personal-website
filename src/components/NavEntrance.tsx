"use client";

import type { ReactNode } from "react";
import { pageReady } from "@/lib/pageReady";
import { markNavReady } from "@/lib/navReady";
import { MountReveal } from "./MountReveal";

/**
 * Mount-time entrance for Nav.tsx's whole row (wordmark + Work/Info/Gallery
 * links) — a thin, nav-specific wrapper around MountReveal.tsx (see that
 * file for the actual mask/stagger/reduced-motion mechanics, shared with
 * GalleryInfoRow's own entrance). This file only wires up nav's two specific
 * timing dependencies: wait for `pageReady` before starting, and call
 * `markNavReady()` once mostly done.
 *
 * Why not route through RevealText/SplitText instead: the wordmark is a Logo
 * SVG, not a text node, so SplitText's line-detection has nothing to split
 * there; and each NavLink is already a single line ("Work,", "Info",
 * "Gallery"), so SplitText's per-line masking would produce exactly one
 * mask, no different a result than animating the link's own content
 * directly — while also fighting NavLink's own hover-swap spans, which
 * already occupy that same box for a *different* transform.
 *
 * markNavReady() (src/lib/navReady.ts) is what lets RevealText.tsx's
 * above-the-fold instances (Hero's h1, etc.) — and GalleryInfoRow's own
 * MountReveal on /gallery — start only once this nav reveal is underway,
 * producing one deliberate top-to-bottom stagger across a page instead of
 * reveals racing each other. MountReveal calls it before the tween's true
 * completion on purpose (see that file's comment) — waiting for full
 * completion read as a dead pause, since REVEAL_EASE's tail is
 * barely-perceptible motion by the time it actually finishes.
 */
export function NavEntrance({ children }: { children: ReactNode }) {
  return (
    <MountReveal waitFor={pageReady} onDone={markNavReady} playKey="nav-entrance">
      {children}
    </MountReveal>
  );
}
