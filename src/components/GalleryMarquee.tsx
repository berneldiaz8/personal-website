"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { MarqueeItem } from "@/data/galleryMarquee";
import { useFadeInOnLoad } from "@/lib/useFadeInOnLoad";
import { CursorLabel } from "./CursorLabel";

// Tuned so a full loop takes ~40s at a 1440x900 viewport (was 40px/s, ~144s)
// — still a constant px/second, not a fixed duration, so this is a speed
// recalibration, not a switch to "always loops in exactly 40s regardless of
// viewport" (see the comment below on why duration is derived, not fixed).
const PX_PER_SECOND = 144;

/**
 * Infinite horizontal marquee for /gallery. The item list is rendered twice
 * back-to-back in one flex track, then the track is tweened from xPercent 0
 * to -50 on an infinite linear loop — since the second half is an exact
 * duplicate of the first, the wrap is invisible, reading as one continuous
 * strip rather than a jump-cut. ease: "none" is load-bearing, not a default
 * left in place: an eased loop pulses/stutters at the seam, where a marquee's
 * premium feel specifically comes from constant, unbroken speed.
 *
 * Duration is computed from the track's real rendered width (once duplicated)
 * against a fixed px/second, not a flat duration — so perceived scroll speed
 * stays constant regardless of how many items end up in the row, instead of
 * silently speeding up or slowing down whenever the item count changes.
 *
 * Reduced motion: deliberately NOT bypassed, unlike every other animation in
 * this codebase (2026-07-31) — the scroll always runs regardless of
 * prefers-reduced-motion. This marquee is presenting actual portfolio work,
 * not a decorative motion effect, so it's treated the same as video content
 * (see ShowcaseVideo/WorkTeaser, which similarly ignore reduced motion for
 * the same reason) rather than pure UI chrome like the Hero fade-up or
 * scroll-reveals, which still respect it. The per-tile fade-in-on-load and
 * hover-caption transitions below are genuinely decorative, though, and
 * still bypass for reduced motion as normal.
 *
 * Pause-on-hover: the whole track pauses while the pointer is anywhere over
 * the strip (not per-tile), then resumes on leave.
 *
 * Each tile is sized by height (h-full w-auto), not width, so a flat `sizes`
 * value on the <Image> would be wrong for half the row: landscape tiles
 * (~1.68:1) render noticeably wider than portrait ones (~0.84:1) at the same
 * height, and a value tuned for one systematically under-serves the other,
 * which next/image's optimizer resolves by picking a smaller srcset
 * candidate than the tile actually needs — a real, confirmed cause of
 * visibly blurry tiles here (the browser then upscales that undersized
 * source via CSS). `sizes` is computed per item instead, from its own real
 * aspect ratio against the page's marquee area height (see gallery/page.tsx's
 * `h-[19vh]`) — if that value changes, this multiplier should move with it.
 * quality={90} matches ProjectShowcase.tsx's
 * ShowcaseImage convention (75 is next/image's own default, deliberately
 * not used site-wide per next.config.ts's own comment on the two allowed
 * qualities).
 *
 * Click-to-open: each tile is a real <button>, not a div with an onClick, so
 * it's reachable and activatable by keyboard for free. The lightbox itself
 * is rendered via createPortal into document.body rather than inline in this
 * tree: this
 * component's own wrapper is `overflow-hidden` (needed to clip the
 * off-screen half of the looping track), and a `position: fixed` overlay
 * nested inside an `overflow-hidden` ancestor still gets visually clipped to
 * that ancestor's box in every major browser despite being viewport-relative
 * — portaling to `document.body` sidesteps that entirely. `document.body` is
 * safe to reference directly (no SSR guard needed) since `selected` only
 * ever becomes truthy from a click handler, which can't run during server
 * rendering.
 *
 * Each tile also gets its own CursorLabel (the same cursor-follow pill
 * WorkTeaser.tsx uses for "View Project"), labeled "Focus" to signal the
 * click-to-open interaction. One instance per tile (24, given the doubled
 * track) rather than one shared instance for the whole strip, so the pill
 * only appears over an actual image, not the small gaps between tiles.
 * CursorLabel's own module-level "one visible at a time" registry already
 * handles the resulting fast enter/leave races between adjacent tiles.
 *
 * CursorLabel gets a tighter offsetX/offsetY here (24/16) than its 66/22
 * default: that default was tuned against WorkTeaser's ~1000px+ wide row, and
 * on a tile as narrow as ~150px (a portrait item at this marquee's 19vh
 * height) it read as disproportionately far from the actual cursor. Tighter
 * offset alone wasn't enough to avoid clipping, though — the tile's own
 * overflow-hidden was moved off the CursorLabel-tracked button onto an inner
 * wrapper around just the Image/caption, so the pill is never clipped by the
 * tile's own edge, but the marquee row itself is *also* overflow-hidden (it
 * has to be, to hide the looping track's off-screen half) and exactly 19vh
 * tall — hovering near the row's top or bottom edge still pushes the pill
 * past that outer boundary and clips it there instead. `portal` (see
 * CursorLabel.tsx) fixes this the same way GalleryLightbox already escapes
 * its own overflow-hidden ancestor: it renders the pill into document.body
 * via createPortal rather than positioning it inside the row at all.
 *
 */

/**
 * Extracted so useFadeInOnLoad (a hook) can be called once per tile instance
 * rather than inside the parent's .map() callback, which the Rules of Hooks
 * disallow.
 */
function MarqueeTile({
  item,
  priority,
  onSelect,
}: {
  item: MarqueeItem;
  priority: boolean;
  onSelect: (trigger: HTMLButtonElement) => void;
}) {
  const { loaded, onLoad } = useFadeInOnLoad(priority);
  return (
    <button
      type="button"
      className="relative block h-full shrink-0 cursor-pointer appearance-none border-0 bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      onClick={(event) => onSelect(event.currentTarget)}
      aria-label={`View ${item.project} — ${item.label} full size`}
    >
      <CursorLabel label="Focus" offsetX={24} offsetY={16} portal className="relative block h-full">
        <div className="relative h-full w-auto overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
          <Image
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            className={`h-full w-auto object-cover transition-opacity duration-500 motion-reduce:transition-none ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            sizes={`${((item.width / item.height) * 19).toFixed(0)}vh`}
            quality={90}
            priority={priority}
            onLoad={onLoad}
          />
        </div>
      </CursorLabel>
    </button>
  );
}

/**
 * Full-screen lightbox for a selected tile. `py-12` (48px top/bottom, per
 * the requested fit) constrains the box the image centers in; next/image
 * `fill` + `object-contain` inside that box scales the image down to fit
 * within it while preserving aspect ratio, so it's correct for both the wide
 * landscape and tall portrait tiles in this data set without separate cases.
 *
 * Click-anywhere-to-close: unlike a typical lightbox, clicking the image
 * itself also closes, not just the surrounding backdrop — there's no
 * stopPropagation on the image wrapper, so every click bubbles to the
 * dialog's own onClick={onClose}. A CursorLabel (label="Close", default
 * offset — this tracked area is viewport-sized, the same scale as
 * WorkTeaser's row, not GalleryMarquee's tight per-tile offset) spans the
 * whole dialog so the cursor-follow pill communicates that everywhere, not
 * just close via a click.
 *
 * No visible close button — the dialog itself (tabIndex={-1}) is the focus
 * target instead: it receives focus on open (announced via role="dialog"
 * aria-modal aria-label) and Tab is redirected back onto it, so keyboard
 * focus can't leak onto the page underneath even with nothing else
 * focusable inside. Escape still closes regardless of what's focused (the
 * keydown listener is document-level, not tied to any element); mouse users
 * close via the click-anywhere behavior above. Focus returns to the tile
 * that opened the dialog on close either way.
 */
function GalleryLightbox({
  item,
  onClose,
  returnFocusRef,
}: {
  item: MarqueeItem;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = returnFocusRef.current;
    dialogRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "Tab") {
        event.preventDefault();
        dialogRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [onClose, returnFocusRef]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.project} — ${item.label}`}
      tabIndex={-1}
      className="fixed inset-0 z-[100] bg-black/90 py-12 focus:outline-none"
      onClick={onClose}
    >
      <CursorLabel
        label="Close"
        className="relative flex h-full w-full cursor-pointer items-center justify-center"
      >
        <div className="relative h-full w-full">
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="100vw"
            quality={90}
            className="object-contain"
          />
        </div>
      </CursorLabel>
    </div>
  );
}

export function GalleryMarquee({ items }: { items: MarqueeItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState<MarqueeItem | null>(null);

  function handleSelect(item: MarqueeItem, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setSelected(item);
    tweenRef.current?.pause();
  }

  function handleClose() {
    setSelected(null);
    tweenRef.current?.play();
  }

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;

      const trackWidth = track.scrollWidth / 2;
      const duration = trackWidth / PX_PER_SECOND;
      tweenRef.current = gsap.to(track, {
        xPercent: -50,
        duration,
        ease: "none",
        repeat: -1,
      });
      return () => {
        tweenRef.current?.kill();
        tweenRef.current = null;
      };
    },
    { scope: trackRef, dependencies: [items] },
  );

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => tweenRef.current?.pause()}
      onMouseLeave={() => tweenRef.current?.play()}
    >
      <div ref={trackRef} className="flex h-full w-max items-center gap-4">
        {[...items, ...items].map((item, i) => (
          <MarqueeTile
            key={`${item.src}-${i}`}
            item={item}
            priority={i < items.length}
            onSelect={(trigger) => handleSelect(item, trigger)}
          />
        ))}
      </div>
      {selected &&
        createPortal(
          <GalleryLightbox item={selected} onClose={handleClose} returnFocusRef={lastTriggerRef} />,
          document.body,
        )}
    </div>
  );
}
