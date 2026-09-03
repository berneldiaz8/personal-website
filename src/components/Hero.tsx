import { RevealText } from "./RevealText";
import { Logo } from "./Logo";

/**
 * Line-mask entrance via RevealText (see that file) — swapped from a bespoke
 * mount-time fade-up for a consistent reveal treatment with the case-study
 * narrative text. RevealText's ScrollTrigger ("top 85%") still fires on
 * mount here since the hero sits at the very top of the page, already past
 * that threshold when the trigger is created. Source: Figma node
 * 1587:15147 — the two-line headline + separate subtext this replaced is now
 * one flowing statement, with the wordmark set inline as the sentence's
 * subject rather than sitting in a byline above it.
 *
 * `leading-[1.2]`, not the Figma-matched 1.15 this originally shipped with —
 * same descender-clipping fix as ShowcaseHeadline.tsx (see that file's own
 * comment for the mechanism: SplitText's mask wrapper has no explicit
 * height, so it inherits its box purely from `line-height`, clipping
 * descender ink normal unmasked text never would). Confirmed on a real
 * device at 1.15 — g/p descenders in "products"/"design"/"ships" were
 * still getting clipped — so this matches the value already proven to
 * clear it there, rather than re-deriving a separate minimum.
 */
export function Hero() {
  return (
    <section className="px-4 pt-10 pb-16 sm:px-5 sm:pb-24 lg:px-6 lg:pb-10">
      <RevealText
        as="h1"
        className="max-w-[923px] text-pretty text-3xl font-extralight leading-[1.2] tracking-[-0.5px] text-muted sm:text-4xl lg:text-[48px]"
      >
        <span className="sr-only">berneldiaz</span>
        <Logo
          aria-hidden="true"
          className="mr-3 inline-block h-[0.73em] w-auto translate-y-[calc(0.05em_-_1px)] align-baseline text-foreground"
        />
        is a UI/UX designer who takes complex products with no design
        foundation and ships them end to end.
      </RevealText>

      <div className="h-[240px]" />
    </section>
  );
}
