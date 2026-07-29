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
 * (Reveal.tsx's `[0.16, 1, 0.3, 1]`), expressed as the equivalent CSS
 * cubic-bezier. `motion-reduce:` disables the transform entirely rather than
 * shortening it, matching every other animation in this codebase.
 */
export function NavLink({
  href,
  children,
  target,
  rel,
}: {
  href: string;
  children: ReactNode;
  target?: string;
  rel?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className="group relative inline-block h-[14px] overflow-hidden leading-[14px]"
    >
      <span className="block transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-focus-visible:translate-y-0">
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
