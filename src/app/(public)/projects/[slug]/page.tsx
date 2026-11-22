import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MediaImage } from "@/components/shared/media-image";
import { HeroOverlaySignal } from "@/components/layout/hero-overlay-signal";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CtaLink } from "@/components/shared/cta-link";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { Paragraphs } from "@/components/shared/text-blocks";
import { Reveal } from "@/components/shared/reveal";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectSections } from "@/components/projects/project-sections";
import { ProjectDetailSkeleton } from "@/components/projects/project-skeletons";
import { EnquiryCta } from "@/components/homepage/enquiry-cta-section";
import {
  getPage,
  getProjectBySlug,
  getPublishedSlugs,
  getRelatedProjects,
  getSiteSettings,
} from "@/lib/content/queries";
import { resolveMediaUrl } from "@/lib/content/media";
import { absoluteUrl } from "@/lib/utils/site";
import { formatMonthYear } from "@/lib/utils/format";
import { projectEnquiryMessage } from "@/lib/utils/whatsapp";

const PLACEHOLDER = "__placeholder__";

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  // Cache Components requires at least one entry to validate the route.
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found", robots: { index: false, follow: false } };

  const title = project.seoTitle || project.title;
  const description =
    project.seoDescription || project.shortDescription || project.description?.slice(0, 160) || undefined;
  const image = resolveMediaUrl(project.coverImagePath);

  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/projects/${project.slug}`,
      images: image ? [{ url: image, alt: project.coverImageAlt || project.title }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

async function ProjectView({ params }: { params: PageProps<"/projects/[slug]">["params"] }) {
  const { slug } = await params;
  const [project, settings, listingPage] = await Promise.all([
    getProjectBySlug(slug),
    getSiteSettings(),
    getPage("projects"),
  ]);
  if (!project) notFound();
  const cta = listingPage?.content;
  const fill = (text: string) => text.replaceAll("{project}", project.title);

  const related = await getRelatedProjects(project, 3);
  const projectUrl = absoluteUrl(`/projects/${project.slug}`, settings.seo.siteUrl);
  const whatsappMessage = projectEnquiryMessage({
    brandName: settings.brand.name,
    projectTitle: project.title,
    projectUrl,
  });

  const facts = [
    { label: "Application", value: project.category?.name },
    { label: "Location", value: project.location },
    { label: "Completed", value: formatMonthYear(project.completionDate) },
    { label: "Surface", value: project.applicationType },
    { label: "Film / material", value: project.materialUsed },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  const gallery = project.media
    .filter((m) => m.type === "image")
    .map((m) => ({ path: m.path, alt: m.alt || project.title, caption: m.caption }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.shortDescription ?? undefined,
    url: projectUrl,
    image: resolveMediaUrl(project.coverImagePath) ?? undefined,
    dateModified: project.updatedAt,
    datePublished: project.publishedAt ?? undefined,
    locationCreated: project.location ? { "@type": "Place", name: project.location } : undefined,
    genre: project.category?.name,
    creator: { "@type": "Organization", name: settings.brand.name },
  };

  return (
    <article>
      <script
        type="application/ld+json"
        // JSON-LD only; "<" is escaped so content cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <header data-hero-overlay="" className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-ink text-white md:min-h-[86vh]">
        <HeroOverlaySignal />
        <div className="absolute inset-0 -z-10">
          {project.coverImagePath && (
            <MediaImage
              path={project.coverImagePath}
              alt={project.coverImageAlt || project.title}
              fill
              sizes="100vw"
              preload
              quality={85}
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-black/30" aria-hidden />
        </div>
        <div className="container-site pb-14 pt-[calc(var(--header-height)+3rem)] md:pb-20">
          <Breadcrumbs
            tone="light"
            items={[
              { label: "Home", href: "/" },
              { label: "Projects", href: "/projects" },
              ...(project.category
                ? [{ label: project.category.name, href: `/projects?category=${project.category.slug}` }]
                : []),
              { label: project.title },
            ]}
          />
          <Reveal mode="load" className="mt-8 max-w-5xl">
            {project.category && <p className="text-eyebrow eyebrow-on-image mb-5">{project.category.name}</p>}
            <h1 className="text-display text-balance">{project.title}</h1>
            {project.shortDescription && (
              <p className="text-lead mt-6 max-w-2xl text-white/85">{project.shortDescription}</p>
            )}
          </Reveal>
        </div>
      </header>

      {/* Key facts */}
      {facts.length > 0 && (
        <section aria-label="Project information" className="border-b border-line">
          <dl className="container-site grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-3 lg:grid-cols-5">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-eyebrow text-ink-muted">{fact.label}</dt>
                <dd className="mt-3 font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Overview */}
      {(project.description || settings.contact.whatsapp) && (
        <section className="section-y">
          <div className="container-site">
            <div className="max-w-3xl space-y-10">
              <div className="space-y-4">
                <p className="text-eyebrow text-brand-ink">Overview</p>
                <Paragraphs text={project.description} className="text-[1.125rem]" />
              </div>
              <div className="flex flex-wrap gap-3">
                <CtaLink href={`/contact?project=${encodeURIComponent(project.slug)}`} variant="solid">
                  Enquire about a similar project
                </CtaLink>
                <WhatsAppButton
                  phone={settings.contact.whatsapp}
                  message={whatsappMessage}
                  label="Ask on WhatsApp"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Installation photographs */}
      {gallery.length > 0 && (
        <section className="pb-(--section-space-sm)">
          <div className="container-site">
            <h2 className="text-title mb-8 md:mb-10">Installation photographs</h2>
            <ProjectGallery items={gallery} title={`${project.title}: installation photographs`} />
          </div>
        </section>
      )}

      {/* Flexible case-study content */}
      <ProjectSections sections={project.sections} projectTitle={project.title} />

      <EnquiryCta
        eyebrow={fill(cta?.enquiryEyebrow ?? "")}
        heading={fill(cta?.enquiryHeading || "Planning something similar?")}
        body={fill(cta?.enquiryBody ?? "")}
        cta={{
          label: cta?.enquiryLabel || "Send an enquiry",
          href: `/contact?project=${encodeURIComponent(project.slug)}`,
        }}
        whatsapp={settings.contact.whatsapp ? { phone: settings.contact.whatsapp, message: whatsappMessage } : null}
      />

      {/* Related projects */}
      {related.length > 0 && (
        <section className="section-y">
          <div className="container-site">
            <div className="mb-10 flex items-end justify-between gap-6">
              <h2 className="text-headline">More projects</h2>
              <CtaLink href="/projects" variant="text">
                View all
              </CtaLink>
            </div>
            <div className="grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProjectCard key={p.id} project={p} showDescription={false} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<ProjectDetailSkeleton />}>
      <ProjectView params={params} />
    </Suspense>
  );
}
