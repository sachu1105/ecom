import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MediaImage } from "@/components/shared/media-image";
import type { ProjectSummary } from "@/types/content";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: ProjectSummary;
  sizes?: string;
  aspect?: "portrait" | "landscape" | "square" | "tall";
  showDescription?: boolean;
  showFeatured?: boolean;
  className?: string;
  eager?: boolean;
};

const aspects = {
  portrait: "aspect-[4/5]",
  landscape: "aspect-[4/3]",
  square: "aspect-square",
  tall: "aspect-[3/4]",
};

/** Image-first project card. The photograph dominates; text stays quiet. */
export function ProjectCard({
  project,
  sizes = "(min-width: 1280px) 31vw, (min-width: 640px) 46vw, 90vw",
  aspect = "portrait",
  showDescription = true,
  showFeatured = false,
  className,
  eager = false,
}: ProjectCardProps) {
  return (
    <article className={cn("group relative", className)}>
      <Link href={`/projects/${project.slug}`} className="block focus-visible:outline-none">
        <div className={cn("relative overflow-hidden bg-surface-muted", aspects[aspect])}>
          <MediaImage
            path={project.coverImagePath}
            alt={project.coverImageAlt || project.title}
            fill
            sizes={sizes}
            loading={eager ? "eager" : "lazy"}
            placeholderLabel={project.category?.name}
            className="transition-transform duration-[1200ms] ease-(--ease-out) group-hover:scale-[1.035]"
          />
          {showFeatured && project.isFeatured && (
            <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-eyebrow text-ink">
              Featured
            </span>
          )}
          <span className="pointer-events-none absolute inset-0 ring-inset ring-ink transition group-focus-visible:ring-2" />
        </div>

        <div className="mt-4 flex items-start justify-between gap-6">
          <div className="min-w-0 space-y-1">
            <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-tight">{project.title}</h3>
            {(project.category || project.location) && (
              <p className="text-[0.9375rem] text-ink-muted">
                {[project.category?.name, project.location].filter(Boolean).join(" · ")}
              </p>
            )}
            {showDescription && project.shortDescription && (
              <p className="line-clamp-2 pt-1 text-[0.9375rem] text-ink-muted">{project.shortDescription}</p>
            )}
          </div>
          <ArrowRight
            aria-hidden
            className="mt-1 size-5 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
          />
        </div>
      </Link>
    </article>
  );
}
