import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/content/queries";
import { getSiteUrl } from "@/lib/utils/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const base = getSiteUrl(settings.seo.siteUrl);
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
