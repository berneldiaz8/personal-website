/**
 * Callback ref that explicitly sets the `muted` DOM property on mount,
 * fired synchronously as soon as the video node is created — as early as
 * possible in React's lifecycle, before the browser evaluates autoplay
 * eligibility. This is in addition to the JSX `muted` attribute, not a
 * replacement for it: iOS's stricter mobile autoplay engine has documented
 * cases of not reliably trusting the muted *attribute* alone on a
 * React-rendered <video>, even though the same markup autoplays correctly
 * on every desktop engine (confirmed working via automated Safari, Chrome,
 * and Firefox testing — this is specifically a real-device iOS gap that
 * desktop testing tools can't catch, since desktop Safari doesn't enforce
 * the same mobile-specific autoplay restrictions).
 */
export function ensureVideoMuted(el: HTMLVideoElement | null) {
  if (el) el.muted = true;
}
