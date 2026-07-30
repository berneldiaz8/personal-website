import type { ElementType, ReactNode } from "react";

/**
 * 4-col/16px-margin/12px-gutter on mobile, 8-col/20px/16px on tablet,
 * 12-col/24px-margin/16px-gutter on desktop (lg:). Full-bleed media sits
 * outside this grid entirely rather than spanning it edge to edge.
 *
 * No items-* is set here, so items default to stretch. That's safe as long
 * as no direct child of this Grid combines a col-span-* class with an
 * aspect-* class on the same element — Safari and Chrome disagree on sizing
 * order for that exact combination (Safari derives width backward from the
 * stretched row height instead of forward from the grid track, producing a
 * squashed box; confirmed against real Safari in WorkTeaser.tsx's bug fix).
 * ProjectShowcase.tsx's aspect-ratio boxes are safe today only because
 * they're nested one plain div below the actual col-span-* grid item
 * (ShowcaseImage/ShowcaseVideo's own wrapper) rather than on it directly —
 * keep that indirection rather than collapsing it onto the grid item itself.
 */
export function Grid({
  children,
  className = "",
  as: Tag = "div",
  margin = true,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Set false to opt out of the built-in side margins (e.g. when a parent already provides them). */
  margin?: boolean;
}) {
  const marginClasses = margin ? "px-4 sm:px-5 lg:px-6" : "";
  return (
    <Tag
      className={`grid grid-cols-4 gap-3 sm:grid-cols-8 sm:gap-4 lg:grid-cols-12 lg:gap-4 ${marginClasses} ${className}`}
    >
      {children}
    </Tag>
  );
}
