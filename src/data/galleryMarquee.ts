export type MarqueeItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
  project: string;
  label: string;
};

/**
 * Representative spread across all 4 case studies for the /gallery marquee —
 * pulled from the real device-mockup `showcase-*` assets already used in
 * ProjectShowcase.tsx (not the flat `image-N.jpg` set in projects.ts, which
 * is uniformly landscape and wouldn't give the marquee's mixed portrait/
 * landscape rhythm). width/height are each file's real pixel dimensions
 * (verified via `sips`), passed to next/image so it can reserve space
 * without layout shift while GalleryMarquee scales tiles by height only.
 */
export const galleryMarqueeItems: MarqueeItem[] = [
  {
    src: "/work/opinly/showcase-secondary-hero.jpg",
    alt: "Opinly Content Studio blog content list",
    width: 2896,
    height: 1720,
    project: "Opinly",
    label: "Content Studio",
  },
  {
    src: "/work/opinly/showcase-audit.jpg",
    alt: "Opinly site audit modal showing a score of 93 out of 100",
    width: 1448,
    height: 1720,
    project: "Opinly",
    label: "Site Audit",
  },
  {
    src: "/work/opinly/showcase-idea-ads.jpg",
    alt: "Opinly promotional ad copy generator",
    width: 2896,
    height: 1720,
    project: "Opinly",
    label: "Ad Copy Generator",
  },
  {
    src: "/work/lexora/showcase-speakup.jpg",
    alt: "Lexora Speak Up Program confidentiality policy page",
    width: 2896,
    height: 1720,
    project: "Lexora",
    label: "Speak Up Program",
  },
  {
    src: "/work/lexora/showcase-speakup-detail.jpg",
    alt: "Lexora Speak Up Program confidentiality policy page",
    width: 1448,
    height: 1720,
    project: "Lexora",
    label: "Confidentiality Policy",
  },
  {
    src: "/work/lexora/showcase-case-report.jpg",
    alt: "Lexora case report detail view showing report CR-01192",
    width: 2896,
    height: 1720,
    project: "Lexora",
    label: "Case Report",
  },
  {
    src: "/work/the-dividend-tracker/showcase-signin.jpg",
    alt: "The Dividend Tracker sign-in screen reading 'Welcome back! Your dividends are waiting.'",
    width: 1448,
    height: 1720,
    project: "The Dividend Tracker",
    label: "Sign In",
  },
  {
    src: "/work/the-dividend-tracker/showcase-watchlist-calendar.jpg",
    alt: "The Dividend Tracker watchlist, dividend calendar, and dividends payout screens",
    width: 2896,
    height: 1720,
    project: "The Dividend Tracker",
    label: "Dividend Calendar",
  },
  {
    src: "/work/the-dividend-tracker/showcase-holdings-detail.jpg",
    alt: "The Dividend Tracker holdings detail, edit holdings, and retirement value conversion screens",
    width: 2896,
    height: 1720,
    project: "The Dividend Tracker",
    label: "Holdings Detail",
  },
  {
    src: "/work/foodops/showcase-prep-product.jpg",
    alt: "FoodOps Preparation of new product form",
    width: 1448,
    height: 1720,
    project: "FoodOps",
    label: "Preparation Form",
  },
  {
    src: "/work/foodops/showcase-product-details-panel.jpg",
    alt: "FoodOps product details panel with traceability information",
    width: 1448,
    height: 1720,
    project: "FoodOps",
    label: "Traceability Panel",
  },
  {
    src: "/work/foodops/showcase-products.jpg",
    alt: "FoodOps Products incoming shipments table",
    width: 2896,
    height: 1720,
    project: "FoodOps",
    label: "Shipments Table",
  },
];
