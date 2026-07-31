"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { MarqueeItem } from "@/data/galleryMarquee";
import { useFadeInOnLoad } from "@/lib/useFadeInOnLoad";

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
 * aspect ratio against the page's current 45vh-ish marquee area height (see
 * gallery/page.tsx's `h-[45%]`) — if that percentage changes, this multiplier
 * should move with it. quality={90} matches ProjectShowcase.tsx's
 * ShowcaseImage convention (75 is next/image's own default, deliberately
 * not used site-wide per next.config.ts's own comment on the two allowed
 * qualities).
 *
 * Per-tile caption is driven by explicit JS state (activeIndex), not CSS
 * `:hover`/`group-hover` — deliberately. A native `:hover` match on a child
 * of a continuously `transform`-animated (compositor-driven) parent can
 * desync from the compositor's already-updated visual position for a frame
 * or two right as the animation stops, which read as "the wrong tile's
 * caption briefly shows, then jumps to the right one." Discrete
 * onPointerEnter/onPointerLeave events avoid that: they fire once per real
 * transition rather than being continuously re-evaluated against a moving
 * target, and since React batches state updates, a leave on one tile
 * immediately followed by an enter on the next (the exact case that
 * flickered) collapses into a single render with the final, correct index —
 * never a visible flash back to "no tile."
 */

/**
 * Extracted so useFadeInOnLoad (a hook) can be called once per tile instance
 * rather than inside the parent's .map() callback, which the Rules of Hooks
 * disallow.
 */
function MarqueeTile({
  item,
  isActive,
  priority,
  onEnter,
  onLeave,
}: {
  item: MarqueeItem;
  isActive: boolean;
  priority: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const { loaded, onLoad } = useFadeInOnLoad(priority);
  return (
    <div
      className="relative h-full shrink-0 overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <Image
        src={item.src}
        alt={item.alt}
        width={item.width}
        height={item.height}
        className={`h-full w-auto object-cover transition-opacity duration-500 motion-reduce:transition-none ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        sizes={`${((item.width / item.height) * 45).toFixed(0)}vh`}
        quality={90}
        priority={priority}
        onLoad={onLoad}
      />
      <div
        className={`pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="whitespace-nowrap text-xs font-normal uppercase tracking-wide text-white">
          {item.project}
          {" — "}
          {item.label}
        </p>
      </div>
    </div>
  );
}

export function GalleryMarquee({ items }: { items: MarqueeItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
      onMouseLeave={() => {
        tweenRef.current?.play();
        setActiveIndex(null);
      }}
    >
      <div ref={trackRef} className="flex h-full w-max items-center gap-4">
        {[...items, ...items].map((item, i) => (
          <MarqueeTile
            key={`${item.src}-${i}`}
            item={item}
            isActive={activeIndex === i}
            priority={i < items.length}
            onEnter={() => setActiveIndex(i)}
            onLeave={() => setActiveIndex((current) => (current === i ? null : current))}
          />
        ))}
      </div>
    </div>
  );
}
