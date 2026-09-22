import type { ReactNode } from "react";

/**
 * Gives a plain (non-link) piece of text the same mask box NavLink.tsx
 * already gets for free from its `overflow-hidden` `<a>` — for content
 * MountReveal.tsx needs to slide up into view that has no existing anchor to
 * reuse (GalleryInfoRow's "Contact"/"Connect"/"Snapshots" labels, its
 * copyright line, "Open to work"). Outer element carries `overflow-hidden`
 * and stays stationary (the mask window); `data-nav-mount` sits on the inner
 * span MountReveal actually transforms — same split responsibility, same
 * reason, as NavLink.tsx's own box (see that file's comment): transforming
 * the box that owns the clip would move the clip boundary along with it,
 * revealing nothing.
 *
 * `as` picks the outer element's tag so this doesn't change a call site's
 * existing semantics (a `<p>` stays a `<p>`, not a `<span>` wrapping one).
 */
export function MaskedText({
  children,
  as: Tag = "span",
  className = "",
}: {
  children: ReactNode;
  as?: "span" | "p";
  className?: string;
}) {
  return (
    <Tag className={`relative block overflow-hidden ${className}`}>
      <span data-nav-mount className="block">
        {children}
      </span>
    </Tag>
  );
}
