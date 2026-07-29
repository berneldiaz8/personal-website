/**
 * Mixed-weight display headline: "Name—description", name in Medium weight (black),
 * description in ExtraLight (muted), both in the site's font-sans family. Figma:
 * Display/5xl Medium + Display/5xl ExtraLight (paired styles — a single Figma text
 * style can't express two weights in one run). The em-dash is an explicit, scoped
 * exception to the site's em-dash ban — see CLAUDE.md and .claude/rules/skills-used.md
 * before touching it.
 *
 * Shared by every project's ProjectShowcase (originally introduced for Opinly).
 */
export function ShowcaseHeadline({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div className="px-4 pt-6 pb-[136px] sm:px-5 lg:px-6">
      <div className="max-w-[60rem] text-balance text-4xl font-medium leading-[1.1] tracking-[-0.5px] text-foreground sm:text-5xl">
        {name}
        <span className="font-extralight text-muted">
          {"—"}
          {description}
        </span>
      </div>
    </div>
  );
}
