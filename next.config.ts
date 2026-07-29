import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 75 is next/image's own default; 90 is what ProjectShowcase.tsx's
    // ShowcaseImage uses for work-page media.
    qualities: [75, 90],
  },
};

export default nextConfig;
