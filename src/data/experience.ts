export type ExperienceEntry = {
  company: string;
  companyUrl: string;
  role: string;
  location: string;
  years: string;
};

/** Sourced from the /info page Figma redesign (node 1634:17015), listed most recent first. */
export const experience: ExperienceEntry[] = [
  { company: "Dapital", companyUrl: "https://dapital.xyz/", role: "Product Designer", location: "New York, US (Remote)", years: "2026 — 2026" },
  { company: "Opinly", companyUrl: "https://opinly.ai/", role: "UI/UX Designer", location: "London, UK (Remote)", years: "2025 — 2026" },
  { company: "Ingenuity", companyUrl: "https://www.ingenuity.ph/", role: "Product Designer", location: "Davao, PH", years: "2024 — 2025" },
  { company: "Ingenuity", companyUrl: "https://www.ingenuity.ph/", role: "UI/UX Designer", location: "Davao, PH", years: "2023 — 2024" },
  { company: "The Dividend Tracker", companyUrl: "https://thedividendtracker.com/", role: "UI/UX Designer", location: "Idaho, US (Remote)", years: "2024 — 2024" },
  { company: "Nuxify", companyUrl: "https://nuxify.tech/", role: "UI/UX Design Intern", location: "Davao, PH", years: "2023 — 2023" },
];
