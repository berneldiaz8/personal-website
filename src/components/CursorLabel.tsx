"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

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
 * rounded-bl-none` below), rather than `rounded-full` on all four.
 */
const LABEL_OFFSET_X = 66;
const LABEL_OFFSET_Y = 22;

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
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
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
      gsap.set(labelRef.current, { xPercent: -50, yPercent: -50 });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        quickX.current = gsap.quickTo(labelRef.current, "x", { duration: 0.18, ease: "expo.out" });
        quickY.current = gsap.quickTo(labelRef.current, "y", { duration: 0.18, ease: "expo.out" });
      });
      return () => mm.revert();
    },
    { scope: containerRef },
  );

  function updateInverted(target: EventTarget | Element | null) {
    const overVideo = target instanceof Element && target.closest("[data-cursor-video-zone]") != null;
    const shouldInvert = !overVideo;
    if (shouldInvert !== invertedRef.current) {
      invertedRef.current = shouldInvert;
      setIsInverted(shouldInvert);
    }
  }

  function reposition(clientX: number, clientY: number) {
    if (!quickX.current || !quickY.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    quickX.current(clientX - rect.left + LABEL_OFFSET_X);
    quickY.current(clientY - rect.top - LABEL_OFFSET_Y);
  }

  // Instant (un-eased) version of reposition, for scroll only — scroll moves
  // the page 1:1 with no easing of its own, so re-using the eased quickTo
  // trailing tween here means every scroll event restarts that tween toward
  // a constantly-moving target, which reads as laggy on fast/continuous
  // scroll instead of staying glued to the cursor.
  function repositionInstant(clientX: number, clientY: number) {
    if (!labelRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    gsap.set(labelRef.current, {
      x: clientX - rect.left + LABEL_OFFSET_X,
      y: clientY - rect.top - LABEL_OFFSET_Y,
    });
  }

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
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        ref={labelRef}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 z-10 scale-90 whitespace-nowrap rounded-tl-full rounded-tr-full rounded-br-full rounded-bl-none px-4 py-3 text-xs font-medium uppercase tracking-wide opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-colors duration-200 ${
          isInverted ? "bg-[#0c0c0d] text-[#f4f4f5]" : "bg-background text-foreground"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
