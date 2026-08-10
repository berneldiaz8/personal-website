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

// Fixed tile width, calibrated the same way: (1440 - 6 gaps of 16px) / 7, so
// 7 tiles fit the same 1440x900 reference viewport PX_PER_SECOND already
// targets. Every tile shares this exact width now — height is derived per
// image from its own aspect ratio (see MarqueeTile below), the inverse of
// the original fixed-height/variable-width sizing.
const TILE_WIDTH_PX = 192;

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
 * Pause-on-hover is scoped per-tile, not to the row as a whole: pause/play
 * live in each tile's own onEnter/onLeave (passed down to MarqueeTile below,
 * shared with the dim-on-hover activeIndex logic), not on the row wrapper's
 * onMouseEnter. A tile's button has no explicit size of its own — it just
 * shrink-wraps around the image-sized div inside it — so its hoverable box
 * is already exactly the rendered image, nothing more; scoping pause there
 * instead of the row means hovering the gaps between tiles, or the empty
 * space below a shorter tile now that tiles are top-aligned at varying
 * heights (see items-start below), does *not* pause the scroll, only
 * hovering actual image content does. The row wrapper keeps a defensive
 * onMouseLeave (play + clear activeIndex) as a safety net matching the same
 * "leaving a tile might not always fire cleanly" reasoning activeIndex's own
 * per-tile guard already relies on.
 *
 * Every play() call above is guarded with `if (!selected)` — the lightbox
 * being open must be the one source of truth for "the marquee is stopped,"
 * not an accident of whether a tile's own leave/blur happens to fire while
 * it's open. It doesn't always: the clicked tile's onBlur (wired to the same
 * onLeave, for keyboard focus parity — see MarqueeTile below) fires
 * reliably the instant GalleryLightbox's own mount effect steals focus via
 * dialogRef.current.focus(), since blur isn't blocked by occlusion the way
 * pointer events are — but only if the tile actually held focus at click
 * time, which itself is browser-dependent (Chromium/Firefox focus a button
 * on click, Safari historically doesn't). Without the guard, that
 * inconsistency meant the strip could silently resume scrolling underneath
 * an open lightbox on some browsers and not others — confusing on close,
 * since tiles would've moved from wherever the user remembered clicking.
 * handleClose (see its own comment below) is the only place that resumes it
 * while the lightbox is open or closing.
 *
 * Each tile is sized by width (w-[TILE_WIDTH_PX] h-auto), not height —
 * every tile is exactly TILE_WIDTH_PX wide regardless of the image's own
 * aspect ratio, with height following naturally from it. This is the
 * opposite of the marquee's original sizing (fixed height, variable width);
 * the row's own height is no longer fixed either, so it auto-sizes to
 * whatever the tallest tile ends up needing at that shared width, and
 * shorter tiles top-align within that (items-start on the track) rather
 * than centering — flush top edge, jagged bottom edge. Since
 * every tile now renders at the exact same CSS width, `sizes` is a flat
 * `${TILE_WIDTH_PX}px` for all of them — no per-item aspect-ratio math
 * needed the way the old height-based sizing required (a flat `sizes` value
 * back then was wrong specifically because rendered width varied per tile;
 * now it doesn't).
 * quality={100} (75 is next/image's own default, deliberately not used
 * site-wide; 90 is ProjectShowcase.tsx's ShowcaseImage convention for
 * work-page media; 100 is used here specifically since these are dense
 * screenshots of real UI — small text and thin borders show compression
 * artifacts more readily than photography does at 90. All three values are
 * explicitly allowlisted in next.config.ts's images.qualities).
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
 * This CursorLabel uses the shared default offsetX/offsetY (see
 * CursorLabel.tsx) rather than a tile-specific override — an earlier version
 * tightened it to compensate for the tile's small size, back when the pill
 * was anchored by its center; corner-anchoring (also in CursorLabel.tsx)
 * made that compensation unnecessary; the cursor-to-pill gap is now the same
 * fixed distance everywhere regardless of tile or label width, so this pill
 * and WorkTeaser's/GalleryLightbox's all read as one consistent affordance.
 *
 * The row's own overflow-hidden (necessary to hide the looping track's
 * off-screen half) is a separate clipping hazard the offset alone can't
 * fix: the tile's own overflow-hidden was moved off the CursorLabel-tracked
 * button onto an inner wrapper around just the Image, so the pill is never
 * clipped by the tile's own edge, but with every tile top-aligned (see
 * items-start above), every tile's top edge touches the row's own top
 * bound exactly, not just the tallest one's — hovering near any tile's top
 * can push the pill past that row-level boundary, while there's still
 * headroom below shorter tiles since only the tallest one reaches the row's
 * bottom edge. `portal` (see CursorLabel.tsx) fixes this the same way
 * GalleryLightbox already escapes its own overflow-hidden ancestor: it
 * renders the pill into document.body rather than positioning it inside the
 * row at all.
 *
 * Spotlight dim-on-hover: hovering (or focusing) one tile dims every other
 * tile in the track — including the off-screen half of the loop, since this
 * is explicit per-tile React state (activeIndex), not a CSS effect scoped to
 * the visible viewport. Deliberately index-based, not keyed by item identity
 * (e.g. item.src): the doubled track renders each image as two independent
 * DOM tiles (index i and i + items.length) for the seamless loop, and
 * hovering one does *not* also exempt its own duplicate elsewhere in the
 * strip from dimming — matching how every other per-tile behavior here
 * (fade-in-on-load, the CursorLabel instance, focus state) already treats
 * the two copies as fully independent elements, not a linked pair.
 * setActiveIndex on leave uses the same "only clear if this tile is still
 * the active one" guard the old hover-caption's activeIndex used, so a leave
 * on one tile immediately followed by an enter on the next (adjacent-tile
 * races) can't stomp the new tile's just-set active state.
 */

/**
 * Extracted so useFadeInOnLoad (a hook) can be called once per tile instance
 * rather than inside the parent's .map() callback, which the Rules of Hooks
 * disallow.
 */
function MarqueeTile({
  item,
  priority,
  isDimmed,
  onEnter,
  onLeave,
  onSelect,
}: {
  item: MarqueeItem;
  priority: boolean;
  isDimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onSelect: (trigger: HTMLButtonElement) => void;
}) {
  const { loaded, onLoad } = useFadeInOnLoad(priority);
  return (
    <button
      type="button"
      className="relative block shrink-0 cursor-pointer appearance-none border-0 bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={(event) => onSelect(event.currentTarget)}
      aria-label={`View ${item.project} — ${item.label} full size`}
    >
      <CursorLabel label="Focus" portal className="relative block">
        <div
          className="relative h-auto overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
          style={{ width: TILE_WIDTH_PX }}
        >
          <Image
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            className={`h-auto w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            sizes={`${TILE_WIDTH_PX}px`}
            quality={100}
            priority={priority}
            onLoad={onLoad}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-300 ease-out motion-reduce:transition-none ${
              isDimmed ? "opacity-75" : "opacity-0"
            }`}
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
 * That padding lives on CursorLabel's own container, not the outer dialog
 * div — CursorLabel only tracks mouse events within its own box, so padding
 * placed on an ancestor instead would shrink that box and leave the padding
 * strips outside it, silently hiding the pill while hovering there (a real
 * bug this used to have). Keeping the padding on CursorLabel itself means
 * its tracked area is the full `fixed inset-0` dialog, padding included.
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
      className="fixed inset-0 z-[100] bg-black/90 focus:outline-none"
      onClick={onClose}
    >
      <CursorLabel
        label="Close"
        className="relative flex h-full w-full cursor-pointer items-center justify-center py-12"
      >
        <div className="relative h-full w-full">
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="100vw"
            quality={100}
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  function handleSelect(item: MarqueeItem, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setSelected(item);
    tweenRef.current?.pause();
  }

  function handleClose() {
    setSelected(null);
    // Deliberately not a flat "clear activeIndex, resume the tween" — the
    // cursor may genuinely still be sitting on the tile that opened the
    // lightbox (e.g. it closed via clicking the enlarged image at a point
    // that happens to land on the underlying tile's screen position), in
    // which case it should stay spotlighted and paused, exactly as if the
    // user were freshly hovering it. requestAnimationFrame defers this
    // check to after React actually removes the portaled dialog from the
    // DOM — checked synchronously in this same tick, the tile would still
    // read as occluded (the dialog is still the topmost element there) and
    // :hover wouldn't match it yet. Using the browser's own live :hover
    // state instead of tracking mouse coordinates ourselves means this
    // works regardless of *how* the lightbox closed (backdrop click, image
    // click, or Escape) and correctly resolves to whichever tile (if any)
    // the cursor actually ends up over — including a *different* tile than
    // the one that was open, not just re-checking the original trigger.
    // This single resync is also why the tile's onFocus doesn't need its
    // own guard against GalleryLightbox's returnFocusRef refocus: that
    // still fires synchronously and can transiently re-pause/re-highlight
    // the wrong thing, but this rAF callback runs after it and overwrites
    // whatever it set with the real answer.
    requestAnimationFrame(() => {
      const buttons = trackRef.current ? Array.from(trackRef.current.querySelectorAll("button")) : [];
      const hoveredIndex = buttons.findIndex((button) => button.matches(":hover"));
      if (hoveredIndex === -1) {
        setActiveIndex(null);
        tweenRef.current?.play();
        return;
      }
      setActiveIndex(hoveredIndex);
      tweenRef.current?.pause();
      // The tile's own onPointerLeave can't be trusted to ever fire after
      // this — confirmed directly: :hover correctly flips back to false once
      // the cursor genuinely moves off, but the DOM leave event silently
      // never dispatches. Browsers only recompute *and dispatch* pointer
      // enter/leave in response to an actual pointer-movement event; the
      // dialog's removal just now was a pure DOM mutation, not a movement,
      // so the tile never received a fresh pointerenter from the event
      // system's own bookkeeping — meaning it can't later "leave" something
      // it was never marked as having entered, even though it visibly is
      // hovered right now. This one-off listener bridges exactly that gap:
      // on the next real pointer movement anywhere, it re-checks :hover
      // directly and corrects state once the cursor has actually left. The
      // `current === hoveredIndex` guard makes it safe even if the user has
      // since moved on to genuinely hovering a different tile (which fires
      // its own onEnter normally) — this only clears activeIndex if it's
      // still pointing at the same stale tile, never a newer one.
      const hoveredButton = buttons[hoveredIndex];
      function recheckHover() {
        if (hoveredButton.matches(":hover")) return;
        setActiveIndex((current) => (current === hoveredIndex ? null : current));
        tweenRef.current?.play();
        document.removeEventListener("pointermove", recheckHover);
      }
      document.addEventListener("pointermove", recheckHover);
    });
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
      className="relative w-full overflow-hidden"
      onMouseLeave={() => {
        if (!selected) tweenRef.current?.play();
        setActiveIndex(null);
      }}
    >
      <div ref={trackRef} className="flex w-max items-start gap-4">
        {[...items, ...items].map((item, i) => (
          <MarqueeTile
            key={`${item.src}-${i}`}
            item={item}
            priority={i < items.length}
            isDimmed={activeIndex !== null && activeIndex !== i}
            onEnter={() => {
              setActiveIndex(i);
              tweenRef.current?.pause();
            }}
            onLeave={() => {
              setActiveIndex((current) => (current === i ? null : current));
              if (!selected) tweenRef.current?.play();
            }}
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
