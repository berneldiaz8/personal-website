/**
 * Resolves once NavEntrance.tsx's mount-time nav reveal (wordmark +
 * Work/Info/Gallery) has fully finished. RevealText.tsx awaits this
 * alongside pageReady before creating its ScrollTrigger, so anything that
 * would otherwise reveal immediately on load (Hero's h1, /work's hero
 * headline) starts only after the nav row finishes instead of racing it —
 * one top-to-bottom stagger across the page rather than two simultaneous
 * reveals. Below-the-fold RevealText instances aren't meaningfully delayed
 * by this: their own ScrollTrigger already gates them on the user actually
 * scrolling there, by which point nav has long since finished.
 *
 * Same one-resolve-per-hard-load lifecycle as pageReady.ts (see that
 * module's own comment for the full mechanism) — resolves once and stays
 * resolved for the rest of the session, so anything mounting on a later
 * client-side navigation sees an already-resolved promise and proceeds with
 * no added delay.
 */
let resolveNavReady: () => void;

export const navReady = new Promise<void>((resolve) => {
  resolveNavReady = resolve;
});

export function markNavReady() {
  resolveNavReady();
}
