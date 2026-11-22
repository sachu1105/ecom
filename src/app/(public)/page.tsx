import { HomepageSections } from "@/components/homepage/section-renderer";
import { ProjectCard } from "@/components/projects/project-card";
import { CtaLink } from "@/components/shared/cta-link";
import {
  getActiveCategories,
  getFeaturedProjects,
  getHomepageSections,
  getSiteSettings,
} from "@/lib/content/queries";

export default async function HomePage() {
  const [sections, featuredProjects, categories, settings] = await Promise.all([
    getHomepageSections(),
    getFeaturedProjects(24),
    getActiveCategories(),
    getSiteSettings(),
  ]);

  if (sections.length === 0) {
    // Nothing configured yet: a quiet, data-driven fallback instead of a blank page.
    return (
      <>
        <section className="container-site section-y">
          <p className="text-eyebrow text-brand-ink">{settings.brand.tagline}</p>
          <h1 className="text-display-xl mt-6 max-w-5xl text-balance">{settings.brand.name}</h1>
          <div className="mt-10">
            <CtaLink href="/projects" variant="solid" arrow>
              {settings.navigation.projectsLabel || "Projects"}
            </CtaLink>
          </div>
        </section>
        {featuredProjects.length > 0 && (
          <section className="container-site pb-24">
            <div className="grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.slice(0, 6).map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

  return (
    <HomepageSections
      sections={sections}
      featuredProjects={featuredProjects}
      categories={categories}
      settings={settings}
    />
  );
}
