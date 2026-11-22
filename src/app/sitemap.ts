import type { MetadataRoute } from "next";
import { getActiveCategories, getPublishedProjects, getSiteSettings } from "@/lib/content/queries";
import { getSiteUrl } from "@/lib/utils/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, projects, categories] = await Promise.all([
    getSiteSettings(),
    getPublishedProjects(),
    getActiveCategories(),
  ]);
  const base = getSiteUrl(settings.seo.siteUrl);

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/projects`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
    ...categories
      .filter((c) => c.projectCount > 0)
      .map((c) => ({
        url: `${base}/projects?category=${encodeURIComponent(c.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: p.publishedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
