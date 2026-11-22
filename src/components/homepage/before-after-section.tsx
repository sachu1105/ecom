import { BeforeAfter } from "@/components/shared/before-after";
import { SectionHeading } from "@/components/shared/text-blocks";
import type { HomepageContent, HomepageSettings } from "@/lib/validations/sections";
import { cn } from "@/lib/utils";

export function BeforeAfterSection({
  content,
  settings,
}: {
  content: HomepageContent<"before_after">;
  settings: HomepageSettings<"before_after">;
}) {
  if (!content.before?.path || !content.after?.path) return null;
  return (
    <section className={cn("section-y", settings.background === "muted" && "bg-surface-muted")}>
      <div className="container-site grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow={content.eyebrow} heading={content.heading} description={content.body} />
          <p className="mt-6 hidden text-sm text-ink-muted lg:block">Drag the handle to compare.</p>
        </div>
        <div className="lg:col-span-8">
          <BeforeAfter
            before={content.before}
            after={content.after}
            beforeLabel={content.beforeLabel}
            afterLabel={content.afterLabel}
            sizes="(min-width: 1024px) 66vw, 100vw"
          />
        </div>
      </div>
    </section>
  );
}
