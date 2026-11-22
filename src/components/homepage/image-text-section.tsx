import { MediaImage } from "@/components/shared/media-image";
import { CtaLink } from "@/components/shared/cta-link";
import { Reveal } from "@/components/shared/reveal";
import { Eyebrow, Paragraphs } from "@/components/shared/text-blocks";
import type { HomepageContent, HomepageSettings } from "@/lib/validations/sections";
import { cn } from "@/lib/utils";

const ratios = { portrait: "aspect-[4/5]", square: "aspect-square", landscape: "aspect-[4/3]" };

export function ImageTextSection({
  content,
  settings,
}: {
  content: HomepageContent<"image_text">;
  settings: HomepageSettings<"image_text">;
}) {
  const imageRight = settings.imagePosition === "right";
  return (
    <section className={cn("section-y", settings.background === "muted" && "bg-surface-muted")}>
      <div className="container-site grid items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-20">
        <Reveal className={cn("md:col-span-6 lg:col-span-7", imageRight && "md:order-2")}>
          <div className={cn("relative overflow-hidden bg-surface-muted", ratios[settings.imageRatio])}>
            <MediaImage
              path={content.image?.path}
              alt={content.image?.alt || content.heading}
              fill
              sizes="(min-width: 1024px) 55vw, (min-width: 768px) 50vw, 100vw"
            />
          </div>
        </Reveal>
        <Reveal className="md:col-span-6 lg:col-span-5" delay={0.1}>
          <div className="space-y-6">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            {content.heading && <h2 className="text-headline text-balance">{content.heading}</h2>}
            <Paragraphs text={content.body} className="text-ink-muted" />
            {content.cta.label && (
              <div className="pt-2">
                <CtaLink href={content.cta.href} variant="solid">
                  {content.cta.label}
                </CtaLink>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
