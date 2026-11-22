import { Carousel } from "@/components/shared/carousel";
import { CtaLink } from "@/components/shared/cta-link";
import { SectionHeading } from "@/components/shared/text-blocks";
import { ProjectCard } from "@/components/projects/project-card";
import type { HomepageContent, HomepageSettings } from "@/lib/validations/sections";
import type { ProjectSummary } from "@/types/content";
import { cn } from "@/lib/utils";

type Props = {
  content: HomepageContent<"featured_projects">;
  settings: HomepageSettings<"featured_projects">;
  projects: ProjectSummary[];
};

export function FeaturedProjectsSection({ content, settings, projects }: Props) {
  const items = projects.slice(0, settings.limit);
  if (items.length === 0) return null;
  const sectionClass = cn("section-y", settings.background === "muted" && "bg-surface-muted");

  const action = content.cta.label ? (
    <CtaLink href={content.cta.href} variant="text">
      {content.cta.label}
    </CtaLink>
  ) : null;

  const heading = (
    <SectionHeading eyebrow={content.eyebrow} heading={content.heading} description={content.description} />
  );

  if (settings.layout === "carousel" && items.length > 2) {
    return (
      <div className={sectionClass}>
        <Carousel
          label={content.heading || "Featured projects"}
          header={heading}
          slideClassName="basis-[84%] sm:basis-[48%] lg:basis-[38%] xl:basis-[32%]"
        >
          {items.map((project) => (
            <ProjectCard key={project.id} project={project} aspect="portrait" />
          ))}
        </Carousel>
        {action && <div className="container-site mt-10">{action}</div>}
      </div>
    );
  }

  return (
    <section className={sectionClass}>
      <div className="container-site">
        <SectionHeading
          eyebrow={content.eyebrow}
          heading={content.heading}
          description={content.description}
          action={action}
          className="mb-10 md:mb-14"
        />
        <div className="grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              aspect={i === 0 && items.length > 3 ? "portrait" : "portrait"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
