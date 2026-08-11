export type CarouselItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
  project: string;
  label: string;
};

/**
 * Full 24-image spread for the /gallery carousel (Lexora, FoodOps, The
 * Dividend Tracker, Opinly, in that fixed display order), sourced from the
 * "Media 3" folder (G-{project}{N}.jpg) rather than the showcase- or
 * image-N assets ProjectShowcase.tsx and projects.ts use — these are
 * gallery-specific and don't appear elsewhere. Converted into
 * public/work/{slug}/gallery-{N}.jpg via the same
 * `ffmpeg -vf "scale='min(1600,iw)':-2" -q:v 4` pipeline this codebase
 * already uses for projects.ts's imageGallery() (56-292KB each afterward).
 * width/height are each converted file's real pixel dimensions (verified
 * via `sips`), passed to next/image so it can reserve space without layout
 * shift while GalleryCarousel scales tiles by height only. Order within each
 * project is preserved from the source filenames.
 *
 * The Dividend Tracker's file numbering has a gap: it runs gallery-1
 * through gallery-5, then gallery-7 (no gallery-6) — still 6 images total,
 * matching Lexora/FoodOps/Opinly. gallery-7 was originally added
 * (2026-08-10) as a confirmed-duplicate 7th tile alongside gallery-6 — its
 * source was byte-for-byte identical to gallery-6's own source (same MD5),
 * both the same "Track your dividends. Maximize your wealth." homepage
 * screenshot, added anyway per explicit user request after flagging the
 * duplication. gallery-6 was then removed at the user's request, leaving
 * gallery-7 as the sole surviving "Homepage" tile — the numbering gap is a
 * byproduct of that removal, not a bug. gallery-6 itself had already gone
 * back and forth more than once earlier the same day (removed after an
 * unused leftover source turned up in the "Media 3" folder, restored after
 * a reupload, removed again, restored again) before this final removal.
 * The "Media 3" source file this built gallery-7.jpg is converted from was
 * briefly renamed to G-DVT6.jpg and back to G-DVT7.jpg again shortly after
 * — net no change, source and built filenames match as G-DVT7/gallery-7
 * throughout. gallery-1 through gallery-5 separately went through their own
 * reupload churn: replaced once, removed after the user reported the live
 * site still looked like the pre-reupload version despite exhaustive
 * server/cache/build verification finding nothing wrong, then re-exported
 * a second time and re-added — those 5 are unaffected by gallery-6/7's own
 * history.
 */
export const galleryCarouselItems: CarouselItem[] = [
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
    label: "Meeting Session",
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
    label: "Product Details",
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
    label: "Holding Details, Edit Holdings, Value Conversion",
  },
  {
    src: "/work/the-dividend-tracker/gallery-2.jpg",
    alt: "The Dividend Tracker watchlist, dividend calendar, and dividends payout screens",
    width: 1600,
    height: 1040,
    project: "The Dividend Tracker",
    label: "Watchlist, Dividend Calendar, Dividends Paid",
  },
  {
    src: "/work/the-dividend-tracker/gallery-3.jpg",
    alt: "The Dividend Tracker payout calendar and portfolio diversification breakdown screens",
    width: 1600,
    height: 1904,
    project: "The Dividend Tracker",
    label: "Payout Calendar, Portfolio Diversification",
  },
  {
    src: "/work/the-dividend-tracker/gallery-4.jpg",
    alt: "The Dividend Tracker dashboard and dividend income goal calculator screens",
    width: 1600,
    height: 1694,
    project: "The Dividend Tracker",
    label: "Dashboard, Income Calculator",
  },
  {
    src: "/work/the-dividend-tracker/gallery-5.jpg",
    alt: "The Dividend Tracker manage portfolios, most popular stocks, and financials screens",
    width: 1600,
    height: 1216,
    project: "The Dividend Tracker",
    label: "Manage Portfolios, Ideas, Holdings Financials",
  },
  {
    src: "/work/the-dividend-tracker/gallery-7.jpg",
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
