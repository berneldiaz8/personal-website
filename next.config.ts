import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 75 is next/image's own default; 90 is what ProjectShowcase.tsx's
    // ShowcaseImage uses for work-page media; 100 is what GalleryMarquee.tsx
    // uses for /gallery's marquee tiles and lightbox.
    qualities: [75, 90, 100],
  },
};

export default nextConfig;
