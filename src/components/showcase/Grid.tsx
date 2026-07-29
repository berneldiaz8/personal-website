import type { ElementType, ReactNode } from "react";

/**
 * 4-col/16px-margin/12px-gutter on mobile, 8-col/20px/16px on tablet,
 * 12-col/24px-margin/16px-gutter on desktop (lg:). Full-bleed media sits
 * outside this grid entirely rather than spanning it edge to edge.
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
