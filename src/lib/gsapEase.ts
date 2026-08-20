import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

/**
 * The site's shared "premium" entrance/reveal curve — equivalent to the
 * `cubic-bezier(0.16, 1, 0.3, 1)` previously used via motion/react, before
 * this codebase migrated fully onto GSAP (kept byte-identical at the time so
 * that migration didn't change the site's established motion language).
 * Registered once here (not inline in each caller) so every consumer —
 * currently RevealText.tsx and ShowcaseHeadline.tsx for scroll reveals,
 * GalleryCarousel.tsx, and NavLink.tsx's CSS cubic-bezier equivalent — shares
 * the same instance regardless of which module's side effects run first.
 */
export const REVEAL_EASE = "revealEase";
CustomEase.create(REVEAL_EASE, "0.16, 1, 0.3, 1");
