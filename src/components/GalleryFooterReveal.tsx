"use client";

import type { ReactNode } from "react";
import { pageReady } from "@/lib/pageReady";
import { MountReveal } from "./MountReveal";

/**
 * Mount-time entrance for GalleryInfoRow's content — a thin client wrapper
 * around MountReveal.tsx, mirroring NavEntrance.tsx's own role for Nav.
 *
 * This file exists specifically so `pageReady` is imported *inside* a
 * "use client" module rather than in GalleryInfoRow.tsx itself (a Server
 * Component). Passing a plain Promise as a prop from a Server Component to a
 * Client Component crosses the RSC serialization boundary — Next.js's server
 * renderer then tries to serialize/await it while building the response.
 * `pageReady` only ever resolves from a browser-side callback (LoadingScreen's
 * own exit timeline), so during SSR it never resolves at all, which hung
 * page renders for `/gallery` indefinitely (confirmed: reverting to a
 * version that imported it directly in GalleryInfoRow.tsx and passed it into
 * MountReveal as a prop took the route from ~30ms to multi-minute
 * responses). Importing it here instead means the import — and the Promise
 * it creates — exists only in client-side code, exactly like NavEntrance.tsx
 * already does for `pageReady`, and never needs to cross that boundary at
 * all.
 *
 * This used to wait on a separate `navReady` promise instead (Nav's own
 * mount reveal), so this footer row started only once Nav's reveal was
 * underway — one continuous top-to-bottom wave across nav and footer.
 * Changed per explicit request (2026-09-23), mirroring the identical change
 * to RevealText.tsx (see that file's comment): this footer reveal no longer
 * waits on Nav's reveal at all, only on the loading screen itself, and
 * `navReady` (src/lib/navReady.ts) was deleted since nothing awaited it
 * anymore. Nav's own internal link-to-link stagger and this row's own
 * internal stagger (both via MountReveal.tsx's `STAGGER`) are unaffected —
 * only the cross-component wave between the two rows is gone.
 */
export function GalleryFooterReveal({ children }: { children: ReactNode }) {
  return (
    <MountReveal waitFor={pageReady} playKey="gallery-footer-entrance">
      {children}
    </MountReveal>
  );
}
