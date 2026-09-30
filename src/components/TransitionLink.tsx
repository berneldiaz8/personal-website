"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { fadeOutThenNavigate } from "./PageTransition";

/**
 * Drop-in `next/link` replacement for internal route links: fades the
 * current page out to black (PageTransition.tsx's curtain) before
 * navigating, so the new page's own curtain — which mounts already black,
 * holds, then fades in — picks up exactly where this one left off.
 *
 * Hooks in via Link's `onNavigate`, which Next only calls for real
 * client-side navigations — modifier-clicks, `target="_blank"`, `mailto:`,
 * and any click an `onClick` already `preventDefault()`ed (WordmarkLink's
 * and SeeWorkButton's same-page smooth scrolls) never reach it, so all of
 * those keep their normal behavior untouched.
 *
 * Skipped (plain navigation, no fade out) when the pathname isn't changing,
 * e.g. `/work` -> `/work?open=...`: template.tsx only remounts on a route
 * segment change, so no new curtain would ever mount to fade the black back
 * out. Also skipped under reduced motion, matching PageTransition's own
 * full bypass.
 */
export function shouldFadeOut(href: string) {
  if (new URL(href, location.href).pathname === location.pathname) return false;
  return !matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function TransitionLink({
  href,
  scroll,
  replace,
  onNavigate,
  onBeforeNavigate,
  ...props
}: ComponentProps<typeof Link> & {
  href: string;
  /**
   * Runs once the fade out has fully covered the screen, right before the
   * route change — only when the fade actually runs (see shouldFadeOut()).
   * For UI that should vanish unseen behind the black rather than animate
   * away in plain view first (MobileMenu's panel).
   */
  onBeforeNavigate?: () => void;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      scroll={scroll}
      replace={replace}
      onNavigate={(e) => {
        onNavigate?.(e);
        if (!shouldFadeOut(href)) return;

        e.preventDefault();
        fadeOutThenNavigate(() => {
          onBeforeNavigate?.();
          const options = scroll === undefined ? undefined : { scroll };
          if (replace) router.replace(href, options);
          else router.push(href, options);
        });
      }}
      {...props}
    />
  );
}
