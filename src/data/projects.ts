export type Outcome = {
  stat: string;
  title: string;
  description: string;
};

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
  industryTag: string;
  role: string;
  areas: string;
  scope: string;
  context: string;
  challenge: Beat;
  approach: Beat;
  outcomes: [Outcome, Outcome, Outcome];
  reflection: Beat;
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
    slug: "opinly",
    number: "01",
    name: "Opinly",
    tagline:
      "Rebuilt an AI-powered competitive intelligence platform from the ground up, turning a tool users avoided into one they built their workflow around.",
    industryTag: "SEO AI Startup",
    role: "UI/UX Designer",
    areas: "Product. Website. Design System. Digital Creatives",
    scope:
      "Full product overhaul. Design system. Website redesign. Launch campaign assets.",
    context:
      "Opinly is an AI-powered SEO platform for agencies and founders managing competitive intelligence. Every feature worked. Nothing told users what to do with them. I joined as the sole creative partner to build the order missing from day one.",
    challenge: {
      heading: "A Platform Full of Data and Empty of Direction",
      body: "Every screen now answers one question: what does this user need to do next. Tasks dropped to 3-4 steps. 70+ flows redesigned. One design system, built from scratch, carried the same order into the brand, the website, and the campaigns launched around the product.",
    },
    // Content assigned to match the merged ParagraphPair's render order in
    // ProjectShowcase.tsx (`[approach.body, challenge.body, reflection.body]`
    // — approach displays FIRST, challenge SECOND) rather than each field's
    // own semantic label, since `Beat.heading` is never rendered anywhere
    // (confirmed) — no user-visible inconsistency, just an internal one.
    approach: {
      heading: "Restructuring Around the User's Next Action",
      body: "The platform handed users dense data with no hierarchy and no stated next step. Core tasks ran 9+ steps deep. Sessions ended before a single action, not because a feature was missing, but because nothing ever said what to do next.",
    },
    outcomes: [
      {
        stat: "9 to 3-4",
        title: "Steps",
        description:
          "Steps to complete a core task. Complexity reduced so users could finally act with confidence.",
      },
      {
        stat: "Zero to One",
        title: "Design System",
        description:
          "First design system built from scratch, unifying the UI and giving engineering faster, cleaner builds.",
      },
      {
        stat: "Full Circle",
        title: "One Partner",
        description:
          "Product, brand, website, and campaigns delivered by one creative partner. Retention, leads, and demo requests grew.",
      },
    ],
    reflection: {
      heading: "Direction Is a Design Decision",
      body: "Hierarchy earned what more features never did.",
    },
    media: videoMedia("opinly", 4, "Opinly"),
    images: imageGallery("opinly", 8, "Opinly"),
    accent: { light: "#c2410c", dark: "#fb923c" },
  },
  {
    slug: "lexora",
    number: "02",
    name: "Lexora",
    tagline:
      "Scaled a governance, risk, and compliance platform from a five-person MVP to over one million users as the sole designer across every phase of growth.",
    industryTag: "Compliance Startup",
    role: "UI/UX Designer",
    areas: "Product. Website. Design System. Digital Creatives.",
    scope:
      "Full product design across four phases. Design system. Website. Pitch decks. Marketing collaterals.",
    context:
      "Lexora is a secure compliance platform helping organizations resolve sensitive reports across whistleblowing, grievances, conflict of interest, and fraud. I joined as the sole design partner on a five-person team and stayed through every phase of growth until the platform reached over one million users.",
    // Content assigned to match the merged ParagraphPair's render order in
    // ProjectShowcase.tsx (`[approach.body, challenge.body, reflection.body]`
    // — approach displays FIRST, challenge SECOND) rather than each field's
    // own semantic label, since `Beat.heading` is never rendered anywhere —
    // no user-visible inconsistency, just an internal one. Same convention
    // as Opinly.
    challenge: {
      heading: "High Stakes, Zero Margin for Confusion",
      body: "Every flow was designed to feel human, guided, and safe. Sensitive reports were stripped to their simplest path. Case management was restructured so officers never lost direction under deadline pressure. As the product scaled across four phases and the team grew from 5 to 13, one design system stayed the single source of truth.",
    },
    approach: {
      heading: "Designing a System That Grew Without Breaking",
      body: "Lexora handled sensitive investigations under strict regulatory deadlines for 515,000+ companies bound by the EU Whistleblowing Directive. A compliance officer could not afford to lose their place. A whistleblower had to feel safe enough to report misconduct against someone senior.",
    },
    outcomes: [
      {
        stat: "1M+",
        title: "Users",
        description:
          "Users reached on a platform grown from a five-person MVP to a full-scale compliance suite.",
      },
      {
        stat: "Zero Doubt",
        title: "Precision",
        description:
          "Compliance officers and whistleblowers completed critical tasks with speed and precision. No confusion. No hesitation. No room for error.",
      },
      {
        stat: "Built to Scale",
        title: "Design System",
        description:
          "Design system built from scratch. Engineers moved faster and shipped with consistency across every phase.",
      },
    ],
    reflection: {
      heading: "Clarity Is the Most Protective Design Decision",
      body: "Clarity is protection. Every guided step made someone safer.",
    },
    media: videoMedia("lexora", 5, "Lexora"),
    images: imageGallery("lexora", 7, "Lexora"),
    accent: { light: "#1d4ed8", dark: "#60a5fa" },
  },
  {
    slug: "the-dividend-tracker",
    number: "03",
    name: "The Dividend Tracker",
    tagline:
      "Transformed an outdated, frustrating investment tracking app into a modern product both seasoned investors and beginners return to with confidence.",
    industryTag: "Fintech",
    role: "UI/UX Designer",
    areas: "Product. Website. Digital Creatives.",
    scope:
      "Full mobile app redesign. Web app pages. Website revamp. App store listings. Digital creatives.",
    context:
      "The Dividend Tracker is a portfolio tracking app helping investors monitor dividend income across 500+ brokers and 15+ exchanges worldwide. I joined as sole design partner to turn an outdated, frustrating product into one both seasoned investors and first-time users could trust and return to.",
    // Content assigned to match the merged ParagraphPair's render order in
    // ProjectShowcase.tsx (`[approach.body, challenge.body, reflection.body]`
    // — approach displays FIRST, challenge SECOND) rather than each field's
    // own semantic label, since `Beat.heading` is never rendered anywhere —
    // no user-visible inconsistency, just an internal one. Same convention
    // as Opinly/Lexora.
    challenge: {
      heading: "An App Investors Used Because They Had To",
      body: "Data hierarchy was rebuilt across 50+ flows, cutting core portfolio viewing from 4-5 steps to 2. Progressive disclosure replaced the overwhelming data views. Copy was rewritten to speak to both experts and beginners without intimidation. Onboarding, empty states, and feedback systems were designed from scratch.",
    },
    approach: {
      heading: "Rebuilding Trust Through Clarity and Modern Design",
      body: "Financial data appeared without hierarchy, leaving users unable to understand their portfolios at a glance. Core tasks were buried under 4-5 steps. Onboarding did not exist. Two completely different user types shared one product, and neither one was served well.",
    },
    outcomes: [
      {
        stat: "50+",
        title: "Flows Rebuilt",
        description:
          "Outdated flows rebuilt into clear, guided experiences that made tracking feel modern and accessible.",
      },
      {
        stat: "Rebuilt",
        title: "Every Screen",
        description:
          "Every screen overhauled. Investors who once avoided the app now return to it with ease and confidence.",
      },
      {
        stat: "Clarity First",
        title: "Progressive Disclosure",
        description:
          "Financial data restructured with progressive disclosure so users felt informed and in control at every step.",
      },
    ],
    reflection: {
      heading: "Good Design Makes Complex Things Feel Simple",
      body: "The shift from a product users tolerate to one they return to happens in decisions invisible to the user.",
    },
    media: videoMedia("the-dividend-tracker", 5, "The Dividend Tracker"),
    images: imageGallery("the-dividend-tracker", 7, "The Dividend Tracker"),
    accent: { light: "#047857", dark: "#34d399" },
  },
  {
    slug: "foodops",
    number: "04",
    name: "FoodOps",
    tagline:
      "Designed an FDA-compliant food traceability platform from scratch, delivering a launch-ready MVP in six weeks with a concept-to-prototype in 2 days.",
    industryTag: "Food Tech Startup",
    role: "Product Designer",
    areas: "Product. Design System. PRD Documentation.",
    scope:
      "Full product design from scratch. Web portal. Mobile app. Design system. PRD preparation.",
    context:
      "FoodOps is a food traceability platform helping restaurants comply with FDA FSMA Rule 204 requirements. I worked directly with stakeholders to turn a complex regulatory idea into a fully functional MVP within a six-week agile delivery.",
    // Content assigned to match the merged ParagraphPair's render order in
    // ProjectShowcase.tsx (`[approach.body, challenge.body, reflection.body]`
    // — approach displays FIRST, challenge SECOND) rather than each field's
    // own semantic label, since `Beat.heading` is never rendered anywhere —
    // no user-visible inconsistency, just an internal one. Same convention
    // as Opinly/Lexora/The Dividend Tracker.
    challenge: {
      heading: "Regulatory Complexity in the Hands of Kitchen Staff",
      body: "Every user flow was mapped from scratch, stripping the mobile experience to its core: open app, scan, done. Complex transformation and shipping flows were broken into structured steps with pre-populated fields and copy written for non-technical users. The design system, the full PRD, and a launch-ready MVP shipped within six weeks.",
    },
    approach: {
      heading: "Turning Regulatory Requirements Into Simple, Guided Actions",
      body: "FSMA Rule 204 required restaurants to record Critical Tracking Events across their food supply chain, with regulatory consequences for errors. The people executing these tasks were kitchen staff with low to moderate tech experience, working under time pressure. Complex regulatory data had to stay simple enough for someone scanning a barcode during a busy service.",
    },
    outcomes: [
      {
        stat: "6 Weeks",
        title: "Concept to Launch",
        description:
          "Full MVP delivered on time, from concept to launch-ready product within a fixed agile timeline.",
      },
      {
        stat: "Fully Owned",
        title: "End to End",
        description:
          "Portal, mobile app, design system, and PRD delivered by one designer from scratch.",
      },
      {
        stat: "2 Days",
        title: "Concept to Prototype",
        description:
          "Concept to testable prototype in 2 days instead of 1 week through AI-assisted research and rapid prototyping.",
      },
    ],
    reflection: {
      heading: "Simplicity Is the Most Powerful Compliance Tool",
      body: "A kitchen worker needs a clear next step, not a regulation to interpret.",
    },
    media: videoMedia("foodops", 3, "FoodOps"),
    images: imageGallery("foodops", 5, "FoodOps"),
    accent: { light: "#b45309", dark: "#fbbf24" },
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
