export type MarqueeItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
  project: string;
  label: string;
};

/**
 * Full 24-image spread for the /gallery marquee — 6 real product screens per
 * case study (Lexora, FoodOps, The Dividend Tracker, Opinly, in that fixed
 * display order), sourced from the "Media 3" folder (G-{project}{1-6}.jpg)
 * rather than the showcase- or image-N assets ProjectShowcase.tsx and
 * projects.ts use — these are gallery-specific and don't appear elsewhere.
 * Converted into public/work/{slug}/gallery-{1-6}.jpg via the same
 * `ffmpeg -vf "scale='min(1600,iw)':-2" -q:v 4` pipeline this codebase
 * already uses for projects.ts's imageGallery() (56-292KB each afterward).
 * width/height are each converted file's real pixel dimensions (verified
 * via `sips`), passed to next/image so it can reserve space without layout
 * shift while GalleryMarquee scales tiles by height only. Order within each
 * project (1 through 6) is preserved from the source filenames.
 *
 * The Dividend Tracker's images went through a churn of reuploads under
 * these same "Media 3" filenames on 2026-08-10: gallery-1 through gallery-5
 * were replaced once, removed after the user reported the live site still
 * looked like the pre-reupload version despite exhaustive server/cache/
 * build verification finding nothing wrong, then re-exported a second time
 * and re-added. gallery-6 ("Homepage") was separately deleted after a
 * leftover, never-wired-in G-DVT6.jpg was found sitting unused in the
 * "Media 3" source folder and removed from there too — then restored here
 * once the user reuploaded a fresh G-DVT6.jpg and asked for it back.
 */
export const galleryMarqueeItems: MarqueeItem[] = [
  {
    src: "/work/lexora/gallery-1.jpg",
    alt: "Lexora case report detail view showing report CR-01192, a criminal report under review",
    width: 1600,
    height: 1180,
    project: "Lexora",
    label: "Case Report Detail",
  },
  {
    src: "/work/lexora/gallery-2.jpg",
    alt: "Lexora closed case final assessment document with evidence collected and conclusion sections",
    width: 1600,
    height: 1766,
    project: "Lexora",
    label: "Final Case Assessment",
  },
  {
    src: "/work/lexora/gallery-3.jpg",
    alt: "Lexora analytics dashboard with reports distribution, case manager assignments, and request trends",
    width: 1600,
    height: 1476,
    project: "Lexora",
    label: "Analytics Dashboard",
  },
  {
    src: "/work/lexora/gallery-4.jpg",
    alt: "Lexora video call interface with a live meeting notes panel",
    width: 1600,
    height: 1040,
    project: "Lexora",
    label: "Meeting Notes",
  },
  {
    src: "/work/lexora/gallery-5.jpg",
    alt: "Lexora report submission form with an accompanying reporting guide",
    width: 1512,
    height: 1216,
    project: "Lexora",
    label: "Report Submission",
  },
  {
    src: "/work/lexora/gallery-6.jpg",
    alt: "Lexora marketing homepage reading 'A safer way to report concerns. Built for compliance.'",
    width: 1600,
    height: 2116,
    project: "Lexora",
    label: "Homepage",
  },
  {
    src: "/work/foodops/gallery-1.jpg",
    alt: "FoodOps incoming shipments table listing products pending receipt scan",
    width: 1600,
    height: 1214,
    project: "FoodOps",
    label: "Incoming Shipments",
  },
  {
    src: "/work/foodops/gallery-2.jpg",
    alt: "FoodOps product detail panel for Eggs/Oeufs BrownShell with traceability lot code information",
    width: 1600,
    height: 1164,
    project: "FoodOps",
    label: "Product Detail Panel",
  },
  {
    src: "/work/foodops/gallery-3.jpg",
    alt: "FoodOps spreadsheet generator with food traceability list and lot code filters",
    width: 1600,
    height: 1040,
    project: "FoodOps",
    label: "Spreadsheet Generator",
  },
  {
    src: "/work/foodops/gallery-4.jpg",
    alt: "FoodOps traceability plan document for Riverside Grill",
    width: 1600,
    height: 1186,
    project: "FoodOps",
    label: "Traceability Plan",
  },
  {
    src: "/work/foodops/gallery-5.jpg",
    alt: "FoodOps preparation of new product form recording a transformation event",
    width: 1600,
    height: 1520,
    project: "FoodOps",
    label: "Product Preparation Form",
  },
  {
    src: "/work/foodops/gallery-6.jpg",
    alt: "FoodOps mobile app barcode scan flow from scan prompt to product receipt",
    width: 1600,
    height: 1040,
    project: "FoodOps",
    label: "Barcode Scan Flow",
  },
  {
    src: "/work/the-dividend-tracker/gallery-1.jpg",
    alt: "The Dividend Tracker holdings detail, edit holdings, and retirement value conversion screens",
    width: 1600,
    height: 1040,
    project: "The Dividend Tracker",
    label: "Holdings Detail",
  },
  {
    src: "/work/the-dividend-tracker/gallery-2.jpg",
    alt: "The Dividend Tracker watchlist, dividend calendar, and dividends payout screens",
    width: 1600,
    height: 1040,
    project: "The Dividend Tracker",
    label: "Dividend Calendar",
  },
  {
    src: "/work/the-dividend-tracker/gallery-3.jpg",
    alt: "The Dividend Tracker payout calendar and portfolio diversification breakdown screens",
    width: 1600,
    height: 1904,
    project: "The Dividend Tracker",
    label: "Portfolio Diversification",
  },
  {
    src: "/work/the-dividend-tracker/gallery-4.jpg",
    alt: "The Dividend Tracker dashboard and dividend income goal calculator screens",
    width: 1600,
    height: 1694,
    project: "The Dividend Tracker",
    label: "Income Calculator",
  },
  {
    src: "/work/the-dividend-tracker/gallery-5.jpg",
    alt: "The Dividend Tracker manage portfolios, most popular stocks, and financials screens",
    width: 1600,
    height: 1216,
    project: "The Dividend Tracker",
    label: "Manage Portfolios",
  },
  {
    src: "/work/the-dividend-tracker/gallery-6.jpg",
    alt: "The Dividend Tracker marketing homepage reading 'Track your dividends. Maximize your wealth.'",
    width: 1600,
    height: 2116,
    project: "The Dividend Tracker",
    label: "Homepage",
  },
  {
    src: "/work/opinly/gallery-1.jpg",
    alt: "Opinly sign-in screen beside a preview of SEO dashboard cards",
    width: 1600,
    height: 1040,
    project: "Opinly",
    label: "Sign In",
  },
  {
    src: "/work/opinly/gallery-2.jpg",
    alt: "Opinly main dashboard with traffic, keywords, backlinks, and site audit summary",
    width: 1600,
    height: 1642,
    project: "Opinly",
    label: "Dashboard Overview",
  },
  {
    src: "/work/opinly/gallery-3.jpg",
    alt: "Opinly keywords page with search intent distribution and tracked keyword table",
    width: 1600,
    height: 1324,
    project: "Opinly",
    label: "Keyword Research",
  },
  {
    src: "/work/opinly/gallery-4.jpg",
    alt: "Opinly Content Studio blog content list with a content calendar sidebar",
    width: 1600,
    height: 1214,
    project: "Opinly",
    label: "Content Studio",
  },
  {
    src: "/work/opinly/gallery-5.jpg",
    alt: "Opinly competitor analytics with organic traffic comparison and long-term trend charts",
    width: 1600,
    height: 1160,
    project: "Opinly",
    label: "Competitor Analytics",
  },
  {
    src: "/work/opinly/gallery-6.jpg",
    alt: "Opinly marketing homepage reading 'Grow SEO & LLM Traffic on Auto-Pilot'",
    width: 1600,
    height: 2116,
    project: "Opinly",
    label: "Homepage",
  },
];
