"use client";

import { useState } from "react";

/**
 * Small shared loading-state hook for next/image usages that previously had
 * no loading treatment at all (plain placeholder="empty" default — a blank
 * box until the network request resolves, then an abrupt pop-in). Pair with
 * a transition-opacity className gated on `loaded`, plus
 * motion-reduce:transition-none so reduced-motion users get the image
 * immediately with no animation, matching every other reduced-motion bypass
 * in this codebase.
 *
 * priority=true starts already "loaded" (no fade) — protects LCP-critical
 * images (the deep-linked project's hero, a carousel's first tile) from being
 * hidden behind a JS-gated opacity transition, which would otherwise delay
 * when the browser counts them as painted for Largest Contentful Paint.
 */
export function useFadeInOnLoad(priority = false) {
  const [loaded, setLoaded] = useState(priority);
  return { loaded, onLoad: () => setLoaded(true) };
}
