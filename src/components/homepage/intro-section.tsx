import { CtaLink } from "@/components/shared/cta-link";
import { Reveal } from "@/components/shared/reveal";
import { Eyebrow, Paragraphs } from "@/components/shared/text-blocks";
import type { HomepageContent, HomepageSettings } from "@/lib/validations/sections";
import { cn } from "@/lib/utils";

/**
 * Splits a stat such as "1,200+", "10 yr" or "100%" into its number and unit,
 * so the unit can carry the accent colour. Values without a leading number
 * are shown as they are.
 */
function StatValue({ value }: { value: string }) {
  const match = /^([\d.,]+)(.+)$/.exec(value.trim());
  if (!match) return value;
  return (
    <>
      {match[1]}
      <span className="text-brand">{match[2]}</span>
    </>
  );
}

/** Company introduction: a large editorial statement with supporting stats. */
export function IntroSection({
  content,
  settings,
}: {
  content: HomepageContent<"intro">;
  settings: HomepageSettings<"intro">;
}) {
  return (
    <section className={cn("section-y", settings.background === "muted" && "bg-surface-muted")}>
      <div className="container-site">
        <div className="space-y-10">
          <Reveal className="max-w-4xl">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            {content.heading && (
              <h2 className="mt-4 text-[clamp(1.75rem,3.6vw,3.25rem)] font-medium leading-[1.12] tracking-[-0.02em] text-balance">
                {content.heading}
              </h2>
            )}
          </Reveal>
          <div className="grid gap-10 md:grid-cols-2">
            <Paragraphs text={content.body} className="text-ink-muted" />
            {content.cta.label && (
              <div className="md:self-end md:justify-self-end">
                <CtaLink href={content.cta.href} variant="text">
                  {content.cta.label}
                </CtaLink>
              </div>
            )}
          </div>
          {content.stats.length > 0 && (
            <dl className="grid grid-cols-2 gap-px overflow-hidden border-y border-line bg-line md:grid-cols-4">
              {content.stats.map((stat, i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-background py-8 pr-6",
                    // Breathing room after the divider; the first cell of each row stays flush.
                    i % 2 === 1 && "pl-6",
                    i % 4 !== 0 && "md:pl-6",
                    settings.background === "muted" && "bg-surface-muted",
                  )}
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-none tracking-tight">
                      <StatValue value={stat.value} />
                    </span>
                    <span className="mt-3 block text-sm text-ink-muted">{stat.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
