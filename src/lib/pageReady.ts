/**
 * Resolves once LoadingScreen.tsx's full-viewport overlay has actually
 * finished (fonts + window "load" + its own minimum-display floor, or
 * immediately under reduced motion — see that component's own comment).
 * The shared scroll-reveal primitives (RevealText, ShowcaseHeadline) both
 * await this before creating their ScrollTrigger.
 *
 * Without this gate: GSAP's ScrollTrigger fires its bound animation
 * immediately upon creation if the trigger element is already past its
 * "start" point — true for anything above the fold on a fresh page load.
 * Since LoadingScreen is just a `z-[200]` overlay and doesn't block the rest
 * of the tree from mounting underneath it, those reveals were completing
 * while still hidden behind it — by the time the overlay faded out, the
 * "reveal" had already silently finished, so above-the-fold content (Hero's
 * h1, /work's hero headline) just appeared instantly with no visible
 * animation on a hard refresh.
 *
 * Root layout mounts LoadingScreen exactly once per hard navigation
 * (client-side `<Link>` route changes never remount it), so this promise
 * resolves once and stays resolved for the rest of the session — components
 * mounting on later SPA navigations see an already-resolved promise and
 * proceed with no added delay, identical to their pre-gate behavior.
 */
let resolvePageReady: () => void;

export const pageReady = new Promise<void>((resolve) => {
  resolvePageReady = resolve;
});

export function markPageReady() {
  resolvePageReady();
}
