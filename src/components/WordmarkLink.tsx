"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { Logo } from "./Logo";
import { lenisInstance } from "./SmoothScroll";
import { REVEAL_EASE } from "@/lib/gsapEase";

/**
 * Nav.tsx's wordmark — split out as its own client component (2026-09-16)
 * purely so it can own an onClick handler; Nav.tsx itself stays a server
 * component otherwise, same pattern as Hero.tsx/SeeWorkButton.tsx.
 *
 * SmoothScroll.tsx already resets scroll to top on every route change, but
 * that reset is keyed off `usePathname()` — clicking this link while
 * already on "/" doesn't change the pathname, so nothing fires and the
 * click silently no-ops instead of scrolling up (explicit bug report:
 * clicking the wordmark from partway down the homepage did nothing).
 * `pathname !== "/"` lets every other case (already on a different route,
 * or a first click from "/") fall through to next/link's normal navigation
 * — only an already-on-the-homepage click gets intercepted here.
 *
 * `lenisInstance.scrollTo(0, {...})` animates back to the top (2026-09-16,
 * explicit request — an earlier version used `immediate: true` to mirror
 * SmoothScroll.tsx's own instant route-change reset, but a same-page click
 * reads better as a deliberate glide than a hard snap). Same
 * `duration`/`easing` recipe as SeeWorkButton.tsx: `gsap.parseEase
 * (REVEAL_EASE)` reuses the site's one shared "premium" curve rather than
 * Lenis's own default expo-out, and an explicit `duration` is required for
 * Lenis to actually run this as a tween at all — passing neither
 * duration nor easing falls back to Lenis's continuous per-frame `lerp`
 * smoothing instead (see SeeWorkButton.tsx's own comment for the full
 * source-level reasoning). `window.scrollTo(0, 0)` fallback when Lenis
 * isn't mounted (`prefers-reduced-motion`) stays instant — no animation to
 * gate there either way.
 *
 * `lenisInstance.resize()` right before `scrollTo()`, same as
 * SeeWorkButton.tsx and for the same reason (that file's own comment has the
 * full explanation): `scrollTo()` clamps its target against Lenis's cached
 * `limit`, which can still be stale/small right after mount. The target here
 * is always `0`, so a stale limit clamping "down toward 0" can't actually be
 * observed today — but calling `resize()` first costs nothing and avoids the
 * same landmine resurfacing if this ever scrolls to a non-zero target.
 */
export function WordmarkLink() {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      aria-label="berneldiaz, home"
      className="col-span-2 w-fit sm:col-span-2 lg:col-span-3"
      onClick={(e) => {
        if (pathname !== "/") return;
        e.preventDefault();
        if (lenisInstance) {
          lenisInstance.resize();
          lenisInstance.scrollTo(0, {
            duration: 1.6,
            easing: gsap.parseEase(REVEAL_EASE),
          });
        } else {
          window.scrollTo(0, 0);
        }
      }}
    >
      <Logo className="h-[16px] w-auto text-foreground" aria-hidden="true" />
    </Link>
  );
}
