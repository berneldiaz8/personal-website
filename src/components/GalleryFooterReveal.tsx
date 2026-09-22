"use client";

import type { ReactNode } from "react";
import { navReady } from "@/lib/navReady";
import { MountReveal } from "./MountReveal";

/**
 * Mount-time entrance for GalleryInfoRow's content — a thin client wrapper
 * around MountReveal.tsx, mirroring NavEntrance.tsx's own role for Nav.
 *
 * This file exists specifically so `navReady` is imported *inside* a
 * "use client" module rather than in GalleryInfoRow.tsx itself (a Server
 * Component). Passing a plain Promise as a prop from a Server Component to a
 * Client Component crosses the RSC serialization boundary — Next.js's server
 * renderer then tries to serialize/await it while building the response.
 * `navReady` only ever resolves from a browser-side GSAP callback, so during
 * SSR it never resolves at all, which hung page renders for `/gallery`
 * indefinitely (confirmed: reverting to a version that imported navReady
 * directly in GalleryInfoRow.tsx and passed it into MountReveal as a prop
 * took the route from ~30ms to multi-minute responses). Importing it here
 * instead means the import — and the Promise it creates — exists only in
 * client-side code, exactly like NavEntrance.tsx already does for
 * `pageReady`, and never needs to cross that boundary at all.
 */
export function GalleryFooterReveal({ children }: { children: ReactNode }) {
  return (
    <MountReveal waitFor={navReady} playKey="gallery-footer-entrance">
      {children}
    </MountReveal>
  );
}
