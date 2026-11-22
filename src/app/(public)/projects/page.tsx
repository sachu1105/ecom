import { Suspense } from "react";
import type { Metadata } from "next";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFilters } from "@/components/projects/project-filters";
import { buildProjectsHref, type ProjectQuery } from "@/lib/utils/projects-query";
import { ProjectGridSkeleton } from "@/components/projects/project-skeletons";
import { EmptyState } from "@/components/shared/empty-state";
import { CtaLink } from "@/components/shared/cta-link";
import { getActiveCategories, getPage, getPublishedProjects } from "@/lib/content/queries";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("projects");
  return {
    title: page?.seoTitle || page?.title || "Projects",
    description: page?.seoDescription || page?.content.intro || undefined,
    alternates: { canonical: "/projects" },
  };
}

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function normaliseQuery(raw: Record<string, string | string[] | undefined>): ProjectQuery {
  const category = first(raw.category).toLowerCase();
  return {
    category: /^[a-z0-9-]{1,120}$/.test(category) ? category : "",
    q: first(raw.q).trim().slice(0, 80),
    sort: first(raw.sort) === "newest" ? "newest" : "featured",
  };
}

async function ProjectResults({
  searchParams,
  emptyMessage,
}: {
  searchParams: PageProps<"/projects">["searchParams"];
  emptyMessage: string;
}) {
  const [raw, projects, categories] = await Promise.all([
    searchParams,
    getPublishedProjects(),
    getActiveCategories(),
  ]);
  const query = normaliseQuery(raw);
  const needle = query.q.toLowerCase();

  let results = projects.filter((p) => {
    if (query.category && p.category?.slug !== query.category) return false;
    if (!needle) return true;
    return [p.title, p.shortDescription, p.location, p.category?.name]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(needle));
  });

  if (query.sort === "newest") {
    const time = (p: (typeof results)[number]) =>
      new Date(p.completionDate ?? p.publishedAt ?? 0).getTime() || 0;
    results = [...results].sort((a, b) => time(b) - time(a));
  } else {
    results = [...results].sort(
      (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.displayOrder - b.displayOrder,
    );
  }

  const activeCategory = categories.find((c) => c.slug === query.category);

  return (
    <>
      <ProjectFilters
        categories={categories.filter((c) => c.projectCount > 0)}
        query={query}
        total={projects.length}
        resultCount={results.length}
      />
      <div className="container-site pb-24 pt-8 md:pt-10">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink tabular-nums">{results.length}</span>{" "}
            {results.length === 1 ? "project" : "projects"}
            {activeCategory && <> in {activeCategory.name}</>}
            {query.q && <> matching “{query.q}”</>}
          </p>
        </div>

        {activeCategory?.description && (
          <p className="text-lead mb-12 max-w-3xl text-ink-muted">{activeCategory.description}</p>
        )}

        {results.length === 0 ? (
          <EmptyState
            title={projects.length === 0 ? "Projects are on their way" : "No matching projects"}
            description={
              projects.length === 0
                ? emptyMessage || "Our latest installations will be published here soon."
                : "Try another application or clear your search."
            }
            action={
              projects.length > 0 ? (
                <CtaLink href={buildProjectsHref({})} variant="solid">
                  View all projects
                </CtaLink>
              ) : (
                <CtaLink href="/contact" variant="solid">
                  Talk to us
                </CtaLink>
              )
            }
          />
        ) : (
          <ul className="grid gap-x-4 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((project, i) => (
              <li key={project.id}>
                <ProjectCard project={project} showFeatured={query.sort === "featured"} eager={i < 3} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const page = await getPage("projects");
  const content = page?.content;

  return (
    <>
      <header className="container-site pb-10 pt-12 md:pb-14 md:pt-20">
        {content?.eyebrow && <p className="text-eyebrow text-brand-ink">{content.eyebrow}</p>}
        <h1 className="text-display mt-4 max-w-5xl text-balance">{content?.heading || page?.title || "Projects"}</h1>
        {content?.intro && <p className="text-lead mt-6 max-w-2xl text-ink-muted">{content.intro}</p>}
      </header>
      <Suspense fallback={<ProjectGridSkeleton />}>
        <ProjectResults searchParams={searchParams} emptyMessage={content?.emptyMessage ?? ""} />
      </Suspense>
    </>
  );
}
