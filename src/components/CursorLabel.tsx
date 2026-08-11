"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Client-only detection for CursorLabel's portal mode, via useSyncExternalStore
// rather than typeof document !== "undefined" checked directly in render — a
// portal still occupies a slot in its owner's children for React's hydration
// reconciliation even though it physically renders elsewhere in the DOM, so a
// plain environment check (true on every client render, including the first
// hydration pass, but false during SSR) causes a real hydration mismatch: the
// server renders one fewer child there than the client immediately does.
// useSyncExternalStore's getServerSnapshot/getSnapshot split is the mechanism
// React provides specifically for this — it forces the first client render to
// also report false (matching the server), then flips to true on the very
// next render, after hydration has already reconciled successfully.
function subscribeNoop() {
  return () => {};
}
function getClientSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

/**
 * Cursor-follow label — a small pill that trails the mouse while hovering
 * the wrapped content, fading in/out on enter/leave. GSAP quickTo drives the
 * trailing motion (matching the rest of the site's GSAP-only approach — see
 * Reveal.tsx's note on dropping motion/react as a redundant second engine).
 * quickTo is GSAP's purpose-built utility for this exact case: repeated
 * rapid tweens (one per mousemove) without stacking/queuing.
 *
 * The pill stays visible across the whole wrapped area, not just over any
 * media inside it — but it switches appearance depending on what's under the
 * cursor: theme-adaptive (bg-background/text-foreground) while over an
 * element marked data-cursor-video-zone (the video, where content varies and
 * a page-background-colored pill stays legible), forced dark everywhere else
 * in the wrapped area (the plain page background, where a fixed dark pill
 * reads as a deliberate UI element rather than blending into a light theme).
 *
 * Reduced motion gets a full bypass, not a shortened version, matching every
 * other animation in this codebase — the label never appears at all, since
 * a cursor-follow affordance has no meaningful non-motion equivalent.
 *
 * Offset and shape both match a supplied reference screenshot: the pill
 * trails above-right of the cursor, and its corner radius is asymmetric —
 * full-rounded on top-left/top-right/bottom-right, square (no rounding) on
 * bottom-left (`rounded-tl-full rounded-tr-full rounded-br-full
 * rounded-bl-none` below), rather than `rounded-full` on all four. That
 * square corner is deliberate, not cosmetic: it's the corner meant to sit
 * near the cursor, and the pill is anchored by it (`xPercent: 0, yPercent:
 * -100` below sets the tracked (x, y) point to the pill's bottom-left
 * corner, not its center). Anchoring by a corner instead of the center is
 * what makes the cursor-to-pill gap consistent across instances whose label
 * text — and therefore pill width — differs ("View Project" vs "Focus" vs
 * "Close"): a center anchor combined with a fixed offset means a wider pill
 * pushes its near edge closer to the cursor and a narrower one pushes it
 * farther, so the same offsetX reads as a different gap depending on the
 * label. Anchoring the edge itself removes width from the equation entirely
 * — offsetX/offsetY become a literal, constant pixel gap from the cursor to
 * the pill's corner, regardless of how long the label is.
 *
 * offsetX/offsetY are overridable per instance, but every current usage
 * (WorkTeaser, both GalleryCarousel pills) relies on the shared default
 * precisely so they stay visually consistent — don't reintroduce a
 * per-instance override to compensate for pill width the way an earlier
 * version of GalleryCarousel's "Focus" pill did; that was working around the
 * old center-anchor behavior, which corner-anchoring now makes unnecessary.
 *
 * portal renders the pill itself into document.body via createPortal,
 * instead of as a normal absolutely-positioned child of this component's own
 * container — for a tracked area that sits inside a short overflow-hidden
 * ancestor (GalleryCarousel's carousel row, clipped so the looping track's
 * off-screen half stays hidden), the pill's own vertical offset can push it
 * above/below that row's bounds while the cursor is still near the row's top
 * or bottom edge, getting silently clipped — same failure mode the tile's
 * own overflow-hidden caused before it moved to an inner wrapper, just one
 * level up, at the row rather than the tile. Portaling escapes it the same
 * way GalleryLightbox already does. In portal mode the pill switches from
 * `position: absolute` (positioned via a transform offset from its
 * container's own rect) to `position: fixed` (viewport-relative, so the
 * transform is just the raw cursor position plus offset — no rect
 * subtraction needed, see reposition/repositionInstant below). The
 * The isClient guard (useSyncExternalStore, module-level subscribeNoop/
 * getClientSnapshot/getServerSnapshot above) exists because this label
 * renders on every pass (hidden at opacity 0, not gated behind interaction
 * the way GalleryLightbox's own portal is), so unlike that one, this can't
 * rely on being skipped server-side by a click-only state that's guaranteed
 * false on both the server and the client's first paint. A naive
 * `typeof document !== "undefined"` check doesn't work here even though it
 * looks equivalent: it's false during SSR but true from the very first
 * client render (document exists as soon as JS runs), so the server and the
 * client disagree about whether the portal's child slot exists at all —
 * React's hydration reconciler diffs a portal's presence against its owner's
 * other children the same as a normal child, even though the portal's actual
 * DOM insertion point is elsewhere, so this really did throw a hydration
 * mismatch when tried. useSyncExternalStore's getServerSnapshot/getSnapshot
 * split is the mechanism React provides specifically for this: it forces the
 * first client render to also report false (matching the server), then
 * flips true on the next render, safely after hydration has already
 * reconciled. z-index also bumps from z-10 to z-[60] in portal mode —
 * appended to document.body, the pill now competes in the site's top-level
 * stacking context (Nav is z-50) instead of a local one scoped to its own
 * tracked area, so it needs enough headroom to clear Nav if the two ever
 * visually overlap.
 */
const DEFAULT_OFFSET_X = 2;
const DEFAULT_OFFSET_Y = 4;

/**
 * Module-level "which instance is currently shown" registry — multiple
 * CursorLabel instances exist at once (one per project row on the
 * homepage), and on fast switching between adjacent rows, their
 * mouseenter/mouseleave can race (the new row's enter firing before the old
 * row's leave settles, or vice versa), briefly leaving two pills visible at
 * once. Every mouseenter force-hides whatever instance was previously
 * registered as active before showing itself, so at most one pill can ever
 * be visible, regardless of event ordering. Identity is tracked by a
 * per-instance Symbol (stable across renders via useRef) rather than by
 * comparing the hide callback itself, since that callback is recreated
 * every render.
 */
let activeInstanceId: symbol | null = null;
let activeHide: (() => void) | null = null;

export function CursorLabel({
  children,
  label,
  className = "",
  offsetX = DEFAULT_OFFSET_X,
  offsetY = DEFAULT_OFFSET_Y,
  portal = false,
}: {
  children: ReactNode;
  label: string;
  className?: string;
  offsetX?: number;
  offsetY?: number;
  portal?: boolean;
}) {
  const isClient = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const quickX = useRef<gsap.QuickToFunc | null>(null);
  const quickY = useRef<gsap.QuickToFunc | null>(null);
  const invertedRef = useRef(false);
  const isHoveringRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const instanceId = useRef(Symbol("cursor-label")).current;
  const [isInverted, setIsInverted] = useState(false);

  function hideInstantly() {
    isHoveringRef.current = false;
    // Unlike .to()/.fromTo(), gsap.set() does not auto-overwrite an in-flight
    // tween on the same properties — without killTweensOf, a still-running
    // enter fade-in (gsap.to opacity 0→1) keeps ticking after this "set" and
    // silently drags opacity back up, which read as a second pill staying
    // visible after its row was left.
    gsap.killTweensOf(labelRef.current, "opacity,scale");
    gsap.set(labelRef.current, { opacity: 0, scale: 0.85 });
  }

  useGSAP(
    () => {
      if (!labelRef.current) return;
      gsap.set(labelRef.current, { xPercent: 0, yPercent: -100 });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        quickX.current = gsap.quickTo(labelRef.current, "x", { duration: 0.18, ease: "expo.out" });
        quickY.current = gsap.quickTo(labelRef.current, "y", { duration: 0.18, ease: "expo.out" });
      });
      return () => mm.revert();
    },
    // isClient is required here for portal mode: the pill only actually
    // mounts into the DOM once isClient flips true (see the isClient doc
    // comment above), so on the very first run labelRef.current is still
    // null and this effect bails out via its own guard above. Without
    // isClient in this array, that bailout is permanent — effects don't
    // re-run just because a ref's target changes later, so quickX/quickY
    // would stay null forever and every reposition() call after the first
    // hover would silently no-op via its own null guard, freezing the pill
    // at wherever handleMouseEnter's repositionInstant last placed it (that
    // one only checks labelRef.current directly, so it still works — this
    // mismatch is what made the bug look like "the pill positions once on
    // enter, then never tracks further mousemove," specifically for portal
    // instances). Listing it here makes the effect re-run right after the
    // portal mounts, correctly picking up the now-valid labelRef.current.
    { scope: containerRef, dependencies: [isClient] },
  );

  const updateInverted = useCallback((target: EventTarget | Element | null) => {
    const overVideo = target instanceof Element && target.closest("[data-cursor-video-zone]") != null;
    const shouldInvert = !overVideo;
    if (shouldInvert !== invertedRef.current) {
      invertedRef.current = shouldInvert;
      setIsInverted(shouldInvert);
    }
  }, []);

  function reposition(clientX: number, clientY: number) {
    if (!quickX.current || !quickY.current) return;
    if (portal) {
      // Fixed positioning is already viewport-relative, matching clientX/Y's
      // own coordinate space directly — no container rect to subtract.
      quickX.current(clientX + offsetX);
      quickY.current(clientY - offsetY);
      return;
    }
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    quickX.current(clientX - rect.left + offsetX);
    quickY.current(clientY - rect.top - offsetY);
  }

  // Instant (un-eased) version of reposition, for scroll only — scroll moves
  // the page 1:1 with no easing of its own, so re-using the eased quickTo
  // trailing tween here means every scroll event restarts that tween toward
  // a constantly-moving target, which reads as laggy on fast/continuous
  // scroll instead of staying glued to the cursor.
  const repositionInstant = useCallback(
    (clientX: number, clientY: number) => {
      if (!labelRef.current) return;
      if (portal) {
        gsap.set(labelRef.current, { x: clientX + offsetX, y: clientY - offsetY });
        return;
      }
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      gsap.set(labelRef.current, {
        x: clientX - rect.left + offsetX,
        y: clientY - rect.top - offsetY,
      });
    },
    [offsetX, offsetY, portal],
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    reposition(e.clientX, e.clientY);
    updateInverted(e.target);
  }

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    // Force-hide whatever instance was previously active before showing
    // this one — see the module-level registry comment above for why.
    if (activeInstanceId !== instanceId && activeHide) {
      activeHide();
    }
    activeInstanceId = instanceId;
    activeHide = hideInstantly;

    isHoveringRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    // Instant position on entry, not the eased trailing tween — otherwise a
    // pill re-entering from a stale previous position (a prior hover
    // elsewhere, or its default corner) slides into place while also fading
    // in, which reads as a janky "flying label" instead of a clean reveal.
    // The eased quickTo trail only kicks back in on the next real mousemove.
    repositionInstant(e.clientX, e.clientY);
    updateInverted(e.target);
    gsap.to(labelRef.current, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" });
  }

  function handleMouseLeave() {
    if (activeInstanceId === instanceId) {
      activeInstanceId = null;
      activeHide = null;
    }
    hideInstantly();
  }

  // Scrolling (via Lenis, which drives real window scroll — see
  // SmoothScroll.tsx) moves the row under a stationary cursor without firing
  // any mouse events, so the pill would otherwise stay frozen at its
  // last-computed position and visibly drift away from the actual cursor.
  // Re-syncing on scroll, using the last known cursor position plus a fresh
  // container rect, keeps it glued to the cursor while hovering through a
  // scroll — instantly (repositionInstant), not through the eased quickTo
  // trailing tween mousemove uses, since scroll has no easing of its own to
  // match and re-triggering an eased tween on every scroll event reads as
  // laggy on fast/continuous scroll.
  useEffect(() => {
    function handleScroll() {
      if (!isHoveringRef.current) return;
      const { x, y } = lastMouseRef.current;
      repositionInstant(x, y);
      updateInverted(document.elementFromPoint(x, y));
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [repositionInstant, updateInverted]);

  const pill = (
    <div
      ref={labelRef}
      aria-hidden="true"
      className={`pointer-events-none ${portal ? "fixed z-[60]" : "absolute z-10"} left-0 top-0 scale-90 whitespace-nowrap rounded-tl-full rounded-tr-full rounded-br-full rounded-bl-none px-4 py-3 text-xs font-medium uppercase tracking-wide opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-colors duration-200 ${
        isInverted ? "bg-[#0c0c0d] text-[#f4f4f5]" : "bg-background text-foreground"
      }`}
    >
      {label}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {portal ? isClient && createPortal(pill, document.body) : pill}
    </div>
  );
}
