import type { Metadata } from "next";
import { MediaImage } from "@/components/shared/media-image";
import { HeroOverlaySignal } from "@/components/layout/hero-overlay-signal";
import { Reveal } from "@/components/shared/reveal";
import { Eyebrow, Paragraphs, SectionHeading } from "@/components/shared/text-blocks";
import { EnquiryCta } from "@/components/homepage/enquiry-cta-section";
import { EmptyState } from "@/components/shared/empty-state";
import { getPage, getSiteSettings } from "@/lib/content/queries";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");
  return {
    title: page?.seoTitle || page?.title || "About",
    description: page?.seoDescription || page?.content.hero.subtitle || undefined,
    alternates: { canonical: "/about" },
  };
}

function SplitBlock({
  eyebrow,
  heading,
  body,
  image,
  reverse,
  muted,
}: {
  eyebrow: string;
  heading: string;
  body: string;
  image: { path: string; alt: string } | null;
  reverse?: boolean;
  muted?: boolean;
}) {
  if (!heading && !body) return null;
  return (
    <section className={cn("section-y", muted && "bg-surface-muted")}>
      <div className="container-site grid items-center gap-10 md:grid-cols-12 lg:gap-20">
        {image && (
          <Reveal className={cn("md:col-span-6", reverse && "md:order-2")}>
            <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
              <MediaImage path={image.path} alt={image.alt || heading} fill sizes="(min-width: 768px) 50vw, 100vw" />
            </div>
          </Reveal>
        )}
        <Reveal delay={0.1} className={cn("space-y-6", image ? "md:col-span-6" : "md:col-span-8")}>
          <Eyebrow>{eyebrow}</Eyebrow>
          {heading && <h2 className="text-headline text-balance">{heading}</h2>}
          <Paragraphs text={body} className="text-ink-muted" />
        </Reveal>
      </div>
    </section>
  );
}

export default async function AboutPage() {
  const [page, settings] = await Promise.all([getPage("about"), getSiteSettings()]);

  if (!page) {
    return (
      <div className="container-site section-y">
        <EmptyState title="About us" description="This page is being prepared." />
      </div>
    );
  }

  const { hero, intro, story, expertise, process, values, gallery, cta } = page.content;
  const heroImage = hero.image;

  return (
    <>
      {/* Hero */}
      <header
        {...(heroImage ? { "data-hero-overlay": "" } : {})}
        className={cn(
          "relative isolate flex items-end overflow-hidden",
          heroImage ? "min-h-[72svh] bg-ink text-white md:min-h-[80vh]" : "pt-12 md:pt-20",
        )}
      >
        {heroImage && <HeroOverlaySignal />}
        {heroImage && (
          <div className="absolute inset-0 -z-10">
            <MediaImage path={heroImage.path} alt={heroImage.alt} fill sizes="100vw" preload quality={85} />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-black/25" aria-hidden />
          </div>
        )}
        <div className={cn("container-site", heroImage ? "pb-14 pt-[calc(var(--header-height)+3rem)] md:pb-20" : "pb-10")}>
          <Reveal mode="load" className="max-w-5xl">
            {hero.eyebrow && (
              <p className={cn("text-eyebrow mb-5", heroImage ? "eyebrow-on-image" : "text-brand-ink")}>{hero.eyebrow}</p>
            )}
            <h1 className="text-display-xl text-balance">{hero.heading || page.title}</h1>
            {hero.subtitle && (
              <p className={cn("text-lead mt-6 max-w-2xl", heroImage ? "text-white/85" : "text-ink-muted")}>
                {hero.subtitle}
              </p>
            )}
          </Reveal>
        </div>
      </header>

      <SplitBlock {...intro} />
      <SplitBlock {...story} reverse muted />

      {/* Expertise */}
      {expertise.items.length > 0 && (
        <section className="section-y">
          <div className="container-site">
            <SectionHeading eyebrow={expertise.eyebrow} heading={expertise.heading} className="mb-12 md:mb-16" />
            <ul className="grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-3">
              {expertise.items.map((item, i) => (
                <li key={i} className="bg-background p-8 md:p-10">
                  <p className="text-title">{item.title}</p>
                  {item.body && <p className="mt-4 leading-relaxed text-ink-muted">{item.body}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Process */}
      {process.steps.length > 0 && (
        <section className="section-y bg-dark text-white">
          <div className="container-site">
            <div className="mb-12 max-w-3xl space-y-4 md:mb-16">
              {process.eyebrow && <p className="text-eyebrow text-brand-light">{process.eyebrow}</p>}
              {process.heading && <h2 className="text-headline text-balance">{process.heading}</h2>}
            </div>
            <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {process.steps.map((step, i) => (
                <li key={i} className="border-t border-white/20 pt-6">
                  <span className="text-sm tabular-nums text-white/50">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-title mt-4">{step.title}</p>
                  {step.body && <p className="mt-3 leading-relaxed text-white/70">{step.body}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Values */}
      {values.items.length > 0 && (
        <section className="section-y">
          <div className="container-site grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading eyebrow={values.eyebrow} heading={values.heading} />
            </div>
            <dl className="divide-y divide-line border-y border-line lg:col-span-8">
              {values.items.map((item, i) => (
                <div key={i} className="grid gap-2 py-7 md:grid-cols-3 md:gap-8">
                  <dt className="text-title">{item.title}</dt>
                  <dd className="leading-relaxed text-ink-muted md:col-span-2">{item.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Editorial imagery */}
      {gallery.images.length > 0 && (
        <section className="pb-(--section-space)">
          <div className="container-site grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {gallery.images.map((img, i) => (
              <div
                key={`${img.path}-${i}`}
                className={cn(
                  "relative overflow-hidden bg-surface-muted",
                  i % 5 === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-[4/5]",
                )}
              >
                <MediaImage
                  path={img.path}
                  alt={img.alt}
                  fill
                  sizes={i % 5 === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <EnquiryCta
        heading={cta.heading}
        body={cta.body}
        cta={cta.primaryCta}
        whatsapp={
          settings.contact.whatsapp
            ? { phone: settings.contact.whatsapp, message: settings.contact.whatsappMessage || undefined }
            : null
        }
      />
    </>
  );
}
