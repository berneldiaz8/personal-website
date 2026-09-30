/**
 * Resolves once LoadingScreen.tsx's full-viewport overlay has actually
 * finished (fonts + window "load" + its own minimum-display floor, or
 * immediately under reduced motion — see that component's own comment).
 * The shared reveal primitives (RevealText, ShowcaseHeadline via RevealText,
 * useMediaReveal, MountReveal) all await this before starting.
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
 * Client-side navigations have the same problem with PageTransition.tsx's
 * dark curtain, so the gate is re-armed on every navigation: PageTransition
 * calls holdPageReady() while rendering the incoming page (before any of
 * that page's children mount and read `pageReady`), then calls
 * markPageReady() once its curtain has fully faded in. `pageReady` is
 * therefore a reassigned `let`, not a const — ES module imports are live
 * bindings, so every consumer reading it at mount/effect time sees the
 * promise for the page it's actually on. Consumers must read it when they mount, never cache it
 * at module scope.
 */
let resolvePageReady: () => void;

export let pageReady = new Promise<void>((resolve) => {
  resolvePageReady = resolve;
});

/**
 * Earlier sibling of `pageReady`: resolves when the covering overlay
 * (LoadingScreen, or PageTransition's curtain) *starts* fading out — the
 * moment the page first becomes visible — rather than once it's fully gone.
 * For reveals that have nothing to hide behind of their own and would
 * otherwise sit visibly frozen through the fade (useMediaReveal's
 * curtain-less mode, i.e. the project Hero's scale-in). Re-armed and released
 * alongside `pageReady`, and never later than it.
 */
let resolvePageVisible: () => void;

export let pageVisible = new Promise<void>((resolve) => {
  resolvePageVisible = resolve;
});

export function markPageVisible() {
  resolvePageVisible();
}

export function markPageReady() {
  resolvePageVisible();
  resolvePageReady();
}

// Released anyway after this long, so a navigation React abandons mid-render
// (the incoming page's PageTransition never commits to release it) can't
// leave later reveals on the current page waiting forever.
const HOLD_FAILSAFE_MS = 5000;

/**
 * Re-arms `pageReady` and `pageVisible` as fresh pending promises;
 * markPageVisible() / markPageReady() release them.
 */
export function holdPageReady() {
  let release!: () => void;
  pageReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  resolvePageReady = release;
  let releaseVisible!: () => void;
  pageVisible = new Promise<void>((resolve) => {
    releaseVisible = resolve;
  });
  resolvePageVisible = releaseVisible;
  setTimeout(() => {
    releaseVisible();
    release();
  }, HOLD_FAILSAFE_MS);
}

type PageTransitionListener = (ready: Promise<void>) => void;
const transitionListeners = new Set<PageTransitionListener>();

/**
 * Subscribes to client-side page transitions, for chrome that persists
 * across them (Nav, in the (site) layout) and so never remounts to pick up
 * the new `pageReady` on its own. Called with that navigation's gate at the
 * moment the new page's curtain goes black. Returns an unsubscribe.
 */
export function onPageTransition(listener: PageTransitionListener) {
  transitionListeners.add(listener);
  return () => {
    transitionListeners.delete(listener);
  };
}

/** Called by PageTransition.tsx once its curtain is up. */
export function notifyPageTransition() {
  transitionListeners.forEach((listener) => listener(pageReady));
}
