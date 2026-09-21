"use client";

import Link from "next/link";
import gsap from "gsap";
import { lenisInstance } from "./SmoothScroll";
import { REVEAL_EASE } from "@/lib/gsapEase";

/**
 * Hero.tsx's "SEE SELECTED WORK" pill — split out as its own client component
 * (2026-09-16) purely so it can own an onClick handler; Hero.tsx itself stays
 * a server component otherwise. `href` still points at `/#{slug}`, so the
 * button degrades to a plain (instant) anchor jump with no JS, or under
 * `prefers-reduced-motion` (SmoothScroll.tsx never mounts a Lenis instance
 * then, so `lenisInstance` is null and this falls through without calling
 * `preventDefault`).
 *
 * With Lenis present, `e.preventDefault()` stops next/link's own default
 * hash-scroll (an instant jump) and `lenisInstance.scrollTo(...)` animates
 * to the target instead — fluid motion for what's genuinely an in-page
 * scroll interaction, unlike WorkBrowser.tsx's `?open={slug}` deep link
 * (a page-to-page navigation, deliberately instant there — see that file's
 * own comment). No `offset` option here — WorkTeaser.tsx's `scroll-mt-24`
 * on the target row is enough on its own: Lenis's own `scrollTo` (see
 * node_modules/lenis/dist/lenis.mjs) already reads an HTMLElement target's
 * computed `scroll-margin-top` and subtracts it automatically
 * (`target = rect.top + animatedScroll - scrollMargin - scrollPadding`).
 * An earlier version of this also passed `offset: -96` to "match" that
 * class, which actually double-subtracted the clearance (96px from Lenis's
 * automatic scroll-margin read, then another 96px from the manual offset),
 * landing the row 192px down instead of 96px — confirmed by measuring
 * `#foodops`'s `getBoundingClientRect().top` after the animation settled.
 * Removing the redundant `offset` fixed it.
 *
 * `lenisInstance.resize()` immediately before `scrollTo()` is required, not
 * optional — same reasoning as WorkBrowser.tsx's own deep-link scroll:
 * `scrollTo()` clamps its target against Lenis's cached `limit`, and right
 * after mount that can still be stale/small (SmoothScroll.tsx's own resize
 * is staggered via setTimeout), silently clamping the scroll down to ~0.
 * Confirmed this exact failure empirically — omitting `resize()` here first
 * produced a click that called `preventDefault()` correctly but never
 * actually moved `scrollY` at all.
 *
 * `duration`/`easing` are both passed explicitly (2026-09-16, explicit
 * request — the un-tuned version felt too fast) for a real reason beyond
 * pacing: passing neither, per Lenis's own source
 * (node_modules/lenis/dist/lenis.mjs), skips its duration/easing tween
 * entirely and falls back to continuous per-frame `lerp` smoothing instead —
 * which is what actually shipped first and read as abrupt/un-eased, not a
 * deliberate glide. `easing: gsap.parseEase(REVEAL_EASE)` reuses the site's
 * one shared "premium" curve (gsapEase.ts, also driving RevealText.tsx's
 * scroll reveals) rather than Lenis's own default expo-out, so this scroll
 * shares the same motion language as the rest of the site; `parseEase`
 * returns a plain `(progress) => number` function, which is exactly the
 * shape Lenis's own `easing` option expects. 1.6s duration — longer than
 * Lenis's un-set default (which, per the fallback logic just above, doesn't
 * actually resolve to a fixed number at all in the lerp path) — chosen to
 * read as a deliberate glide down to the row rather than a rushed jump.
 */
export function SeeWorkButton({ targetSlug }: { targetSlug: string }) {
  return (
    <Link
      href={`/#${targetSlug}`}
      onClick={(e) => {
        if (!lenisInstance) return;
        const target = document.getElementById(targetSlug);
        if (!target) return;
        e.preventDefault();
        lenisInstance.resize();
        lenisInstance.scrollTo(target, {
          duration: 1.6,
          easing: gsap.parseEase(REVEAL_EASE),
        });
      }}
      className="group inline-flex h-12 w-fit items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium uppercase tracking-wide text-background active:scale-[0.96]"
    >
      {/* Hover-swap label, matching NavLink.tsx's own mechanic exactly (same
          duration/easing, same group-hover/group-focus-visible pairing, same
          motion-reduce full bypass) rather than a bespoke effect — see that
          file's own comment for why it's pure CSS transform, not
          motion/react. h-[20px]/leading-[20px] is NavLink's "md" box size
          (its own boxSize comment: sized for text-sm/14px content so the box
          comfortably clears descenders), reproduced directly here since this
          button isn't itself a NavLink (it needs its own onClick + pill
          styling, and NavLink's root is a Link, so it can't nest inside this
          one). */}
      <span className="relative inline-block h-[20px] overflow-hidden leading-[20px]">
        <span className="block transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-focus-visible:translate-y-0">
          SEE SELECTED WORK
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 translate-y-full transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:hidden"
        >
          SEE SELECTED WORK
        </span>
      </span>
    </Link>
  );
}
