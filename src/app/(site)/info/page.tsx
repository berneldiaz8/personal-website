import type { Metadata } from "next";
import { RevealText } from "@/components/RevealText";
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
        <RevealText className="col-span-4 flex flex-col gap-6 sm:col-span-8 lg:col-span-4 lg:col-start-7">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className={textStyles.heading2xl}>
              {paragraph}
            </p>
          ))}
        </RevealText>
      </Grid>

      <div className="py-20">
        {/* Inset to match the Grid's own margin (px-4 sm:px-5 lg:px-6) rather than
            full-bleed — same fix as Footer.tsx's own separator, a plain sibling div
            instead of border-t on the Grid itself (which sits at the outer edge of
            its box, outside the padding, and spans edge to edge). */}
        <div className="mx-4 border-t border-border sm:mx-5 lg:mx-6" />
        <Grid className="items-start pt-3">
          {/* col-span-4 sm:col-span-4 lg:col-span-3 lg:col-start-4 — matches
              ProjectShowcase.tsx's ParagraphPair label position ("The
              Context"/"The Problem"/"The Work"/"The Outcome" on /work),
              per explicit user request to keep this label's grid slot
              consistent with that pattern. */}
          <RevealText as="div" className="col-span-4 sm:col-span-4 lg:col-span-3 lg:col-start-4">
            <p className={textStyles.labelXs}>Experience</p>
          </RevealText>

          <div className="col-span-4 flex flex-col sm:col-span-8 lg:col-span-6 lg:col-start-7">
            {experience.map((entry, i) => (
              <div
                key={`${entry.company}-${entry.years}`}
                className={`flex flex-col gap-1 lg:flex-row lg:items-start lg:gap-4 ${
                  i === 0 ? "" : "mt-10 border-t border-border pt-3"
                }`}
              >
                <div className="flex flex-col lg:flex-1">
                  {/* as="a" — the anchor itself is the SplitText target
                      here (not nested inside a `<p>` this component
                      splits), so it keeps its own role and gets the
                      auto-generated aria-label directly, same pattern as
                      the h1/h3 cases. See RevealText.tsx's own comment for
                      why nesting the anchor instead silently broke it. */}
                  <RevealText
                    as="a"
                    href={entry.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-fit ${textStyles.heading2xl}`}
                  >
                    {entry.company}
                  </RevealText>
                  <RevealText as="div">
                    <p className={textStyles.heading2xlLight}>{entry.role}</p>
                  </RevealText>
                </div>
                {/* lg:contents stays on this plain wrapper, not on the
                    RevealText divs below it — a display:contents element
                    generates no box of its own, so ScrollTrigger measured
                    a degenerate 0-height rect for it and fired the reveal
                    immediately on load instead of when scrolled into view
                    (confirmed: text was already fully revealed at
                    scrollY:0, 824px before it ever entered the viewport).
                    RevealText now wraps each `<p>` individually — real
                    boxes, correct trigger position — and picks up the
                    flex-item classes that used to live on the `<p>`s
                    themselves, since these divs are what become direct
                    flex items of the grandparent once lg:contents kicks
                    in. */}
                <div className="mt-2 flex items-center justify-between lg:mt-0 lg:contents">
                  <RevealText as="div" className="lg:flex-1">
                    <p className="text-xs font-normal uppercase tracking-[0.4px] text-muted">
                      {entry.location}
                    </p>
                  </RevealText>
                  <RevealText as="div" className="lg:flex-1 lg:text-right">
                    <p className="text-xs font-normal uppercase tracking-[0.4px] text-muted">
                      {entry.years}
                    </p>
                  </RevealText>
                </div>
              </div>
            ))}
          </div>
        </Grid>
      </div>
    </section>
  );
}
