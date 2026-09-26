import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Nav link hover interaction: the label slides up and out of view while an
 * identical duplicate slides up into view from below, then both reverse on
 * hover-out. Pure CSS (`group-hover` + `transition-transform`), not
 * motion/react — a hover/focus affordance like this doesn't need JS, and the
 * `group-focus-visible` pairing (site convention, see
 * .claude/rules/skills-used.md's a11y rule) covers keyboard users for free.
 * Eased with the same "premium" curve as the site's scroll reveals
 * (gsapEase.ts's REVEAL_EASE, `[0.16, 1, 0.3, 1]`), expressed as the
 * equivalent CSS cubic-bezier. `motion-reduce:` disables the transform
 * entirely rather than shortening it, matching every other animation in this
 * codebase.
 */
// Fixed box the hover-swap track clips to. "sm" (14px) matches the text-xs
// (12px) links this component was originally built for — 14px of line box
// comfortably clears a 12px font's descenders. "md" (20px) is for text-sm
// (14px) links: at that font size a 14px box clips descenders (the "g" in
// an email address, the "y" in "Gallery") since font-size and line-height
// are then equal with no room left over.
const boxSize = {
  sm: "h-[14px] leading-[14px]",
  md: "h-[20px] leading-[20px]",
};

export function NavLink({
  href,
  children,
  target,
  rel,
  className = "",
  size = "sm",
  onClick,
}: {
  href: string;
  children: ReactNode;
  target?: string;
  rel?: string;
  className?: string;
  size?: "sm" | "md";
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      onClick={onClick}
      className={`group relative inline-block overflow-hidden ${boxSize[size]} ${className}`}
    >
      {/* data-nav-mount: MountReveal.tsx's mount-time reveal target (used both
          by NavEntrance.tsx for Nav's own links and by GalleryInfoRow.tsx for
          its email/LinkedIn/Dribbble links). Deliberately on this inner span,
          not the <a> above — the <a> is what carries `overflow-hidden` (this
          box's mask), so it has to stay the stationary window; transforming
          it directly would move the clip boundary along with the content
          instead of revealing anything. This span is also what the
          hover-swap's own `group-hover:-translate-y-full` already targets —
          MountReveal clears its GSAP-set inline transform on completion
          (clearProps) so that CSS-driven hover keeps working untouched
          afterward. */}
      <span
        data-nav-mount
        className="block transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-focus-visible:translate-y-0"
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-y-full transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:hidden"
      >
        {children}
      </span>
    </Link>
  );
}
