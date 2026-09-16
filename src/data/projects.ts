export type MediaItem = {
  src: string;
  poster: string;
  alt: string;
};

export type ImageItem = {
  src: string;
  alt: string;
};

export type Project = {
  slug: string;
  number: string;
  name: string;
  tagline: string;
  /** NDA disclosure shown under the headline. Omit when the project isn't under NDA. */
  ndaCaption?: string;
  industryTag: string;
  role: string;
  /** Rendered under the "Scope" label in ProjectShowcase.tsx's meta row. */
  scope: string;
  team: string;
  timeline: string;
  /** One or more paragraphs, rendered as separate <p>s (see ParagraphPair). */
  context: string[];
  /** One or more paragraphs, rendered as separate <p>s (see ParagraphPair). */
  problem: string[];
  /** One or more paragraphs, rendered as separate <p>s (see ParagraphPair).
   * Placeholder copy for projects that haven't gotten their real Discovery
   * beat written yet — see the per-project value's own comment. */
  discovery: string[];
  /** One or more paragraphs, rendered as separate <p>s (see ParagraphPair). */
  outcomeSummary: string[];
  /** "The Work"/Approach section's paragraphs, rendered verbatim as separate
   * <p>s (see ParagraphPair), same shape as context/problem/discovery/
   * outcomeSummary. No fixed beat count or structure — one or more
   * paragraphs, in whatever order reads best for that project's narrative. */
  workBody: string[];
  /** Looping muted product-walkthrough clips, converted from the source Figma exports. */
  media: MediaItem[];
  /** Static supporting visuals (mockups, ad creatives, UI detail shots) from the source Figma deck. */
  images: ImageItem[];
  /** Per-project accent, verified >= 4.5:1 contrast against --background in both themes */
  accent: { light: string; dark: string };
};

/** Generates the {slug}/1.mp4 + {slug}/1-poster.jpg pairs produced by the gif-to-mp4 conversion. */
function videoMedia(slug: string, count: number, name: string): MediaItem[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return {
      src: `/work/${slug}/${n}.mp4`,
      poster: `/work/${slug}/${n}-poster.jpg`,
      alt: `${name} product walkthrough, clip ${n}`,
    };
  });
}

/** Generates the {slug}/image-N.jpg gallery from the source Figma image exports. */
function imageGallery(slug: string, count: number, name: string): ImageItem[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return {
      src: `/work/${slug}/image-${n}.jpg`,
      alt: `${name} supporting visual, ${n}`,
    };
  });
}

export const projects: Project[] = [
  {
    slug: "foodops",
    number: "01",
    name: "FoodOps",
    tagline:
      "Translated a federal food safety regulation into a three-screen scan and a request-ready portal, built as an MVP.",
    ndaCaption: "Presented under NDA. The product name and certain visuals have been changed.",
    industryTag: "Food Tech Startup",
    role: "Product Designer",
    scope: "Product, design system",
    team: "1 designer, 1 product manager, plus stakeholders",
    timeline: "6-week MVP",
    context: [
      "Restaurants sit at the end of the food supply chain. Under FSMA Rule 204, they have to keep records at every point they receive, transform, or ship covered food, and produce that data within 24 hours if FDA asks for it.",
      "I designed both sides of this compliance platform alone: a mobile scanning app for kitchen staff, and a back-office portal for managers, three regulatory checkpoints in six weeks.",
    ],
    problem: [
      "Nothing existed for this at the restaurant level. Records lived on paper, in scattered invoices, in whatever format a distributor happened to send. Pulling that together for an FDA request meant digging through files that were never built to be searched.",
      "The real challenge was getting a kitchen worker under time pressure, and a manager juggling constant interruptions, to both use this correctly every time.",
    ],
    discovery: [
      "Before I touched a screen, I read the FSMA Rule 204 text and the PTI implementation guidance myself. That's what surfaced the finding that shaped the whole product: a restaurant's receiving record depends on the distributor's shipping record to be verified as compliant. Two companies, one transaction, matched by lot code.",
      "That finding is what justified a page most stakeholders didn't want built. Staff receive and scan, they don't browse a queue, so an Arriving Shipments list looked unnecessary from a pure workflow angle. My case was that the page was never for staff. It was the only point where a supplier's data could get into the system before a truck showed up, and without it, a receiving record had nothing to check itself against. The page stayed in scope.",
    ],
    workBody: [
      "What shipped followed the regulation's own structure: separate sections for Arriving Shipments, Transformation, Shipping, Spreadsheet, Traceability Plan. Six weeks isn't enough time to gamble on an untested structure across all three checkpoints at once, so this is what let me design and validate consistently. I also split the platform into two form factors instead of forcing one responsive interface to do both jobs. A kitchen worker mid-shift and a manager fielding constant interruptions need completely different things, so the mobile app became a near-invisible capture layer, three screens, zero typing, while the portal carried the structural complexity: cross-referencing shipments, generating lot codes, producing exportable records.",
      "I scoped the import pipeline as required from day one, since without it a clean data feed and a phone call with a scribbled note would look identical to the system. Every screen also runs on one token-based design system I built alongside the product, which is why Transformation and Shipping share the same form structure instead of getting rebuilt separately.",
    ],
    outcomeSummary: [
      "I co-authored the technical data specifications with the Product Manager, turning each workflow into something developers could build from directly. Stakeholders approved it, with good feedback on the approach. What this engagement delivered was a system a restaurant can rely on when FDA comes asking. Every data relationship had a defined structure: cross-company reconciliation between receiving and shipping records, lot code logic linking transformation events to their source, a portal validated across every checkpoint.",
      "That structure does the platform's actual job, a restaurant produces a compliant record within the 24-hour window FDA Rule 204 requires, instead of a manual search through scattered files. My engagement ended at handoff, so I can't speak to what happened after. What I can walk through, in full, is every decision behind it, and where I'd take it next.",
    ],
    media: videoMedia("foodops", 3, "FoodOps"),
    images: imageGallery("foodops", 5, "FoodOps"),
    accent: { light: "#b45309", dark: "#fbbf24" },
  },
  {
    slug: "lexora",
    number: "02",
    name: "Lexora",
    tagline:
      "Built the design foundation for a GRC compliance platform, solo, from MVP to enterprise-ready.",
    ndaCaption: "Presented under NDA. The product name and certain visuals have been changed.",
    industryTag: "Compliance Startup",
    role: "UI/UX Designer",
    scope: "Product, website, design system",
    team: "1 designer, 10+ engineers, plus stakeholder",
    timeline: "1+ years, four phases of product growth.",
    context: [
      "Lexora is a secure compliance platform. Organizations use it to manage and resolve reports across whistleblowing, grievances, conflict of interest, and fraud. Reporters submit anonymously. Case managers investigate without breaking that confidentiality. Organizations produce audit-ready documentation for regulators. I joined a five-person team as the only designer and built the design foundation across four phases of growth.",
    ],
    problem: [
      "No product existed. No design system was in place. We were starting from a blank canvas with nothing but a dense compliance brief and a hard regulatory deadline. Every structural call was still open. Three questions sat at the center of it: How do you give someone recoverable access when you've agreed never to know who they are? How do you protect a report from the people it might be about? How do you build a paper trail that holds up in court without exposing the reporter? That's the core of the product, not an edge case.",
    ],
    discovery: [
      "The hardest problem here wasn't a mechanism to design. It was a tension no mechanism could actually resolve. A report key gives full anonymity. Lose it, access is gone for good. A registered account gives recovery. It costs you a personal identifier. No option does both. The real question wasn't which one to offer, it was how to disclose that tradeoff honestly, right at the moment a reporter has to choose.",
    ],
    workBody: [
      "I placed the disclosure guide directly beside the access choice, not tucked into a separate help page, so the tradeoff registers before a reporter commits, not after. Underneath that, a two-layer permission model does the heavier lifting, account-level roles control who manages the company and its settings, case-level roles control who can act on one specific report. It protects a report from the people it might concern, but not from an implicated admin, and I say that limit out loud instead of overselling what the system can do.",
      "The case lifecycle closes things out with three closure types. Locking freezes the case record, redaction leaves a visible marker instead of quietly deleting data, so the audit-ready claim has a real mechanism behind it, not just a label. The design system scaled right along with all of this, every new domain reused the same components instead of starting from zero, which is what let the product grow from one module to six without a rebuild. One case-management engine carried the whole thing, maintained solo, and in Phase 4 that same architecture extended into a four-tier partner model with no rebuild needed.",
    ],
    outcomeSummary: [
      "A compliance system got built from a brief, by one designer. Reporters choose between two access methods, each carrying a disclosed tradeoff, not a hidden one. Case managers work inside a permission structure that states its own limits instead of pretending it doesn't have any. Compliance officers close cases with a locked, structured final report built to hold up under regulatory scrutiny.",
      "Engineering grew past ten people. Design stayed a team of one, and the foundation held, later extending into a four-tier partner architecture without a rebuild. One gap turned up on later review: every anonymity protection in this product shields the reporter from the company, none of them shields the investigator from the reporter. That's the next problem this system needs to solve.",
    ],
    media: videoMedia("lexora", 5, "Lexora"),
    images: imageGallery("lexora", 7, "Lexora"),
    accent: { light: "#1d4ed8", dark: "#60a5fa" },
  },
  {
    slug: "opinly",
    number: "03",
    name: "Opinly",
    tagline:
      "Rebuilt a competitive intelligence platform from static reporting to guided action, design system built from zero.",
    industryTag: "SEO AI Startup",
    role: "UI/UX Designer",
    scope: "Product, website, design system",
    team: "1 designer, 3 engineers",
    timeline: "7 months",
    context: [
      "Opinly is an AI-powered competitive intelligence and SEO platform. Marketers and founders use it to track competitors, monitor keyword rankings, run site audits, manage backlinks, and generate SEO content. I joined as the sole designer, working directly with the founding team to rebuild the product end to end.",
    ],
    problem: [
      "There was no handoff when I joined, so I opened the product myself and went through it the way a new user would. Every page followed the same pattern: numbers on screen, nothing telling you what they meant or what to do next. The dashboard was the clearest version of this. Competitor data, rankings, audit scores, all sitting there with nothing connecting them to action.",
    ],
    discovery: [
      "Going through the product screen by screen made the real problem clear. This wasn't about missing features. Every core function already worked, tracking, auditing, monitoring, all of it. The gap was that none of it told you what to do with what you were looking at.",
    ],
    workBody: [
      "There was no design system either, so that came first, built alongside the redesign so components got tested against real screens right away. With that foundation in place, I started with the dashboard: declining metrics got a prompt with a path to act on, static numbers became trend lines you could read at a glance, empty states started pointing at a real next step instead of sitting blank.",
      "The founder told me users were stalling at the Content Studio integration step, where they connect their live site. The product already had the answers: I'd designed brand voice controls in settings, a review-and-approve workflow so nothing publishes without sign-off, and content scoring against SEO criteria. But none of that was visible from the integration screen. I built a concerns screen at that step surfacing what the product already handled, so the user could see the answers right when they needed them. That same thinking carried through the rest of the product, including the platform integration layer.",
    ],
    outcomeSummary: [
      "The design system is the thing that lasts. It didn't exist before and now sits behind every screen in the product. On top of it, the product went from displaying information to telling users what to do next, starting with the dashboard and carried through Content Studio and the integration layer.",
    ],
    media: videoMedia("opinly", 4, "Opinly"),
    images: imageGallery("opinly", 8, "Opinly"),
    accent: { light: "#c2410c", dark: "#fb923c" },
  },
  {
    slug: "the-dividend-tracker",
    number: "04",
    name: "The Dividend Tracker",
    tagline:
      "Overhauled an outdated mobile dividend tracking app end to end, identifying every structural problem before redesigning the entire product.",
    industryTag: "Fintech",
    role: "UI/UX Designer",
    scope: "Product, website",
    team: "1 designer, 1 engineer",
    timeline: "2 months",
    context: [
      "The Dividend Tracker is a mobile investment app built for dividend investors. It tracks portfolio performance, monitors upcoming dividend payouts, forecasts future income, and helps investors set and track financial goals, all in one place. From someone receiving their first dividend to someone managing a complex multi-portfolio strategy, the app is built to make passive income visible and manageable.",
    ],
    problem: [
      "I audited the app first. Structural problems ran across every surface from onboarding to the most complex features in the product. A first-time investor trying to add their first portfolio hit a screen with no guidance and no clear starting point. The payout calendar showed dividend data without telling them what to do with it. Edge cases were missing throughout, so empty states, loading screens, and errors left users stranded at critical moments. The product had the features. The structure to use them didn't exist.",
    ],
    // Placeholder — real Discovery copy pending, matching FoodOps' pattern once written.
    discovery: ["Placeholder discovery copy — real content pending."],
    workBody: [
      "The structural problems had one root cause: the product presented everything at once with no system for guiding users through complexity. I redesigned the entire product around one principle: progressive disclosure.",
      "Portfolio creation went from a single overloaded screen to a guided experience with four distinct paths. The payout calendar became a layered structure moving from yearly forecast to monthly calendar to individual stock payouts by date. Premium features were shown in context before asking for payment, so free users understood what they were missing before being asked to upgrade. Showing value before asking for payment is progressive disclosure applied to the business model, not just the interface.",
      "Empty states, loading states, and error states were designed across every flow so no moment in the product was left unhandled. One principle. Applied across an entire product.",
    ],
    outcomeSummary: [
      "An outdated app with no structural system became a product with a clear principle applied consistently across every surface. A first-time investor adding their first portfolio follows a guided path with a clear starting point. The payout calendar layers annual forecast, monthly calendar, and individual stock payouts in one screen so any level of detail is reachable without switching views. Every empty state, loading state, and error state has a handled response. The structure that was missing now exists.",
    ],
    media: videoMedia("the-dividend-tracker", 5, "The Dividend Tracker"),
    images: imageGallery("the-dividend-tracker", 7, "The Dividend Tracker"),
    accent: { light: "#047857", dark: "#34d399" },
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
