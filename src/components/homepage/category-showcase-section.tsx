import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Carousel } from "@/components/shared/carousel";
import { MediaImage } from "@/components/shared/media-image";
import { SectionHeading } from "@/components/shared/text-blocks";
import type { HomepageContent, HomepageSettings } from "@/lib/validations/sections";
import type { Category } from "@/types/content";
import { cn } from "@/lib/utils";

type Props = {
  content: HomepageContent<"category_showcase">;
  settings: HomepageSettings<"category_showcase">;
  categories: Category[];
};

function CategoryTile({ category, className, sizes }: { category: Category; className?: string; sizes: string }) {
  return (
    <Link
      href={`/projects?category=${encodeURIComponent(category.slug)}`}
      className={cn("group relative block overflow-hidden bg-ink text-white", className)}
    >
      <MediaImage
        path={category.coverImagePath}
        alt={category.name}
        fill
        sizes={sizes}
        placeholderLabel={category.name}
        className="opacity-90 transition-transform duration-[1200ms] ease-(--ease-out) group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-7">
        <div>
          <h3 className="text-title">{category.name}</h3>
          <p className="mt-1 text-sm text-white/75">
            {category.projectCount} {category.projectCount === 1 ? "project" : "projects"}
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink transition-transform duration-300 group-hover:rotate-45">
          <ArrowUpRight className="size-5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function CategoryShowcaseSection({ content, settings, categories }: Props) {
  const items = categories.slice(0, settings.limit);
  if (items.length === 0) return null;

  const heading = (
    <SectionHeading eyebrow={content.eyebrow} heading={content.heading} description={content.description} />
  );

  if (settings.layout === "carousel" && items.length > 2) {
    return (
      <div className="section-y bg-surface-muted">
        <Carousel label={content.heading || "Applications"} header={heading} slideClassName="basis-[78%] sm:basis-[44%] lg:basis-[30%]">
          {items.map((category) => (
            <CategoryTile
              key={category.id}
              category={category}
              className="aspect-[3/4]"
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 44vw, 78vw"
            />
          ))}
        </Carousel>
      </div>
    );
  }

  // Editorial grid: the first tile is a 2×2 feature; spans are computed so any
  // number of categories fills complete rows (no holes).
  const n = items.length;
  const spans = (i: number) => {
    const classes: string[] = [];
    // Small screens: two columns.
    if ((n >= 3 && i === 0) || n === 1 || (i === n - 1 && n >= 3 && (n - 1) % 2 === 1)) classes.push("sm:col-span-2");
    // Large screens: four columns.
    if (n === 1) classes.push("lg:col-span-4");
    else if (n === 2) classes.push("lg:col-span-2");
    else if (i === 0) classes.push("lg:col-span-2 lg:row-span-2");
    else {
      const r = n - 1;
      const pos = i - 1; // index among the remaining tiles
      if (r === 1) classes.push("lg:col-span-2 lg:row-span-2");
      else if (r === 2) classes.push("lg:col-span-2");
      else if (r === 3 && pos === 2) classes.push("lg:col-span-2");
      else if (r > 4 && pos >= 4) {
        const leftover = (r - 4) % 4;
        const firstOfLastRow = r - (leftover || 4);
        if (leftover === 1 && pos === r - 1) classes.push("lg:col-span-4");
        else if (leftover === 2 && pos >= firstOfLastRow) classes.push("lg:col-span-2");
        else if (leftover === 3 && pos === r - 1) classes.push("lg:col-span-2");
      }
    }
    return classes.join(" ");
  };

  return (
    <section className="section-y">
      <div className="container-site">
        <SectionHeading
          eyebrow={content.eyebrow}
          heading={content.heading}
          description={content.description}
          className="mb-10 md:mb-14"
        />
        <div className="grid auto-rows-[minmax(18rem,1fr)] gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 lg:auto-rows-[minmax(20rem,26vw)]">
          {items.map((category, i) => (
            <CategoryTile
              key={category.id}
              category={category}
              sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
              className={spans(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
