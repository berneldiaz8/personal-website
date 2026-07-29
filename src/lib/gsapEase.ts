import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

/**
 * The site's shared "premium" entrance/reveal curve — equivalent to the
 * `cubic-bezier(0.16, 1, 0.3, 1)` previously used via motion/react's
 * Reveal.tsx and Hero.tsx, kept byte-identical so migrating those off
 * motion/react onto GSAP doesn't change the site's established motion
 * language. Registered once here (not inline in each caller) so both
 * Reveal.tsx and Hero.tsx share the same instance regardless of which
 * module's side effects run first.
 */
export const REVEAL_EASE = "revealEase";
CustomEase.create(REVEAL_EASE, "0.16, 1, 0.3, 1");
