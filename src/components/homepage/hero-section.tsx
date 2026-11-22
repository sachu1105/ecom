import { ArtDirectedImage } from "@/components/shared/art-directed-image";
import { HeroOverlaySignal } from "@/components/layout/hero-overlay-signal";
import { VideoPlayer } from "@/components/shared/video-player";
import { CtaLink } from "@/components/shared/cta-link";
import { Reveal } from "@/components/shared/reveal";
import type { HomepageContent, HomepageSettings } from "@/lib/validations/sections";
import { cn } from "@/lib/utils";

type Props = {
  content: HomepageContent<"hero">;
  settings: HomepageSettings<"hero">;
  /** True when this hero is the first block on the page (sits under the header). */
  isFirst?: boolean;
};

export function HeroSection({ content, settings, isFirst = true }: Props) {
  const hasVideo = settings.useVideo && !!content.video?.path;
  const hasMedia = !!content.image?.path || hasVideo;
  const centered = settings.align === "center";

  return (
    <section
      {...(isFirst && hasMedia ? { "data-hero-overlay": "" } : {})}
      aria-label={content.heading || "Introduction"}
      className={cn(
        "relative isolate flex w-full overflow-hidden bg-ink text-white",
        settings.height === "full" ? "h-svh min-h-[600px]" : "h-[86svh] min-h-[560px] lg:h-[88vh]",
      )}
    >
      {isFirst && hasMedia && <HeroOverlaySignal />}
      <div className="absolute inset-0 -z-10">
        <ArtDirectedImage desktop={content.image} mobile={content.mobileImage} eager={isFirst} quality={85} />
        {hasVideo && (
          <div className="absolute inset-0">
            <VideoPlayer
              src={content.video?.path}
              poster={content.image?.path}
              ambient
              controlsClassName="left-5 right-auto md:left-8 md:right-auto"
            />
          </div>
        )}
        {/* Readability overlays: adjustable tint + bottom gradient */}
        <div className="absolute inset-0 bg-black" style={{ opacity: settings.overlay / 100 }} aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/55 to-transparent" aria-hidden />
      </div>

      <div
        className={cn(
          "container-site relative flex w-full flex-col justify-end pb-16 pt-[calc(var(--header-height)+2rem)] md:pb-24",
          centered && "items-center justify-center text-center",
        )}
      >
        <Reveal mode="load" className={cn("max-w-5xl", centered && "mx-auto")}>
          {content.eyebrow && <p className="text-eyebrow eyebrow-on-image mb-5">{content.eyebrow}</p>}
          {content.heading && <h1 className="text-display-xl text-balance">{content.heading}</h1>}
          {content.subtitle && (
            <p
              className={cn(
                "text-lead mt-6 max-w-xl text-white/85 text-pretty",
                centered && "mx-auto",
              )}
            >
              {content.subtitle}
            </p>
          )}
          {(content.primaryCta.label || content.secondaryCta.label) && (
            <div className={cn("mt-9 flex flex-wrap gap-3", centered && "justify-center")}>
              {content.primaryCta.label && (
                <CtaLink href={content.primaryCta.href} variant="light">
                  {content.primaryCta.label}
                </CtaLink>
              )}
              {content.secondaryCta.label && (
                <CtaLink href={content.secondaryCta.href} variant="outline-light">
                  {content.secondaryCta.label}
                </CtaLink>
              )}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
