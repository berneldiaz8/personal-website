export type Beat = {
  heading: string;
  body: string;
};

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
  ownership: string;
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
  /** "The Work" section's paragraphs, in render order: workIntro, workDetail, workDetail2 (optional 4th paragraph), workClosing. */
  workIntro: Beat;
  workDetail: Beat;
  /** Optional 4th "The Work" paragraph, rendered between workDetail and workClosing when present. */
  workDetail2?: Beat;
  workClosing: Beat;
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
      "Translated dense FDA recordkeeping requirements into a food traceability platform restaurant staff could actually use under pressure, delivered from scratch as a launch-ready MVP.",
    ndaCaption: "Presented under NDA. The product name and certain visuals have been changed.",
    industryTag: "Food Tech Startup",
    role: "Product Designer",
    ownership: "Mobile app, web portal, design system",
    team: "1 designer, 1 product manager, plus stakeholders",
    timeline: "6-week MVP",
    context: [
      "Restaurants sit at the end of the food supply chain. Under FSMA Rule 204, they must keep records at every point they receive, transform, or ship covered food, and produce that data within 24 hours of an FDA request.",
      "I designed both sides of this compliance platform alone: a mobile scanning app for kitchen staff, and a back-office portal for managers, covering three regulatory checkpoints in six weeks.",
    ],
    problem: [
      "No system existed for this at the restaurant level. Records lived on paper, in scattered invoices, in whatever format a distributor sent. Pulling that together for an FDA request meant a manual search through files never built to be searched.",
      "The problem was designing a workflow kitchen staff under time pressure, and a manager juggling constant interruptions, would both use correctly every time.",
    ],
    discovery: [
      "Before I designed a single screen, I read the FSMA Rule 204 text and the PTI implementation guidance directly. That reading surfaced the finding that shaped the whole product: a restaurant's receiving record depends on the distributor's shipping record to be verified as compliant. Two companies, one transaction, matched by lot code.",
      "That finding pointed to a page most stakeholders didn't want built. Kitchen staff receive and scan; they don't browse a queue, so an Arriving Shipments list looked unnecessary from a pure staff-workflow view. I made the case that the page wasn't for kitchen staff. It was the only point where a supplier's data could enter the system before a truck arrived. Without it, a receiving record had nothing to check itself against. The page stayed in scope.",
    ],
    workIntro: {
      heading: "Structured Around the Regulation Itself",
      body: "The delivered portal followed the regulation's own structure: separate sections for Arriving Shipments, Transformation, Shipping, Spreadsheet, and Traceability Plan. Within six weeks, this let me design and validate consistently across every checkpoint, rather than risk an untested structure across all three at once.",
    },
    workDetail: {
      heading: "Two Form Factors, Not One Responsive Interface",
      body: "I split the platform across two form factors instead of one responsive interface. Kitchen staff mid-shift and a manager juggling interruptions needed different things entirely, so the mobile app became a near-invisible capture layer, stripped to the scan itself, while the portal held the structural complexity: cross-referencing shipments, generating lot codes, producing exportable records.",
    },
    workClosing: {
      heading: "One System, Two Form Factors, Zero Rebuilt Components",
      body: "Every screen pulls from one token-based design system I built alongside the product. One system, two form factors, five sections, zero rebuilt components.",
    },
    outcomeSummary: [
      "I co-authored the technical data specifications with the Product Manager, translating each workflow into a structure developers could build from directly. Stakeholders approved the specification, with positive feedback on the approach.",
      "This engagement delivered a system a restaurant can rely on when FDA comes asking. Every data relationship had a defined structure: cross-company reconciliation between receiving and shipping records, lot code logic linking transformation events to their source, and a portal validated across every checkpoint. That structure does the platform's actual job: a restaurant produces a compliant record within the 24-hour window FDA Rule 204 requires, instead of a manual search through scattered files.",
      "My engagement ended at handoff, so I can't speak to what happened after. What I can speak to, in detail, is every decision behind it, and where I'd take it next.",
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
      "Built the design foundation of a governance, risk, and compliance platform from scratch, as the sole designer across four phases of product growth from MVP to enterprise-ready system.",
    ndaCaption: "Presented under NDA. The product name and certain visuals have been changed.",
    industryTag: "Compliance Startup",
    role: "UI/UX Designer",
    ownership: "Product, website, design system",
    team: "1 designer, 10+ engineers, plus stakeholder",
    timeline: "1+ years, four phases of product growth.",
    context: [
      "Lexora is a secure compliance platform built for organizations managing sensitive internal reports. Reporters submit concerns anonymously across whistleblowing, grievances, conflict of interest, and fraud. Case managers investigate and resolve those reports. Organizations use the platform to demonstrate regulatory compliance with audit-ready documentation.",
    ],
    problem: [
      "No product. No design. No system. A dense compliance brief and a hard regulatory deadline. The brief defined what the platform needed to do but left every structural decision open. How does an anonymous whistleblower maintain access to their own report without an account? Who sees what inside a sensitive case involving potential retaliation? How does a case move from submission to audit-ready closure without breaking the chain of confidentiality? These weren't edge cases. They were the core of the product.",
    ],
    // Placeholder — real Discovery copy pending, matching FoodOps' pattern once written.
    discovery: ["Placeholder discovery copy — real content pending."],
    workDetail: {
      heading: "High Stakes, Zero Margin for Confusion",
      body: "The hardest problem was identity without an account. An anonymous whistleblower needs to access their own report, receive updates, and communicate with investigators, all without creating a traceable account. I designed a report key system as the identity mechanism, giving reporters persistent access without compromising their anonymity.",
    },
    workIntro: {
      heading: "Designing a System That Grew Without Breaking",
      body: "Every structural decision the brief left undefined was mine to make before engineering wrote a line of code.",
    },
    workClosing: {
      heading: "Clarity Is the Most Protective Design Decision",
      body: "From there: a role-based permission model defining exactly what assignees, followers, and admins see and can do. A full case lifecycle from submission through three distinct closure types. Three separate interfaces for whistleblowers, company users, and back office administration. A design system built from scratch and maintained solo across four phases of growth.",
    },
    outcomeSummary: [
      "A compliance system that didn't exist, built from a brief by one designer. Anonymous reporters access their cases without a traceable account. Case managers work within a permission structure that protects confidentiality at every stage. Compliance officers close cases with documentation that holds up to regulatory scrutiny. Four phases of growth, 10+ engineers, one design foundation that held.",
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
      "Rebuilt an AI-powered competitive intelligence platform from the ground up, overhauling a data-heavy tool that left users without direction into one with clear structure and guided actions.",
    industryTag: "SEO AI Startup",
    role: "UI/UX Designer",
    ownership: "Product, website, design system",
    team: "1 designer, 3 engineers",
    timeline: "7 months",
    context: [
      "Opinly is an AI-powered SEO platform for agencies and founders managing competitive intelligence. Every feature worked. Nothing told users what to do with them. I joined as the sole creative partner to build the order missing from day one.",
    ],
    problem: [
      "Every feature worked. Nothing told users what to do with them. Core tasks ran 9+ steps deep, and sessions ended before a single action was taken, not because a feature was missing, but because nothing on screen ever said what to do next. The design problem wasn't a missing feature. It was a platform full of data and empty of direction.",
    ],
    // Placeholder — real Discovery copy pending, matching FoodOps' pattern once written.
    discovery: ["Placeholder discovery copy — real content pending."],
    workDetail: {
      heading: "A Platform Full of Data and Empty of Direction",
      body: "Every screen now answers one question: what does this user need to do next. Tasks dropped to 3-4 steps. 70+ flows redesigned. One design system, built from scratch, carried the same order into the brand, the website, and the campaigns launched around the product.",
    },
    workIntro: {
      heading: "Restructuring Around the User's Next Action",
      body: "The platform handed users dense data with no hierarchy and no stated next step. Core tasks ran 9+ steps deep. Sessions ended before a single action, not because a feature was missing, but because nothing ever said what to do next.",
    },
    workClosing: {
      heading: "Direction Is a Design Decision",
      body: "Hierarchy earned what more features never did.",
    },
    outcomeSummary: [
      "A product that went from leaving first-time users without direction to actively telling them what's working, what's declining, and what to do next. Two new product areas, Content Studio and platform integrations, shipped within the same consistent foundation. One insight, applied across an entire product.",
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
    ownership: "Mobile app, website",
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
    workDetail: {
      heading: "An App Investors Used Because They Had To",
      body: "Portfolio creation went from a single overloaded screen to a guided experience with four distinct paths. The payout calendar became a layered structure moving from yearly forecast to monthly calendar to individual stock payouts by date. Premium features were shown in context before asking for payment, so free users understood what they were missing before being asked to upgrade. Showing value before asking for payment is progressive disclosure applied to the business model, not just the interface.",
    },
    workIntro: {
      heading: "Rebuilding Trust Through Clarity and Modern Design",
      body: "The structural problems had one root cause: the product presented everything at once with no system for guiding users through complexity. I redesigned the entire product around one principle: progressive disclosure.",
    },
    workClosing: {
      heading: "Good Design Makes Complex Things Feel Simple",
      body: "Empty states, loading states, and error states were designed across every flow so no moment in the product was left unhandled. One principle. Applied across an entire product.",
    },
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
