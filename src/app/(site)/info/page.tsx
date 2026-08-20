import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { Grid } from "@/components/showcase/Grid";
import { experience } from "@/data/experience";
import { textStyles } from "@/lib/typography";

export const metadata: Metadata = {
  title: "Bernel Diaz — Info",
  description:
    "Bernel Diaz is a designer who brings structure and clarity to complex products, from early-stage startups to platforms serving over a million people.",
};

const paragraphs = [
  "UI/UX Designer based in the Philippines.",
  "On most of my projects, I've been the only designer on the team.",
  "Most of my work has started before the structure was settled. I'm drawn to products at that stage, where someone has to decide how the thing actually works, not just how it looks.",
  "I find what's broken, define the structure, and ship it end to end. Across B2B SaaS, startups, and enterprise software.",
];

export default function InfoPage() {
  return (
    <section className="pt-10">
      <h1 className="sr-only">About</h1>

      <Grid className="items-start pb-6">
        <Reveal className="col-span-4 flex flex-col gap-6 sm:col-span-8 lg:col-span-4 lg:col-start-7">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className={textStyles.heading2xl}>
              {paragraph}
            </p>
          ))}
        </Reveal>
      </Grid>

      <div className="py-20">
        {/* Inset to match the Grid's own margin (px-4 sm:px-5 lg:px-6) rather than
            full-bleed — same fix as Footer.tsx's own separator, a plain sibling div
            instead of border-t on the Grid itself (which sits at the outer edge of
            its box, outside the padding, and spans edge to edge). */}
        <div className="mx-4 border-t border-border sm:mx-5 lg:mx-6" />
        <Grid className="items-start pt-3">
          <Reveal className="col-span-4 sm:col-span-8 lg:col-span-6">
            <p className={textStyles.labelXs}>Experience</p>
          </Reveal>

          <div className="col-span-4 flex flex-col sm:col-span-8 lg:col-span-6 lg:col-start-7">
            {experience.map((entry, i) => (
              <Reveal key={`${entry.company}-${entry.years}`} delay={i * 0.06}>
                <div
                  className={`flex flex-col gap-1 lg:flex-row lg:items-start lg:gap-4 ${
                    i === 0 ? "" : "mt-10 border-t border-border pt-3"
                  }`}
                >
                  <div className="flex flex-col lg:flex-1">
                    <a
                      href={entry.companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-fit ${textStyles.heading2xl}`}
                    >
                      {entry.company}
                    </a>
                    <p className={textStyles.heading2xlLight}>{entry.role}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between lg:mt-0 lg:contents">
                    <p className="text-xs font-normal uppercase tracking-[0.4px] text-muted lg:flex-1">
                      {entry.location}
                    </p>
                    <p className="text-xs font-normal uppercase tracking-[0.4px] text-muted lg:flex-1 lg:text-right">
                      {entry.years}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Grid>
      </div>
    </section>
  );
}
