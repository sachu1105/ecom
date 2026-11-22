import { ArtDirectedImage } from "@/components/shared/art-directed-image";
import { HeroOverlaySignal } from "@/components/layout/hero-overlay-signal";
import { CtaLink } from "@/components/shared/cta-link";
import { Reveal } from "@/components/shared/reveal";
import type { HomepageContent, HomepageSettings } from "@/lib/validations/sections";
import { cn } from "@/lib/utils";

export function CampaignBannerSection({
  content,
  settings,
  isFirst = false,
}: {
  content: HomepageContent<"campaign_banner">;
  settings: HomepageSettings<"campaign_banner">;
  isFirst?: boolean;
}) {
  const centered = settings.align === "center";
  const hasImage = !!content.image?.path;
  return (
    <section
      {...(isFirst && hasImage ? { "data-hero-overlay": "" } : {})}
      className={cn(
        "relative isolate flex overflow-hidden bg-ink text-white",
        settings.height === "tall" ? "min-h-[80svh] md:min-h-[90vh]" : "min-h-[60svh] md:min-h-[70vh]",
      )}
    >
      {isFirst && hasImage && <HeroOverlaySignal />}
      <div className="absolute inset-0 -z-10">
        <ArtDirectedImage desktop={content.image} mobile={content.mobileImage} eager={isFirst} />
        <div className="absolute inset-0 bg-black" style={{ opacity: settings.overlay / 100 }} aria-hidden />
      </div>
      <div
        className={cn(
          "container-site flex w-full flex-col justify-end py-16 md:py-24",
          centered && "items-center justify-center text-center",
        )}
      >
        <Reveal className={cn("max-w-4xl", centered && "mx-auto")}>
          {content.eyebrow && <p className="text-eyebrow eyebrow-on-image mb-5">{content.eyebrow}</p>}
          {content.heading && <h2 className="text-display text-balance">{content.heading}</h2>}
          {content.body && (
            <p className={cn("text-lead mt-6 max-w-xl text-white/85", centered && "mx-auto")}>{content.body}</p>
          )}
          {content.cta.label && (
            <div className="mt-9">
              <CtaLink href={content.cta.href} variant="light">
                {content.cta.label}
              </CtaLink>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
