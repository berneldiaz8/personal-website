"use client";

import { useState } from "react";

/**
 * Tracks whether a <video> has real playable data yet (onLoadedData), for
 * driving a loading-spinner overlay. Unlike useFadeInOnLoad.ts, this never
 * touches the video/poster's own opacity — the video always paints at its
 * native, browser-controlled timing. A <video poster> is a valid Largest
 * Contentful Paint candidate; gating its own visibility on a JS load event
 * would delay when the browser counts it as painted, the same risk that
 * excluded videos from the image fade-in work. The spinner this hook drives
 * is a decorative overlay only — it never modifies the video/poster itself.
 */
export function useVideoReady() {
  const [ready, setReady] = useState(false);
  return { ready, onLoadedData: () => setReady(true) };
}
