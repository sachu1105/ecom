import { Suspense } from "react";
import Link from "next/link";
import { BrandStyle } from "@/components/layout/brand-style";
import { HomepageSections } from "@/components/homepage/section-renderer";
import { requireAdmin } from "@/lib/auth/dal";
import { getHomepagePreview } from "@/lib/content/admin-queries";
import { getActiveCategories, getFeaturedProjects, getSiteSettings } from "@/lib/content/queries";

export const metadata = { title: "Homepage preview" };

async function Preview() {
  await requireAdmin();
  const [sections, featuredProjects, categories, settings] = await Promise.all([
    getHomepagePreview(),
    getFeaturedProjects(24),
    getActiveCategories(),
    getSiteSettings(),
  ]);
  const visible = sections.filter((s) => s.isEnabled);
  const hidden = sections.length - visible.length;
  const drafts = sections.filter((s) => s.hasDraft).length;

  return (
    <>
      <BrandStyle accent={settings.brand.accentColor} />
      <div className="sticky top-0 z-60 flex flex-wrap items-center justify-between gap-3 bg-amber-300 px-4 py-2 text-sm text-ink">
        <p>
          <strong>Preview</strong>: {drafts} unpublished change{drafts === 1 ? "" : "s"} applied
          {hidden > 0 && `, ${hidden} hidden section${hidden === 1 ? "" : "s"} not shown`}. Visitors still see the
          published version.
        </p>
        <Link href="/admin/homepage" className="rounded-full bg-ink px-4 py-1.5 text-white">
          Back to editor
        </Link>
      </div>
      {visible.length === 0 ? (
        <p className="p-20 text-center text-ink-muted">No visible sections yet.</p>
      ) : (
        <HomepageSections
          sections={visible}
          featuredProjects={featuredProjects}
          categories={categories}
          settings={settings}
        />
      )}
    </>
  );
}

export default function HomepagePreviewPage() {
  return (
    <Suspense fallback={<div className="h-svh animate-pulse bg-surface-muted" />}>
      <Preview />
    </Suspense>
  );
}
