import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkBrowser } from "@/components/WorkBrowser";

export const metadata: Metadata = {
  title: "Bernel Diaz — Work",
  description: "Selected product design case studies by Bernel Diaz.",
};

export default function WorkPage() {
  return (
    <>
      <h1 className="sr-only">Work</h1>
      {/* min-h-dvh fallback (not null): useSearchParams() forces this
          Suspense boundary to exist, but there's no real async work behind
          it — it resolves within a tick on client navigation. A `null`
          fallback still means `<main>` briefly collapses to ~0 height in
          that tick, which lets the browser auto-clamp scroll onto the
          always-mounted, sticky Footer for a frame (see SmoothScroll.tsx's
          route-change scroll-reset comment for the full mechanism). Holding
          real height here removes that collapse as a contributing cause
          entirely, on top of the useLayoutEffect fix in SmoothScroll.tsx. */}
      <Suspense fallback={<div className="min-h-dvh" />}>
        <WorkBrowser />
      </Suspense>
    </>
  );
}
