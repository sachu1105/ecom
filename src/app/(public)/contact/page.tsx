import { Suspense } from "react";
import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { MediaImage } from "@/components/shared/media-image";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { SocialIcon, SOCIAL_LABELS } from "@/components/shared/social-icons";
import { getPage, getPublishedProjects, getSiteSettings } from "@/lib/content/queries";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("contact");
  return {
    title: page?.seoTitle || page?.title || "Contact",
    description: page?.seoDescription || page?.content.intro || undefined,
    alternates: { canonical: "/contact" },
  };
}

async function ContactFormWithProject({
  searchParams,
  projects,
  successMessage,
}: {
  searchParams: PageProps<"/contact">["searchParams"];
  projects: { slug: string; title: string }[];
  successMessage?: string;
}) {
  const { project } = await searchParams;
  const slug = typeof project === "string" ? project.slice(0, 160) : "";
  return <ContactForm projects={projects} defaultProject={slug} successMessage={successMessage} />;
}

function FormSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse border-b border-line" />
      ))}
      <div className="h-32 animate-pulse border-b border-line" />
    </div>
  );
}

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const [page, settings, projects] = await Promise.all([
    getPage("contact"),
    getSiteSettings(),
    getPublishedProjects(),
  ]);
  const content = page?.content;
  const { contact, social } = settings;

  return (
    <>
      <header className="container-site pb-12 pt-12 md:pb-16 md:pt-20">
        {content?.eyebrow && <p className="text-eyebrow text-brand-ink">{content.eyebrow}</p>}
        <h1 className="text-display mt-4 max-w-5xl text-balance">{content?.heading || page?.title || "Contact"}</h1>
        {content?.intro && <p className="text-lead mt-6 max-w-2xl text-ink-muted">{content.intro}</p>}
      </header>

      <section className="container-site grid gap-16 pb-24 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-7">
          <h2 className="text-title mb-8">{content?.formHeading || "Send an enquiry"}</h2>
          <Suspense fallback={<FormSkeleton />}>
            <ContactFormWithProject
              searchParams={searchParams}
              projects={projects.map((p) => ({ slug: p.slug, title: p.title }))}
              successMessage={content?.successMessage}
            />
          </Suspense>
        </div>

        <aside className="lg:col-span-5">
          {/* Same heading style and spacing as the form, so both columns start on one line. */}
          <h2 className="text-title mb-8">Contact details</h2>
          <div className="space-y-10">
            {content?.image && (
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
                <MediaImage path={content.image.path} alt={content.image.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" />
              </div>
            )}

            <ul className="divide-y divide-line border-y border-line">
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className="flex items-start gap-4 py-5 hover:opacity-70">
                    <Mail className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden />
                    <span>
                      <span className="block text-sm text-ink-muted">Email</span>
                      <span className="font-medium">{contact.email}</span>
                    </span>
                  </a>
                </li>
              )}
              {contact.phone && (
                <li>
                  <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-start gap-4 py-5 hover:opacity-70">
                    <Phone className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden />
                    <span>
                      <span className="block text-sm text-ink-muted">Phone</span>
                      <span className="font-medium">{contact.phone}</span>
                    </span>
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-4 py-5">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden />
                  <span>
                    <span className="block text-sm text-ink-muted">Address</span>
                    <address className="whitespace-pre-line font-medium not-italic">{contact.address}</address>
                    {contact.mapUrl && (
                      <a
                        href={contact.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm underline underline-offset-4"
                      >
                        Open in maps
                      </a>
                    )}
                  </span>
                </li>
              )}
              {contact.hours && (
                <li className="flex items-start gap-4 py-5">
                  <Clock className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden />
                  <span>
                    <span className="block text-sm text-ink-muted">Hours</span>
                    <span className="font-medium">{contact.hours}</span>
                  </span>
                </li>
              )}
            </ul>

            <WhatsAppButton
              phone={contact.whatsapp}
              message={contact.whatsappMessage || undefined}
              variant="solid"
              className="w-full sm:w-auto"
            />

            {social.links.length > 0 && (
              <div>
                <p className="text-eyebrow text-ink-muted">Follow</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {social.links.map((link) => (
                    <li key={`${link.platform}-${link.url}`}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-ink"
                      >
                        <SocialIcon platform={link.platform} className="size-4" />
                        {SOCIAL_LABELS[link.platform]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </section>
    </>
  );
}
