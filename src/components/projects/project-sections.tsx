import { Quote } from "lucide-react";
import { MediaImage } from "@/components/shared/media-image";
import { BeforeAfter } from "@/components/shared/before-after";
import { VideoPlayer } from "@/components/shared/video-player";
import { Reveal } from "@/components/shared/reveal";
import { Paragraphs } from "@/components/shared/text-blocks";
import { ProjectGallery } from "./project-gallery";
import type { ProjectSection } from "@/lib/validations/sections";
import { cn } from "@/lib/utils";

function SectionShell({
  heading,
  children,
  className,
  wide = false,
}: {
  heading: string | null;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <section className={cn("section-y-sm", className)}>
      <div className={cn("container-site", !wide && "grid gap-8 lg:grid-cols-12 lg:gap-16")}>
        {heading && (
          <h2 className={cn("text-title", wide ? "mb-8 md:mb-10" : "lg:col-span-4")}>{heading}</h2>
        )}
        <div className={cn(!wide && (heading ? "lg:col-span-8" : "lg:col-span-8 lg:col-start-5"))}>{children}</div>
      </div>
    </section>
  );
}

/** Renders a case study's flexible content sections in order. */
export function ProjectSections({ sections, projectTitle }: { sections: ProjectSection[]; projectTitle: string }) {
  return (
    <>
      {sections.map((section) => {
        switch (section.type) {
          case "text": {
            const { body, layout } = section.content;
            if (!body && !section.heading) return null;
            return (
              <SectionShell key={section.id} heading={section.heading}>
                <Reveal>
                  <Paragraphs
                    text={body}
                    className={cn(layout === "lead" && "text-[clamp(1.25rem,2vw,1.625rem)] leading-[1.55] font-medium")}
                  />
                </Reveal>
              </SectionShell>
            );
          }
          case "gallery": {
            const items = section.content.images.map((img) => ({
              path: img.path,
              alt: img.alt || projectTitle,
              caption: img.caption,
            }));
            if (items.length === 0) return null;
            return (
              <SectionShell key={section.id} heading={section.heading} wide>
                <ProjectGallery items={items} layout={section.content.layout} title={section.heading || projectTitle} />
              </SectionShell>
            );
          }
          case "full_image": {
            const { image, caption } = section.content;
            if (!image) return null;
            return (
              <section key={section.id} className="section-y-sm">
                {section.heading && (
                  <div className="container-site mb-8">
                    <h2 className="text-title">{section.heading}</h2>
                  </div>
                )}
                <figure>
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-muted sm:aspect-[21/10]">
                    <MediaImage path={image.path} alt={image.alt || section.heading || projectTitle} fill sizes="100vw" />
                  </div>
                  {caption && (
                    <figcaption className="container-site mt-4 text-sm text-ink-muted">{caption}</figcaption>
                  )}
                </figure>
              </section>
            );
          }
          case "image_text": {
            const { image, body, imagePosition } = section.content;
            return (
              <section key={section.id} className="section-y-sm">
                <div className="container-site grid items-center gap-10 md:grid-cols-2 lg:gap-20">
                  <Reveal className={cn(imagePosition === "right" && "md:order-2")}>
                    <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
                      <MediaImage
                        path={image?.path}
                        alt={image?.alt || section.heading || projectTitle}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                      />
                    </div>
                  </Reveal>
                  <Reveal delay={0.1} className="space-y-6">
                    {section.heading && <h2 className="text-headline">{section.heading}</h2>}
                    <Paragraphs text={body} className="text-ink-muted" />
                  </Reveal>
                </div>
              </section>
            );
          }
          case "before_after": {
            const { before, after, beforeLabel, afterLabel, caption } = section.content;
            if (!before || !after) return null;
            return (
              <SectionShell key={section.id} heading={section.heading} wide className="bg-surface-muted">
                <BeforeAfter before={before} after={after} beforeLabel={beforeLabel} afterLabel={afterLabel} />
                {caption && <p className="mt-4 text-sm text-ink-muted">{caption}</p>}
              </SectionShell>
            );
          }
          case "video": {
            const { video, poster, caption, autoplay } = section.content;
            if (!video) return null;
            return (
              <SectionShell key={section.id} heading={section.heading} wide>
                <figure>
                  <div className="relative aspect-video overflow-hidden bg-ink">
                    <VideoPlayer src={video.path} poster={poster?.path} ambient={autoplay} label={section.heading || projectTitle} />
                  </div>
                  {caption && <figcaption className="mt-4 text-sm text-ink-muted">{caption}</figcaption>}
                </figure>
              </SectionShell>
            );
          }
          case "specifications": {
            const items = section.content.items.filter((i) => i.label && i.value);
            if (items.length === 0) return null;
            return (
              <SectionShell key={section.id} heading={section.heading || "Specifications"}>
                <dl className="divide-y divide-line border-y border-line">
                  {items.map((item, i) => (
                    <div key={i} className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-6">
                      <dt className="text-sm text-ink-muted">{item.label}</dt>
                      <dd className="font-medium sm:col-span-2">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </SectionShell>
            );
          }
          case "quote": {
            const { quote, author, role } = section.content;
            if (!quote) return null;
            return (
              <section key={section.id} className="section-y">
                <div className="container-site">
                  <Reveal>
                    <figure className="mx-auto max-w-5xl">
                      <Quote className="size-10 text-brand" aria-hidden />
                      <blockquote className="mt-8 text-[clamp(1.5rem,3.2vw,2.75rem)] font-medium leading-[1.25] tracking-[-0.02em] text-balance">
                        “{quote}”
                      </blockquote>
                      {(author || role) && (
                        <figcaption className="mt-8 text-[0.9375rem]">
                          <span className="font-semibold">{author}</span>
                          {role && <span className="text-ink-muted">{author ? " — " : ""}{role}</span>}
                        </figcaption>
                      )}
                    </figure>
                  </Reveal>
                </div>
              </section>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}
