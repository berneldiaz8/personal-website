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
 *
 * `h-[16px] overflow-hidden` on the Link matches the Logo's own height
 * exactly, so it doubles as a mask box — the *stationary* window
 * NavEntrance.tsx slides the Logo itself (`data-nav-mount`) up out of/into on
 * mount, same trick NavLink's `boxSize` wrappers use for their hover swap.
 * The transform has to live on the Logo, not this Link — the Link is what
 * carries `overflow-hidden`, so animating it directly would move the clip
 * boundary along with the content instead of revealing anything through it.
 *
 * `invisible` prop (2026-09-26) fades this out while Nav.tsx's mobile menu is
 * open, rather than snapping — Nav's header background itself no longer
 * changes at all while open (see Nav.tsx's own comment), so this and the
 * Menu button are the only things left there that visibly change, and doing
 * that instantly read as a hard pop against an otherwise-smooth open/close.
 * `opacity`/`visibility` both sit in `transition-property` (not just
 * `opacity`) so this keeps the same accessibility guarantee the instant-
 * `invisible` version had — a `visibility` transition still switches to
 * `hidden` only once the fade-out finishes (removing it from the tab order
 * and accessibility tree only once it's actually invisible), but switches
 * back to `visible` immediately when fading back in, matching how CSS
 * defines transitioning that property either direction. Same cubic-bezier
 * NavLink.tsx's own hover-swap already uses (`[0.16, 1, 0.3, 1]`, the CSS
 * form of gsapEase.ts's shared REVEAL_EASE), for the same "premium" feel,
 * and the same `motion-reduce:transition-none` escape hatch NavLink already
 * has, so the swap is instant rather than animated under reduced motion.
 */
export function WordmarkLink({ invisible = false }: { invisible?: boolean }) {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      aria-label="berneldiaz, home"
      className={`col-span-2 block h-[16px] w-fit overflow-hidden transition-[opacity,visibility] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:col-span-2 lg:col-span-3 ${invisible ? "invisible opacity-0" : "visible opacity-100"}`}
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
      <Logo data-nav-mount className="h-[16px] w-auto text-foreground" aria-hidden="true" />
    </Link>
  );
}
