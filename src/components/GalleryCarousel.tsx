"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import type { CarouselItem } from "@/data/galleryCarousel";
import { useFadeInOnLoad } from "@/lib/useFadeInOnLoad";
import { textStyles } from "@/lib/typography";
import { CursorLabel } from "./CursorLabel";
import { RevealText } from "./RevealText";
import { Grid } from "./showcase/Grid";
import { ImageSkeleton } from "./ImageSkeleton";

gsap.registerPlugin(Draggable, InertiaPlugin);

// Tile width is responsive, not a flat constant: at the 1440x900 reference
// viewport this component was originally tuned against, 7 tiles (with 6 gaps
// of TILE_GAP_PX between them) exactly fill the width — (1440 - 6*16) / 7 =
// 192, TILE_WIDTH_FLOOR_PX below. Above that 1440px breakpoint, width scales
// up via `max(floor, calc((100vw - 6 gaps) / 7))` so the same "7 tiles fill
// the screen" rule holds on larger viewports too (a 2560px display would
// otherwise just show more than 7 tiles at the fixed 192px width, since
// nothing about a wider viewport used to change tile size). Below 1440px,
// width stays pinned at the floor — this was never asked to scale down for
// mobile, where showing fewer than 7 tiles at a time is already the
// expected, unchanged behavior. Every tile shares this exact computed width
// — height is derived per image from its own aspect ratio (see CarouselTile
// below), the inverse of the original fixed-height/variable-width sizing.
//
// TILE_SIDE_MARGIN_PX is subtracted from the available width the "7 tiles"
// math divides by, matching Grid.tsx's own lg:px-6 side margin — but it's
// only ever used inside that width *calculation*, never applied as real
// padding on the row/track themselves (both stay edge-to-edge, no px-*
// class). The effect: each tile computes slightly narrower than a true
// full-bleed 1/7th of the viewport, as if the row were inset by that margin
// on both sides — but since the row itself isn't actually inset, 7 tiles'
// worth of that slightly-narrower content doesn't quite reach the true
// viewport edge, leaving room for the leading edge of the 8th (wrapped)
// tile to peek in there instead of tile 7 landing flush with nothing beyond
// it. That peek is deliberate — a live hint that there's more to drag to,
// requested explicitly rather than the clean edge-to-edge fit this already
// had before.
const TILE_GAP_PX = 16; // matches `gap-4` on the track below
const TILE_SIDE_MARGIN_PX = 24; // matches Grid.tsx's lg:px-6 — only relevant above 1440px, same as this whole calc
const TILE_WIDTH_FLOOR_PX = 192;
const TILE_WIDTH_CSS = `max(${TILE_WIDTH_FLOOR_PX}px, calc((100vw - ${TILE_SIDE_MARGIN_PX * 2}px - ${TILE_GAP_PX * 6}px) / 7))`;
// `sizes` can't use max(), only media conditions — same breakpoint expressed
// the way next/image's `sizes` attribute actually supports it.
const TILE_SIZES = `(min-width: 1440px) calc((100vw - ${TILE_SIDE_MARGIN_PX * 2}px - ${TILE_GAP_PX * 6}px) / 7), ${TILE_WIDTH_FLOOR_PX}px`;

// Tunable feel constants for the skew-on-drag effect (see the doc comment
// below) — adjust freely, neither is derived from anything else. Raised
// twice per explicit user request for a more distinguishable lean (10deg/0.5,
// then 14deg/0.7, then 20deg/1), then dialed back slightly to this pass —
// ratio between the two (max/factor = 20) kept constant throughout every
// adjustment, so the drag speed needed to reach max skew stays proportional.
const SKEW_MAX_DEG = 18;
const SKEW_FACTOR = 0.9; // px of Draggable's per-frame deltaX -> degrees

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Infinite horizontal drag-scroll carousel for /gallery, with a slight
 * parallelogram-style skew that follows drag direction and springs back
 * level on release — modeled on a reference GSAP "skew on drag" effect
 * (top/bottom edges stay horizontal, only the left/right edges lean, unlike
 * a whole-shape rotation). Replaced an earlier autoplay version (GSAP tween
 * looping on a timer) after an
 * explicit request to make the interaction fully user-driven instead: the
 * track now only ever moves in direct response to a drag, never on its own.
 * The pause-on-hover and dim-on-hover "spotlight" behaviors that version had
 * are gone too — both only made sense as a way to interact with something
 * that was scrolling on its own, which is no longer true here.
 *
 * The item list is still rendered twice back-to-back in one flex track (see
 * the doubled `[...items, ...items]` map below) — the same seamless-loop
 * trick the old autoplay version used, just wrapped by drag position now
 * instead of tweened by a timer. GSAP's Draggable (`type: "x"`) drives the
 * track's x position directly; InertiaPlugin supplies velocity tracking and
 * the momentum "coast" after release. `Draggable.create`'s own built-in
 * `inertia`/`throwProps` option is deliberately NOT used — its internal
 * momentum tween interpolates from a fixed start to a fixed computed end
 * value without re-checking the DOM each frame, so it can't be wrapped by
 * forcibly `gsap.set`-ing `x` mid-coast (the tween's own next tick just
 * overwrites that with its original unwrapped value, producing a strobe at
 * the wrap boundary for the rest of the coast). Wrapping is handled two
 * different ways for the two phases of the interaction instead:
 * - Live drag (onDrag): a direct 1:1 read of pointer position each frame,
 *   safe to wrap in place via `gsap.set` + `draggable.update()` (the latter
 *   resyncs Draggable's own internal x/y bookkeeping to the DOM, so the next
 *   frame's `deltaX` is computed relative to the wrapped position rather
 *   than jumping by the full wrap distance).
 * - Momentum coast (onDragEnd): built manually via `gsap.to(track, {
 *   inertia: { x: velocity }, modifiers: { x: wrapFn } })` rather than
 *   Draggable's own throw, specifically so it can carry a `modifiers.x`
 *   function (a real core GSAP tween feature, the documented way to
 *   loop/wrap a running tween's rendered value every tick regardless of
 *   what computed it — not a workaround).
 *
 * Reduced motion is narrower here than the old autoplay version's blanket
 * bypass (see CLAUDE.md's "Reduced motion, video, and the gallery carousel"
 * section for the historical context and the explicit re-ask that changed
 * it): direct dragging (1:1 pointer tracking, wrap-on-drag) stays exempt
 * regardless of the setting, since it's fully user-initiated, not the
 * ambient motion the setting exists to suppress. But this rewrite
 * introduces two genuinely new pieces of *autonomous* motion that didn't
 * exist before — the momentum coast, and the skew spring-back below — and
 * those are gated: under reduced motion, `onDragEnd` skips the momentum
 * tween entirely (the position is already exactly where the last `onDrag`
 * frame left it, nothing further to animate) and snaps skew straight to 0
 * with `gsap.set` instead of animating it.
 *
 * The skew is applied to a dedicated wrapper (skewRef) around track, not to
 * track itself and not per-tile — kept from an earlier version of this
 * effect that used `rotation` instead of `skewX` and needed this same
 * wrapper for a much more pressing reason (`rotation`'s default
 * transform-origin sits thousands of pixels off to the side for an element
 * as wide as the doubled track, turning a couple of degrees into a huge,
 * disorienting vertical swing for tiles far from that pivot — confirmed
 * directly, tiles visibly flew tens of pixels vertically during ordinary
 * drags). `skewX` doesn't have that specific problem (its shear is driven
 * by vertical distance from the transform-origin, and this row's height
 * stays modest regardless of the track's own huge width), but the wrapper
 * was kept anyway for the same reasoning that motivated it in the first
 * place — a plain, viewport-width element's default center-of-its-own-box
 * transform-origin is the least surprising pivot to reason about, rather
 * than re-deriving from scratch whether skewing the huge track directly
 * would be safe. Skewing one plain wrapper still shears every visible tile
 * identically as one rigid parallelogram, the same visual result as
 * skewing all 48 individual tile elements (the reference effect is a
 * uniform shear, not a staggered/parallax one) at a fraction of the
 * per-frame cost. It's driven by Draggable's own `deltaX` (per-frame pixel
 * delta, already relative to the real pointer) clamped to ±SKEW_MAX_DEG,
 * applied via a plain `gsap.to(..., { overwrite: true })` call each frame
 * (see applySkew) rather than `gsap.quickTo` — quickTo was tried first and
 * broke after exactly one drag, since its persistent internal tween gets
 * killed by onDragEnd's `killTweensOf` (needed for the reduced-motion
 * branch below) with no way to recover for later drags; a plain `.to()`
 * has no such state to corrupt, since each call just starts a fresh tween
 * that overwrites whatever was previously animating skewX. The spring-back
 * on release uses `elastic.out(0.5, 0.5)` at a deliberately slow 1.2s —
 * reduced amplitude (0.5, down from elastic's own default of 1) keeps the
 * overshoot itself subtle, while the period (0.5) still produces a couple
 * of visibly decaying swings rather than one hard bounce. This is the
 * result of several rounds of tuning, one of which was a real bug, not just
 * a taste call: fully restrained, non-overshooting eases (`power3.out`,
 * then REVEAL_EASE) read as too mechanical/stiff — real cloth or a released
 * rubber band doesn't stop dead the instant it reaches level, it wobbles a
 * few times first; `elastic.out(1, 0.65)` was closer but read as one spring
 * flex rather than genuine cloth-like settling; `gsap/CustomWiggle` was
 * tried next specifically for its multi-wiggle decay, but turned out to be
 * the wrong tool — confirmed by reading CustomWiggle.js's own source, every
 * wiggle ease it generates ends its path at `(1, 0)`, meaning the ease's
 * value at progress 1 is always 0, not 1. That's correct for CustomWiggle's
 * actual intended use (in-place shake effects that return to their
 * *starting* value, like `x: "+=20", ease: "wiggle(6)"`), but wrong for
 * tweening skewX from wherever a drag left it to a specific target (0) —
 * using it here meant the release tween wiggled around and landed back
 * near its starting angle instead of at level, confirmed directly by
 * logging gsap.getProperty(skewEl, "skewX") through onUpdate/onComplete.
 * `elastic.out(1, 0.4)` fixed that (elastic always converges to exactly its
 * target, unlike CustomWiggle) but read as too pronounced/bouncy once it
 * was actually working; dialing amplitude down to 0.5 (period left similar)
 * is what got it to a subtler, still-multi-swing settle. Deliberately
 * scoped to this one release moment only, not continuous — an ambient,
 * always-on version of this same idea (a persistent per-tile idle sway) was
 * tried and reverted after the user clarified the sway should only ever
 * happen right after releasing a drag, never while at rest. Don't
 * reintroduce a non-overshooting ease here, don't make this ambient, and
 * don't reach for CustomWiggle again for a settle-to-target tween, without
 * the same explicit re-ask/re-diagnosis. Fires on release independent of
 * whether the momentum coast keeps translating position afterward — the
 * lean reflects active pointer pressure and relaxes the instant that
 * pressure is gone, not tied to the coast's own decaying velocity.
 *
 * A `resize` listener recomputes the half-track width and wrap function
 * whenever the viewport changes, since TILE_WIDTH_CSS is itself
 * viewport-responsive — without this, a stale wrap boundary after resizing
 * would produce a visible pop/gap in content, not just a subtle speed
 * drift the way the old timer-based version's unrecomputed duration did.
 *
 * Click-vs-drag disambiguation for opening the lightbox needs no custom
 * code: as long as Draggable's `dragClickables` option is left unset (never
 * set it to `false` — every tile is a `<button>`, and `dragClickables:
 * false` would make the entire track undraggable anywhere a tile sits,
 * which is nearly the whole track), Draggable's own built-in press/release
 * handling already fires a real click on the target when the pointer never
 * moves past its minimum-movement threshold, and suppresses any click
 * shortly after an actual drag. CarouselTile's existing onClick just works.
 *
 * Each tile is sized by width (TILE_WIDTH_CSS, h-auto), not height — every
 * tile is exactly the same computed width regardless of the image's own
 * aspect ratio, with height following naturally from it. This is the
 * opposite of the carousel's original sizing (fixed height, variable width);
 * the row's own height is no longer fixed either, so it auto-sizes to
 * whatever the tallest tile ends up needing at that shared width, and
 * shorter tiles top-align within that (items-start on the track) rather
 * than centering — flush top edge, jagged bottom edge. Since every tile
 * always renders at the exact same CSS width as every other tile (even
 * though that shared width itself now varies by viewport — see
 * TILE_WIDTH_CSS above), `sizes` is a flat TILE_SIZES for all of them — no
 * per-item aspect-ratio math needed the way the old height-based sizing
 * required (a flat `sizes` value back then was wrong specifically because
 * rendered width varied per tile; now it doesn't, at any one viewport).
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
 * tree: this component's own wrapper is `overflow-hidden` (needed to clip
 * the off-screen half of the looping track), and a `position: fixed`
 * overlay nested inside an `overflow-hidden` ancestor still gets visually
 * clipped to that ancestor's box in every major browser despite being
 * viewport-relative — portaling to `document.body` sidesteps that entirely.
 * `document.body` is safe to reference directly (no SSR guard needed) since
 * `selected` only ever becomes truthy from a click handler, which can't run
 * during server rendering.
 *
 * Each tile also gets its own CursorLabel (the same cursor-follow pill
 * WorkTeaser.tsx uses for "More"), labeled "Focus" to signal the
 * click-to-open interaction. One instance per tile (48, given the doubled
 * track) rather than one shared instance for the whole strip, so the pill
 * only appears over an actual image, not the small gaps between tiles.
 * CursorLabel's own module-level "one visible at a time" registry already
 * handles the resulting fast enter/leave races between adjacent tiles.
 * CursorLabel is unmodified for this rewrite — its pointer tracking is
 * plain React mouse events on its own wrapper, and GSAP's Draggable tracks
 * the pointer via a separate, parallel `document`-level `mousemove`
 * listener that never calls `stopPropagation`/`setPointerCapture`, so
 * nothing about dragging should interrupt it. Verified against Draggable's
 * source at plan time, not yet exercised by an automated test — if the pill
 * turns out to behave oddly mid-drag in practice, the cheap fix is
 * threading an `isDragging` flag down to swap the label to "Drag" while
 * active, not yet built since the source read suggests it isn't needed.
 *
 * This CursorLabel overrides offsetX/offsetY (12, -30) instead of taking the
 * shared default (see CursorLabel.tsx) — a different reason than the old
 * tile-size compensation an earlier version needed (corner-anchoring made
 * that one unnecessary, and this pill still shares the same anchor math
 * everywhere). This tile's button is `cursor-grab` (`cursor-grabbing` while
 * dragging), not the plain arrow/pointer WorkTeaser's Link and the
 * lightbox's dialog use — the browser/OS-rendered grab-hand glyph has a
 * different visual size and hotspot placement than the arrow, which isn't
 * something CSS or JS can query, so the *raw* cursor-to-label pixel offset
 * being identical to the other two instances doesn't mean the *visible* gap
 * reads the same. Tightened here, confirmed by eye against the arrow-cursor
 * instances rather than computed from a spec.
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
 */

/**
 * Extracted so useFadeInOnLoad (a hook) can be called once per tile instance
 * rather than inside the parent's .map() callback, which the Rules of Hooks
 * disallow.
 */
function CarouselTile({
  item,
  priority,
  onSelect,
}: {
  item: CarouselItem;
  priority: boolean;
  onSelect: (trigger: HTMLButtonElement) => void;
}) {
  const { loaded, onLoad } = useFadeInOnLoad(priority);
  return (
    <button
      type="button"
      className="relative block shrink-0 cursor-grab appearance-none border-0 bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:cursor-grabbing"
      onClick={(event) => onSelect(event.currentTarget)}
      aria-label={`View ${item.project} — ${item.label} full size`}
    >
      <CursorLabel label="Focus" portal offsetX={12} offsetY={-30} className="relative block">
        <div
          className="relative h-auto overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
          style={{ width: TILE_WIDTH_CSS }}
        >
          <ImageSkeleton loaded={loaded} />
          <Image
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            className={`h-auto w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            sizes={TILE_SIZES}
            quality={100}
            priority={priority}
            // Explicit "eager" (independent of `priority`, which only
            // copy1's tiles get — this applies to every tile) — root-caused
            // via a screen recording the user provided showing every
            // visible tile go fully transparent and then fade back in
            // together, mid-drag, well after initial load. `loading="lazy"`
            // (next/image's default whenever `priority` is false) decides
            // whether an image is "near the viewport" from getBoundingClientRect
            // at the point each <img> mounts — which for copy2's tiles
            // happens *before* this component's own useGSAP layout effect
            // (see updateWrapBounds's `gsap.set(track, { x: restXRef.current
            // })`) has jumped the track off its default untransformed
            // position. At that first-mount instant, copy2 sits exactly
            // where its plain, untransformed DOM position would put it —
            // thousands of pixels off past the right edge — so the browser
            // correctly (for what it can see at that moment) defers loading
            // them. The layout effect then repositions the track before the
            // browser ever paints, so the *user* never sees the wrong
            // position, but the browser's lazy-load intersection check
            // doesn't automatically get re-run just because a transform
            // changed — those images stay stuck un-requested until some
            // later event (the mid-drag wrap jump, in the recording) finally
            // prompts the browser to re-check, at which point a whole batch
            // of them starts loading at once: blank, then a synchronized
            // fade-in as they resolve. `loading="eager"` sidesteps the
            // race entirely by not depending on lazy-load timing at all —
            // reasonable here since this is a bounded set (24 unique images,
            // doubled) in a component whose entire point is "drag to see
            // all of them," not an unbounded feed. Deliberately not just
            // `priority` for every tile instead: `priority` additionally
            // adds a `<link rel=preload>` and fetchPriority=high, which
            // Next.js warns against applying broadly (it's meant for true
            // LCP candidates, not every offscreen tile).
            loading="eager"
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
 * WorkTeaser's row, not GalleryCarousel's tight per-tile offset) spans the
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
 *
 * The caption is a sibling of CursorLabel's flex container, not a child of
 * it — absolutely positioned within the dialog rather than laid out in the
 * flex row the image centers in. A flex sibling would steal horizontal space
 * from the image's box (shrinking it, the opposite of what was asked); an
 * absolutely positioned element is removed from flow entirely, so it can sit
 * inside the same py-12 top band already reserved above the image without
 * that band needing to grow or the image's h-full sizing math changing at
 * all. `aria-hidden` since the dialog's own aria-label already announces the
 * identical "Project — Label" text to screen readers — this is a sighted-only
 * caption, not a second, redundant announcement. `pointer-events-none` keeps
 * it from interfering with click-anywhere-to-close.
 *
 * Color is a hardcoded `#f4f4f5` (the primary/foreground token's own dark-mode
 * value), not `text-foreground` — this dialog is portaled straight to
 * document.body, landing outside the /gallery page's own data-force-dark div
 * in the actual DOM tree. CSS custom properties only cascade through real DOM
 * ancestry, not the React tree a portal preserves, so `--foreground` here
 * would resolve against the visitor's own system prefers-color-scheme instead
 * of the page's forced-dark theme — near-black text on this dialog's
 * bg-black/90 for anyone with a light system preference. CursorLabel's own
 * "Close" label doesn't hit this problem: its color is a static `text-white`
 * plus `mix-blend-mode: difference`, not a `--foreground` token, so there's
 * no custom-property cascade to break through the portal boundary.
 */
function GalleryLightbox({
  item,
  onClose,
  returnFocusRef,
}: {
  item: CarouselItem;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // No `priority` arg (defaults to false, i.e. starts unloaded): unlike
  // CarouselTile's first copy, there's no LCP concern here — the lightbox
  // only ever mounts after a click, well after first paint. In practice the
  // image is almost always already browser-cached (it's the same src as the
  // tile just clicked), so this fades in near-instantly rather than sitting
  // on the skeleton — still wired up for correctness/consistency, and as a
  // real fallback on a slow connection or cache miss.
  const { loaded, onLoad } = useFadeInOnLoad();

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
      <RevealText
        as="div"
        className="pointer-events-none absolute left-4 top-4 z-20 sm:left-5 lg:left-6"
        // A deliberate pause before this starts revealing, rather than in
        // lockstep with the dialog opening/image fading in (transition-
        // opacity duration-500 below) — makes the caption read as its own
        // distinct beat instead of blending into the rest of the lightbox
        // appearing, per explicit user request.
        delay={0.4}
      >
        <p
          aria-hidden="true"
          className="text-left text-xs uppercase tracking-wide text-[#f4f4f5]"
        >
          {item.project} — {item.label}
        </p>
      </RevealText>
      <CursorLabel
        label="Close"
        className="relative flex h-full w-full cursor-pointer items-center justify-center py-12"
      >
        <div className="relative h-full w-full">
          {/* width/height put ImageSkeleton into its SVG object-fit:contain
              mode (see its own doc comment for why a plain inset-0 fill isn't
              enough here) — this box stays a plain h-full w-full fill, same
              as the real Image below; the skeleton sizes its own painted
              content to match the image's letterboxed footprint internally,
              nothing about this wrapper needs to change to accommodate it. */}
          <ImageSkeleton loaded={loaded} forceDark width={item.width} height={item.height} />
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="100vw"
            quality={100}
            className={`object-contain transition-opacity duration-500 motion-reduce:transition-none ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={onLoad}
          />
        </div>
      </CursorLabel>
    </div>
  );
}

export function GalleryCarousel({ items }: { items: CarouselItem[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const skewRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<Draggable | null>(null);
  const halfWidthRef = useRef(0);
  const restXRef = useRef(0);
  const wrapXRef = useRef<((value: number) => number) | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState<CarouselItem | null>(null);

  function handleSelect(item: CarouselItem, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setSelected(item);
  }

  function handleClose() {
    setSelected(null);
  }

  useGSAP(
    () => {
      const row = rowRef.current;
      const track = trackRef.current;
      const skewEl = skewRef.current;
      if (!row || !track || !skewEl) return;

      // Mirrors, at rest, the same "leave a bit of the next tile visible"
      // slack TILE_WIDTH_CSS's own calc already produces at the row's right
      // edge (7 real tiles computes slightly narrower than the row's own
      // width, on purpose — see TILE_WIDTH_CSS's doc comment above) onto the
      // left edge too, so a peek of the tile immediately before Lexora —
      // which, since the track loops, is really Opinly's last tile from the
      // previous cycle — shows there instead of Lexora sitting flush against
      // dead padding.
      //
      // Splits that slack evenly between both edges rather than trying to
      // give the left side its own full-sized peek on top of the right's:
      // the margin TILE_WIDTH_CSS's calc bakes in is a *fixed* budget (its
      // own comment derives it as 2*TILE_SIDE_MARGIN_PX, consumed today
      // entirely by the right edge's peek). Reusing that same budget for a
      // second, left-side peek necessarily divides it — there's no
      // additional slack to invent from nowhere. The 8-gap accounting below
      // (6 internal gaps among the 7 fully-visible tiles, plus one gap on
      // each side separating them from their neighboring peek sliver) is
      // measured in true, un-padded row coordinates rather than content
      // width after the row's own real left padding: the padding is real
      // CSS box-model space, but `overflow-hidden` clips at the row's own
      // *border* box, not its *content* box, so a tile shifted into that
      // padding area via transform still renders there rather than being
      // clipped — solving the split with padding subtracted out of the
      // budget (as an earlier version of this code did) overspends the
      // budget and clips the 7th tile / hides the 8th's peek entirely
      // (confirmed directly against a live build). Measured at runtime
      // (rendered tile width) rather than re-derived from TILE_WIDTH_CSS's
      // own constants, since TILE_WIDTH_CSS is itself a calc()/max(), and
      // reading what the browser already computed can't drift out of sync
      // with it the way re-deriving the same formula a second time in JS
      // could.
      //
      // No third, dedicated "peek" copy is prepended to the track for this —
      // it reuses the existing doubled [...items, ...items] structure.
      // Copy1 and copy2 are pixel-identical, so resting a little short of
      // their exact boundary (x = -halfWidth) reveals the tail end of copy1
      // (Opinly's last tile) peeking in before copy2's own Lexora, which is
      // visually indistinguishable from copy1's Lexora — the loop reads as
      // continuous either way. `peek + TILE_GAP_PX` (not just `peek`) is the
      // rest-position shift, so the visible sliver comes out to exactly
      // `peek` px with a normal tile-to-tile gap separating it from Lexora,
      // rather than the peek pressing flush against it.
      function updateWrapBounds() {
        // Deliberately NOT `track.scrollWidth / 2`: with 48 tiles (2 doubled
        // copies of 24) there are 47 gaps total across the whole track, an
        // odd number, so half of the *total* width lands half a gap (8px)
        // short of the actual copy1→copy2 boundary — confirmed directly by
        // comparing scrollWidth/2 against the real measured offset between
        // tile 0 and tile `items.length`. That 8px was invisible before this
        // peek feature (wrapping happens mid-drag, never paused exactly on
        // the boundary), but the peek's rest position depends on this being
        // exact, so it surfaces here as a real, visible error otherwise.
        // Measuring the two copies' actual rendered start positions instead
        // is exact regardless of gap-count parity.
        const copy1Start = (track!.children[0] as HTMLElement).getBoundingClientRect().left;
        const copy2Start = (track!.children[items.length] as HTMLElement).getBoundingClientRect().left;
        const halfWidth = copy2Start - copy1Start;
        halfWidthRef.current = halfWidth;

        const tile = track!.firstElementChild as HTMLElement | null;
        const tileWidth = tile?.offsetWidth ?? 0;
        const peek = Math.max(0, (row!.clientWidth - 7 * tileWidth - 8 * TILE_GAP_PX) / 2);

        // `paddingLeft` here isn't extra room reserved on top of `peek` — the
        // budget above is already computed in true, un-padded row
        // coordinates (screen 0 = the row's own left edge). It's subtracted
        // purely to convert that absolute target into `track`'s own local
        // coordinate space, since `track` itself sits after the row's real
        // `pl-*` padding in normal layout — every local x is implicitly
        // offset by paddingLeft once it reaches the screen, so it has to be
        // backed out here or the peek would land paddingLeft px too far
        // right (confirmed directly: omitting this produced a ~40px sliver
        // instead of the intended ~8px one).
        const paddingLeft = parseFloat(getComputedStyle(row!).paddingLeft || "0");
        const restX = peek + TILE_GAP_PX - paddingLeft - halfWidth;
        restXRef.current = restX;

        // Centered on restX (± half a cycle), not `[restX - halfWidth,
        // restX]` with restX itself as the exclusive upper edge — gsap.utils
        // .wrap treats its `max` as exclusive, so a domain edge sitting
        // exactly on the rest position means the very first pixel of a
        // rightward drag from rest immediately satisfies "needs wrapping,"
        // jumping the track by a full `halfWidth`. This is the identical bug
        // class already root-caused and fixed once this session for the
        // pre-peek version of this component (there, the domain was
        // `[-halfWidth, 0]` with the rest position at 0, its own exclusive
        // edge) — centering the domain on wherever rest actually is keeps
        // that same fix intact regardless of what rest position the peek
        // feature above computes it to be.
        wrapXRef.current = gsap.utils.wrap(restX - halfWidth / 2, restX + halfWidth / 2);
      }

      updateWrapBounds();
      gsap.set(track, { x: restXRef.current });
      window.addEventListener("resize", updateWrapBounds);

      // Applied to skewEl (a plain, viewport-width wrapper), not to track
      // itself — kept from an earlier `rotation`-based version of this
      // effect where that separation mattered a lot more (rotation's
      // transform-origin sits thousands of pixels off to the side for an
      // element as wide as the doubled track, turning a couple of degrees
      // into a huge vertical swing — confirmed directly). skewX's shear is
      // driven by vertical distance from the transform-origin instead, and
      // this row's height stays modest regardless of track's own width, so
      // skewing track directly likely wouldn't reproduce that bug — but
      // skewEl was kept anyway as the same safe, easy-to-reason-about pivot.
      //
      // Deliberately a plain gsap.to() call each frame, not gsap.quickTo —
      // quickTo was tried first and broke after exactly one drag cycle: its
      // returned function wraps one persistent internal tween instance, and
      // onDragEnd's gsap.killTweensOf(skewEl, "skewX") (needed so the
      // reduced-motion gsap.set() below can actually win, see its own
      // comment) kills that SAME instance since it targets the same
      // element+property — quickTo has no way to recreate/revive it, so
      // every onDrag call after the first onDragEnd silently no-oped
      // (confirmed directly: the lean only ever applied on the very first
      // drag of a session). A plain gsap.to() has no such persistent state
      // to corrupt — each call just starts a fresh tween that auto-overwrites
      // whatever was previously animating skewX, including a still-running
      // one from the previous frame, so repeated onDrag calls behave exactly
      // like quickTo was intended to, without the killTweensOf conflict.
      function applySkew(deg: number) {
        gsap.to(skewEl, { skewX: deg, duration: 0.4, ease: "power3.out", overwrite: true });
      }

      // gsap.set() is not a guaranteed-synchronous write in every calling
      // context — it's implemented as a zero-duration tween, and GSAP's
      // "lazy render" optimization can defer a tween's actual DOM write to
      // the next tick when it's created from inside code that's already
      // executing as part of GSAP's own render/dispatch cycle (which
      // wrapTrackPosition is, since it runs from inside Draggable's onDrag
      // dispatch). If the wrap's correction lands a tick late, the browser
      // can paint one real frame at the pre-wrap (unwrapped, thousands of
      // pixels off) position first — a one-frame flick, distinct from and
      // in addition to whatever `this.update()` cost separately. quickSetter
      // renders synchronously and immediately, no lazy-render path, by
      // design (see gsap-core.js: it calls `p.render(1, p)` directly) — it's
      // GSAP's own documented tool for exactly this "update very
      // frequently, need it applied instantly" scenario. Created once
      // outside the hot path rather than calling gsap.quickSetter() itself
      // on every wrap, since the setter it returns is what's meant to be
      // reused.
      const setTrackX = gsap.quickSetter(track, "x", "px");

      // Shared by onDrag (live drag) and onThrowUpdate (momentum coast) — both
      // fire once per frame with fresh this.x, so the same wrap logic applies
      // to either phase identically.
      function wrapTrackPosition(this: Draggable) {
        const wrapped = wrapXRef.current!(this.x);
        // A tolerance, not a strict !== check: gsap.utils.wrap's modulo math
        // introduces tiny floating-point noise (~1e-13) even for values
        // nowhere near the real wrap boundary, which a strict inequality
        // treats as "needs wrapping" — confirmed directly, this fired on
        // nearly every frame instead of only at genuine wraps once x drifted
        // into certain ranges.
        if (Math.abs(wrapped - this.x) > 0.5) {
          setTrackX(wrapped);
          // Resyncs Draggable's own bookkeeping to the DOM's new (wrapped)
          // position directly, not via `this.update()` — confirmed by
          // reading Draggable.js's source that `update()` unconditionally
          // calls `updateMatrix()`, which reads the target's global
          // transform matrix off the *parent chain*, a synchronous
          // layout-dependent read. Forcing that on the exact same frame as a
          // multi-thousand-pixel transform jump (this track is 48 large
          // tiles wide) was the real cause of a visible stutter/flicker
          // whenever a drag crossed the wrap boundary — reported by a user
          // as a "flick" landing consistently around the same project every
          // time, which traced back to the wrap boundary always falling at
          // the same relative drag distance from rest, not anything
          // project-specific. `this.x` is a plain, directly-writable public
          // property (Draggable's own internal code assigns it the same
          // way, e.g. in syncXY), and it's the only part of `update()`'s
          // work this actually needs — the DOM write above already keeps
          // GSAP's own transform cache (which is what the *next* frame's
          // deltaX is computed from) in sync on its own, with no separate
          // resync call required for that part.
          // GSAP's own type declarations mark `x` readonly (it's meant to be
          // set via drag/tween internals, not user code) even though it's a
          // plain writable property at runtime — this cast is only to satisfy
          // that type, not a real type hazard.
          (this as unknown as { x: number }).x = wrapped;
        }
      }

      function onDrag(this: Draggable) {
        wrapTrackPosition.call(this);
        const deg = gsap.utils.clamp(-SKEW_MAX_DEG, SKEW_MAX_DEG, this.deltaX * SKEW_FACTOR);
        applySkew(deg);
      }

      function onDragEnd(this: Draggable) {
        // killTweensOf is required before either branch below, not just the
        // animated one — applySkew's tween is still live from the drag
        // (nothing stops it just because the pointer released), and
        // gsap.set() does NOT auto-overwrite an in-flight tween on the same
        // property the way gsap.to() does. Without this, the drag tween
        // keeps ticking after gsap.set(skewX: 0) and silently drags the
        // value back away from 0 on its very next frame (confirmed directly
        // — this is the same failure mode already documented and fixed once
        // in CursorLabel.tsx's hideInstantly for the identical reason).
        gsap.killTweensOf(skewEl, "skewX");
        if (prefersReducedMotion()) {
          this.tween?.kill(); // cancel the coast Draggable just started
          gsap.set(skewEl, { skewX: 0 });
          return;
        }
        gsap.to(skewEl, { skewX: 0, duration: 1.2, ease: "elastic.out(0.5, 0.5)" });
      }

      const [instance] = Draggable.create(track, {
        type: "x",
        inertia: true,
        onDrag,
        onThrowUpdate: wrapTrackPosition,
        onDragEnd,
      });
      draggableRef.current = instance;

      return () => {
        window.removeEventListener("resize", updateWrapBounds);
        draggableRef.current?.kill();
        draggableRef.current = null;
      };
    },
    { scope: trackRef, dependencies: [items] },
  );

  return (
    <div className="relative">
      {/* A sibling of the overflow-hidden box below, not a descendant of it —
          `bottom-full` positions this above that box's own top edge, and an
          overflow-hidden ancestor clips anything that visually extends past
          its box regardless of position/z-index, the same clipping hazard
          CursorLabel's `portal` prop and GalleryLightbox's own portal below
          already exist to solve elsewhere in this file. `mb-4` (16px) is the
          requested gap. Uses the shared Grid component (not a hand-rolled
          offset) specifically so its column boundaries land exactly where
          Nav.tsx's Grid computes them — the col-start/col-span values below
          match Nav's own "Work,"/"Info" nav group exactly (col-start-3/5/7,
          col-span-2/2/3 at the same breakpoints), so this copy's left edge
          lines up with it. The explicit col-span (rather than the default
          1-column span) plus `whitespace-nowrap` matter here specifically —
          without them this short caption wrapped onto two lines, since a
          single grid column is narrower than "Drag to explore" needs.
          textStyles.showcaseCaption (src/lib/typography.ts) is this design
          system's actual caption token — text-xs font-normal uppercase
          leading-[18px] text-muted — rather than a hand-rolled className;
          text-muted resolves to #a1a1aa under this page's forced-dark theme
          (see globals.css's [data-force-dark] block), matching the exact
          color originally asked for via the token instead of a hardcoded
          hex. Not aria-hidden: this is genuinely informative (the drag
          affordance isn't otherwise announced anywhere), not decorative. */}
      <Grid className="pointer-events-none absolute inset-x-0 bottom-full mb-4">
        <RevealText
          as="div"
          className="col-span-2 col-start-3 whitespace-nowrap sm:col-span-2 sm:col-start-5 lg:col-span-3 lg:col-start-7"
        >
          <p className={textStyles.showcaseCaption}>Drag to explore</p>
        </RevealText>
      </Grid>
      {/* pl-* only, deliberately not pr-* — matches Grid.tsx's own left
          margin scale (px-4/5/6) so the row's own content box (i.e. where
          the left-edge peek tile above sits, see updateWrapBounds) starts
          inset from the true viewport edge the same amount everything else
          on the page (Nav, GalleryInfoRow) is, rather than sitting flush
          against it — Lexora itself now sits a bit further in than this
          padding alone, past its own peek. The right side stays un-padded
          on purpose: that's what leaves room for the trailing-edge tile-8
          peek described above — padding both sides symmetrically would
          make the row read as a boxed carousel that starts and stops
          cleanly, instead of a continuous drag surface with only its
          starting position aligned to the page's margin. */}
      <div ref={rowRef} className="relative w-full overflow-hidden pl-4 sm:pl-5 lg:pl-6">
        <div ref={skewRef} className="w-full will-change-transform">
          {/* will-change-transform on both this wrapper and track: a
              standing hint (not a per-drag toggle) that these two elements'
              transforms change often, so the browser promotes them to their
              own composited layer up front and keeps that layer's tiles
              rasterized ahead of time, rather than deciding to promote/
              rasterize reactively only once a transform change is already
              in flight. Doesn't change anything measurable in Chrome's own
              devtools performance trace (already fast here), but this is
              exactly the standard, low-risk mitigation for the class of bug
              being chased — WebKit/Safari's compositor is known to visibly
              flash/flicker on an instant, large transform change to a wide
              layer it hadn't already promoted, distinct from and in
              addition to the two JS-side causes already fixed above
              (`this.update()`'s forced synchronous layout read, and
              gsap.set()'s potential lazy-render deferral) — this covers the
              GPU/compositor side those two don't touch. */}
          <div ref={trackRef} className="flex w-max items-start gap-4 will-change-transform">
            {[...items, ...items].map((item, i) => (
              <CarouselTile
                key={`${item.src}-${i}`}
                item={item}
                priority={i < items.length}
                onSelect={(trigger) => handleSelect(item, trigger)}
              />
            ))}
          </div>
        </div>
        {selected &&
          createPortal(
            <GalleryLightbox item={selected} onClose={handleClose} returnFocusRef={lastTriggerRef} />,
            document.body,
          )}
      </div>
    </div>
  );
}
