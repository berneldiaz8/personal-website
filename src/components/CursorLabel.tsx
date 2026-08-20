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
 * Cursor-follow label — bare text that trails the mouse while hovering the
 * wrapped content, fading in/out on enter/leave. GSAP quickTo drives the
 * trailing motion (matching the rest of the site's GSAP-only approach — this
 * codebase migrated fully off motion/react, one engine instead of two, since
 * GSAP was already required for WorkBrowser's pin-based stacking and
 * SmoothScroll's Lenis sync, which motion/react has no equivalent for).
 * quickTo is GSAP's purpose-built utility for this exact case: repeated
 * rapid tweens (one per mousemove) without stacking/queuing.
 *
 * Color: `mix-blend-mode: difference` on white text, not a solid background
 * pill. Per-pixel, the browser composites `abs(255 - backdrop)`, so the label
 * self-inverts against literally whatever is underneath it — dark on a white
 * page background, light on a dark video frame, a shifted hue mid-word if the
 * cursor crosses a color boundary — with no JS needed to classify what's
 * beneath it. Reverse-engineered from a reference recording
 * (Recordings/Cursor.mov, a dothings.co-style site) that does the same thing;
 * confirmed by cropping frames where the label crossed from a white page
 * background onto an orange product bottle — the text went from near-black to
 * a blue-shifted hue, matching abs(255-white)=black and
 * abs(255-orange)=blue-ish exactly. This replaced an earlier version that
 * force-swapped between two hardcoded colors via a `data-cursor-video-zone`
 * attribute check (only binary: "is the cursor over the one video element in
 * this tracked area, or not") — mix-blend-mode gets continuous, per-pixel
 * correctness for free and needed zero markup changes at any call site.
 *
 * Reduced motion gets a full bypass, not a shortened version, matching every
 * other animation in this codebase — the label never appears at all, since
 * a cursor-follow affordance has no meaningful non-motion equivalent.
 *
 * Offset matches a supplied reference screenshot: the label trails
 * above-right of the cursor. `xPercent: 0, yPercent: -100` anchors the
 * tracked (x, y) point to the label's own bottom-left corner rather than its
 * center — what makes the cursor-to-label gap consistent across instances
 * whose text differs ("More" vs "Focus" vs "Close"): a center anchor
 * combined with a fixed offset means a wider label pushes its near edge
 * closer to the cursor and a narrower one pushes it farther, so the same
 * offsetX would read as a different gap depending on the label. Anchoring the
 * corner instead removes text width from the equation entirely — offsetX/
 * offsetY become a literal, constant pixel gap from the cursor to that
 * corner, regardless of how long the label is.
 *
 * offsetX/offsetY are overridable per instance, but every current usage
 * (WorkTeaser, both GalleryCarousel labels) relies on the shared default
 * precisely so they stay visually consistent — don't reintroduce a
 * per-instance override to compensate for label width the way an earlier
 * version of GalleryCarousel's "Focus" label did; that was working around the
 * old center-anchor behavior, which corner-anchoring now makes unnecessary.
 *
 * portal renders the label itself into document.body via createPortal,
 * instead of as a normal absolutely-positioned child of this component's own
 * container. Two independent reasons a call site needs it:
 *
 * 1. Overflow clipping — for a tracked area that sits inside a short
 * overflow-hidden ancestor (GalleryCarousel's carousel row, clipped so the
 * looping track's off-screen half stays hidden), the label's own vertical
 * offset can push it above/below that row's bounds while the cursor is still
 * near the row's top or bottom edge, getting silently clipped — same failure
 * mode the tile's own overflow-hidden caused before it moved to an inner
 * wrapper, just one level up, at the row rather than the tile.
 *
 * 2. mix-blend-mode isolation — `mix-blend-mode: difference` only blends
 * against content painted within the same CSS stacking context. Any ancestor
 * with a non-"none" `transform` (or opacity<1, filter, isolation: isolate,
 * etc.) creates a new one, trapping the blend inside it. This was originally
 * root-caused on WorkTeaser's rows, back when they were wrapped in
 * Reveal.tsx (since removed — its final opacity-only form wouldn't have
 * triggered this, but an earlier version also animated `y`, which left a
 * GSAP-applied `transform` on the row even after the scroll-reveal finished):
 * without portal, hovering genuinely empty space within that row (no other
 * painted content in that exact spot, inside the isolated subtree) left the
 * label with nothing local to diff against, so it painted its literal white
 * source color, invisible against the real page's white background.
 * Portaling to document.body sidesteps this class of bug entirely regardless
 * of what (if anything) transforms/isolates a given call site's ancestors.
 *
 * Portaling escapes both the same way GalleryLightbox already does for the
 * first one. In portal mode the label switches from
 * `position: absolute` (positioned via a transform offset from its
 * container's own rect) to `position: fixed` (viewport-relative, so the
 * transform is just the raw cursor position plus offset — no rect
 * subtraction needed, see reposition/repositionInstant below). The isClient
 * guard (useSyncExternalStore, module-level subscribeNoop/getClientSnapshot/
 * getServerSnapshot above) exists because this label renders on every pass
 * (hidden at opacity 0, not gated behind interaction the way GalleryLightbox's
 * own portal is), so unlike that one, this can't rely on being skipped
 * server-side by a click-only state that's guaranteed false on both the
 * server and the client's first paint. A naive `typeof document !==
 * "undefined"` check doesn't work here even though it looks equivalent: it's
 * false during SSR but true from the very first client render (document
 * exists as soon as JS runs), so the server and the client disagree about
 * whether the portal's child slot exists at all — React's hydration
 * reconciler diffs a portal's presence against its owner's other children the
 * same as a normal child, even though the portal's actual DOM insertion point
 * is elsewhere, so this really did throw a hydration mismatch when tried.
 * useSyncExternalStore's getServerSnapshot/getSnapshot split is the mechanism
 * React provides specifically for this: it forces the first client render to
 * also report false (matching the server), then flips true on the next
 * render, safely after hydration has already reconciled. z-index also bumps
 * from z-10 to z-[60] in portal mode — appended to document.body, the label
 * now competes in the site's top-level stacking context (Nav is z-50) instead
 * of a local one scoped to its own tracked area, so it needs enough headroom
 * to clear Nav if the two ever visually overlap.
 */
const DEFAULT_OFFSET_X = 16;
const DEFAULT_OFFSET_Y = -36;

/**
 * Module-level "which instance is currently shown" registry — multiple
 * CursorLabel instances exist at once (one per project row on the
 * homepage), and on fast switching between adjacent rows, their
 * mouseenter/mouseleave can race (the new row's enter firing before the old
 * row's leave settles, or vice versa), briefly leaving two labels visible at
 * once. Every mouseenter force-hides whatever instance was previously
 * registered as active before showing itself, so at most one label can ever
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
  reverse = false,
}: {
  children: ReactNode;
  label: string;
  className?: string;
  offsetX?: number;
  offsetY?: number;
  portal?: boolean;
  // Flips the direction of the label text-slide (see the useGSAP block
  // below): false (default) exits upward/enters from below, true exits
  // downward/enters from above — mirroring NavLink.tsx's own hover-out,
  // which reverses direction rather than replaying the hover-in motion
  // backward-in-time-but-same-direction. Callers with a two-state toggle
  // (FooterWordmark's "Copy Email" / "Email Copied") pass the inverse of
  // whichever boolean drives the label, so the "forward" change (e.g. to
  // "Email Copied") slides one way and reverting slides the other.
  reverse?: boolean;
}) {
  const isClient = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const quickX = useRef<gsap.QuickToFunc | null>(null);
  const quickY = useRef<gsap.QuickToFunc | null>(null);
  const isHoveringRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const instanceId = useRef(Symbol("cursor-label")).current;
  // Decoupled from the `label` prop on purpose — the DOM text only ever
  // updates from inside the timeline below, at the exact moment the old text
  // has slid out of view. Binding the span directly to `label` would have
  // React repaint the new text immediately on prop change (React commits
  // before this component's effects run), which would already show the new
  // text during what's supposed to be the *old* text's exit animation.
  const [displayedLabel, setDisplayedLabel] = useState(label);
  const prevLabelRef = useRef(label);

  // NavLink.tsx-style slide: the current text slides up out of view, then
  // (once offscreen, past the overflow-hidden clip on the pill below) the
  // new text is swapped in below the fold and slides up into place — same
  // motion as NavLink's hover swap, just driven by a prop change through one
  // element instead of two elements toggled by CSS hover. Only ever fires
  // today for FooterWordmark's "Copy Email" / "Email Copied" swap; every
  // other CursorLabel usage passes a static label for its whole mount, so
  // label === prevLabelRef.current there and this never runs.
  useGSAP(
    () => {
      if (label === prevLabelRef.current) return;
      prevLabelRef.current = label;
      if (!textRef.current) {
        setDisplayedLabel(label);
        return;
      }
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline()
          .to(textRef.current, { yPercent: reverse ? 100 : -100, duration: 0.16, ease: "power2.in" })
          .call(() => setDisplayedLabel(label))
          .set(textRef.current, { yPercent: reverse ? -100 : 100 })
          .to(textRef.current, { yPercent: 0, duration: 0.16, ease: "power2.out" });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        setDisplayedLabel(label);
      });
      return () => mm.revert();
    },
    { dependencies: [label, reverse] },
  );

  function hideInstantly() {
    isHoveringRef.current = false;
    // Unlike .to()/.fromTo(), gsap.set() does not auto-overwrite an in-flight
    // tween on the same properties — without killTweensOf, a still-running
    // enter fade-in (gsap.to opacity 0→1) keeps ticking after this "set" and
    // silently drags opacity back up, which read as a second label staying
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
    // isClient is required here for portal mode: the label only actually
    // mounts into the DOM once isClient flips true (see the isClient doc
    // comment above), so on the very first run labelRef.current is still
    // null and this effect bails out via its own guard above. Without
    // isClient in this array, that bailout is permanent — effects don't
    // re-run just because a ref's target changes later, so quickX/quickY
    // would stay null forever and every reposition() call after the first
    // hover would silently no-op via its own null guard, freezing the label
    // at wherever handleMouseEnter's repositionInstant last placed it (that
    // one only checks labelRef.current directly, so it still works — this
    // mismatch is what made the bug look like "the label positions once on
    // enter, then never tracks further mousemove," specifically for portal
    // instances). Listing it here makes the effect re-run right after the
    // portal mounts, correctly picking up the now-valid labelRef.current.
    { scope: containerRef, dependencies: [isClient] },
  );

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
    // label re-entering from a stale previous position (a prior hover
    // elsewhere, or its default corner) slides into place while also fading
    // in, which reads as a janky "flying label" instead of a clean reveal.
    // The eased quickTo trail only kicks back in on the next real mousemove.
    repositionInstant(e.clientX, e.clientY);
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
  // any mouse events, so the label would otherwise stay frozen at its
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
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [repositionInstant]);

  const pill = (
    <div
      ref={labelRef}
      aria-hidden="true"
      className={`pointer-events-none select-none ${
        portal ? "fixed z-[60]" : "absolute z-10"
      } left-0 top-0 scale-90 overflow-hidden whitespace-nowrap text-xs font-medium uppercase leading-4 tracking-wide text-white opacity-0 [mix-blend-mode:difference]`}
    >
      <span ref={textRef} className="block">
        {displayedLabel}
      </span>
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
