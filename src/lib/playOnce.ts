/**
 * Tracks which keyed, mount-time-only animations (MountReveal.tsx's
 * callers — NavEntrance.tsx, GalleryFooterReveal.tsx) have already played
 * once this hard-load session, so a later remount of the same logical
 * reveal doesn't replay it.
 *
 * Needed specifically because /gallery lives outside the (site) route
 * group's persistent layout — navigating between it and any other route
 * fully unmounts/remounts Nav (and thus NavEntrance), giving it a fresh
 * component instance with fresh refs. `pageReady`/`navReady` being
 * already-resolved promises by that point doesn't prevent a replay; it just
 * means the replay starts almost immediately instead of being skipped.
 * A plain per-component `useRef` doesn't survive an unmount either — this
 * needs to be module-level state, same reasoning as pageReady.ts's own
 * mutable binding and PageTransition.tsx's `hasMountedBefore` flag.
 *
 * A single shared boolean (like those two) isn't enough here because there
 * are multiple *independent* reveals using this same mechanism (the nav row,
 * the gallery footer) — one shared flag would make the second one to mount
 * on a given page's first-ever load incorrectly think it already played.
 * Keyed by an arbitrary string per caller instead, so each reveal tracks its
 * own first-play independently.
 */
const played = new Set<string>();

export function hasPlayed(key: string): boolean {
  return played.has(key);
}

export function markPlayed(key: string): void {
  played.add(key);
}
