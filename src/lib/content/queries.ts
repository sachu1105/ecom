import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { CACHE_TAGS } from "./tags";
import {
  DEFAULT_SITE_SETTINGS,
  PRIVATE_SETTING_KEYS,
  siteSettingSchemas,
  type SiteSettingKey,
  type SiteSettings,
} from "@/lib/validations/settings";
import {
  HOMEPAGE_SECTION_TYPES,
  PROJECT_SECTION_TYPES,
  parseHomepageSection,
  parseProjectSectionContent,
  type HomepageSection,
  type HomepageSectionType,
  type ProjectSection,
  type ProjectSectionType,
} from "@/lib/validations/sections";
import { pageContentSchemas, type PageData, type PageKey } from "@/lib/validations/pages";
import type { CategoryRow, ProjectRow } from "@/types/database";
import type { Category, ProjectDetail, ProjectSummary } from "@/types/content";

/*
 * Public, cached readers. Every function here:
 *   - uses the cookie-less anon client (RLS: published/active/enabled only)
 *   - is wrapped in 'use cache' with a tag that admin mutations expire
 *   - degrades to empty content when Supabase is not configured yet
 */

const SUMMARY_COLUMNS =
  "id, title, slug, short_description, cover_image_path, cover_image_alt, is_featured, display_order, published_at, completion_date, location, category_id";

type SummaryRow = Pick<
  ProjectRow,
  | "id"
  | "title"
  | "slug"
  | "short_description"
  | "cover_image_path"
  | "cover_image_alt"
  | "is_featured"
  | "display_order"
  | "published_at"
  | "completion_date"
  | "location"
  | "category_id"
>;

function fail(what: string, message: string): never {
  throw new Error(`[content] Failed to load ${what}: ${message}`);
}

/* ------------------------------------------------------------------------ */
/* Site settings                                                            */
/* ------------------------------------------------------------------------ */

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);

  const settings: SiteSettings = structuredClone(DEFAULT_SITE_SETTINGS);

  if (isSupabaseConfigured()) {
    const { data, error } = await getPublicSupabase().from("site_settings").select("key, value");
    if (error) fail("site settings", error.message);

    for (const row of data ?? []) {
      if (!(row.key in siteSettingSchemas)) continue;
      const key = row.key as SiteSettingKey;
      // RLS already hides private rows; never let one reach public pages anyway.
      if (PRIVATE_SETTING_KEYS.includes(key)) continue;
      const parsed = siteSettingSchemas[key].safeParse(row.value);
      if (parsed.success) {
        (settings as Record<SiteSettingKey, unknown>)[key] = parsed.data;
      } else {
        console.warn(`[content] Ignoring invalid site setting "${key}"`);
      }
    }
  }

  // Deployment-level fallback for the WhatsApp number.
  if (!settings.contact.whatsapp && process.env.WHATSAPP_PHONE) {
    settings.contact.whatsapp = process.env.WHATSAPP_PHONE.replace(/[^\d]/g, "");
  }

  return settings;
}

/* ------------------------------------------------------------------------ */
/* Categories and projects                                                  */
/* ------------------------------------------------------------------------ */

async function fetchActiveCategoryRows(): Promise<CategoryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getPublicSupabase()
    .from("project_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) fail("categories", error.message);
  return data ?? [];
}

async function fetchPublishedSummaryRows(): Promise<SummaryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getPublicSupabase()
    .from("projects")
    .select(SUMMARY_COLUMNS)
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("published_at", { ascending: false });
  if (error) fail("projects", error.message);
  return (data ?? []) as SummaryRow[];
}

function toSummary(row: SummaryRow, categories: Map<string, CategoryRow>): ProjectSummary {
  const category = row.category_id ? categories.get(row.category_id) : undefined;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.short_description,
    coverImagePath: row.cover_image_path,
    coverImageAlt: row.cover_image_alt,
    isFeatured: row.is_featured,
    displayOrder: row.display_order,
    publishedAt: row.published_at,
    completionDate: row.completion_date,
    location: row.location,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
  };
}

export async function getActiveCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.projects);

  const [categories, projects] = await Promise.all([
    fetchActiveCategoryRows(),
    fetchPublishedSummaryRows(),
  ]);

  const counts = new Map<string, number>();
  for (const p of projects) {
    if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    coverImagePath: c.cover_image_path,
    displayOrder: c.display_order,
    projectCount: counts.get(c.id) ?? 0,
  }));
}

export async function getPublishedProjects(): Promise<ProjectSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.projects, CACHE_TAGS.categories);

  const [rows, categories] = await Promise.all([
    fetchPublishedSummaryRows(),
    fetchActiveCategoryRows(),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  return rows.map((row) => toSummary(row, byId));
}

export async function getFeaturedProjects(limit = 8): Promise<ProjectSummary[]> {
  const projects = await getPublishedProjects();
  const featured = projects.filter((p) => p.isFeatured);
  return (featured.length > 0 ? featured : projects).slice(0, limit);
}

export async function getPublishedSlugs(): Promise<string[]> {
  const projects = await getPublishedProjects();
  return projects.map((p) => p.slug);
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.projects, CACHE_TAGS.categories);

  if (!isSupabaseConfigured() || !/^[a-z0-9-]{1,160}$/.test(slug)) return null;

  const supabase = getPublicSupabase();
  const { data: row, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) fail(`project "${slug}"`, error.message);
  if (!row) return null;

  const [media, sections, categories] = await Promise.all([
    supabase
      .from("project_media")
      .select("*")
      .eq("project_id", row.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("project_sections")
      .select("*")
      .eq("project_id", row.id)
      .order("display_order", { ascending: true }),
    fetchActiveCategoryRows(),
  ]);
  if (media.error) fail("project media", media.error.message);
  if (sections.error) fail("project sections", sections.error.message);

  const parsedSections: ProjectSection[] = [];
  for (const s of sections.data ?? []) {
    if (!(PROJECT_SECTION_TYPES as readonly string[]).includes(s.section_type)) continue;
    const type = s.section_type as ProjectSectionType;
    const parsed = parseProjectSectionContent(type, s.content);
    if (!parsed.success) {
      console.warn(`[content] Skipping invalid ${type} section ${s.id}`);
      continue;
    }
    parsedSections.push({ id: s.id, type, heading: s.heading, content: parsed.data } as ProjectSection);
  }

  const summary = toSummary(row, new Map(categories.map((c) => [c.id, c])));

  return {
    ...summary,
    description: row.description,
    applicationType: row.application_type,
    materialUsed: row.material_used,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
    media: (media.data ?? []).map((m) => ({
      id: m.id,
      type: m.media_type,
      path: m.storage_path,
      alt: m.alt_text,
      caption: m.caption,
    })),
    sections: parsedSections,
  };
}

export async function getRelatedProjects(project: ProjectSummary, limit = 3) {
  const all = await getPublishedProjects();
  const others = all.filter((p) => p.id !== project.id);
  const sameCategory = others.filter(
    (p) => project.category && p.category?.id === project.category.id,
  );
  const rest = others.filter((p) => !sameCategory.includes(p));
  return [...sameCategory, ...rest].slice(0, limit);
}

/* ------------------------------------------------------------------------ */
/* Homepage                                                                 */
/* ------------------------------------------------------------------------ */

export async function getHomepageSections(): Promise<HomepageSection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.homepage);

  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getPublicSupabase()
    .from("homepage_sections")
    .select("id, section_type, title, content, settings, is_enabled")
    .eq("is_enabled", true)
    .order("display_order", { ascending: true });
  if (error) fail("homepage sections", error.message);

  return parseHomepageRows(data ?? []);
}

/** Shared by the public homepage and the admin preview. */
export function parseHomepageRows(
  rows: {
    id: string;
    section_type: string;
    title: string | null;
    content: unknown;
    settings: unknown;
    is_enabled: boolean;
    has_draft?: boolean;
  }[],
): HomepageSection[] {
  const sections: HomepageSection[] = [];
  for (const row of rows) {
    if (!(HOMEPAGE_SECTION_TYPES as readonly string[]).includes(row.section_type)) continue;
    const type = row.section_type as HomepageSectionType;
    const { content, settings } = parseHomepageSection(type, row.content, row.settings);
    if (!content.success || !settings.success) {
      console.warn(`[content] Skipping invalid homepage section ${row.id} (${type})`);
      continue;
    }
    sections.push({
      id: row.id,
      type,
      title: row.title,
      isEnabled: row.is_enabled,
      hasDraft: row.has_draft,
      content: content.data,
      settings: settings.data,
    } as HomepageSection);
  }
  return sections;
}

/* ------------------------------------------------------------------------ */
/* Pages                                                                    */
/* ------------------------------------------------------------------------ */

export async function getPage<K extends PageKey>(key: K): Promise<PageData<K> | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.pages);

  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getPublicSupabase()
    .from("pages")
    .select("*")
    .eq("page_key", key)
    .eq("is_published", true)
    .maybeSingle();
  if (error) fail(`page "${key}"`, error.message);
  if (!data) return null;

  const parsed = pageContentSchemas[key].safeParse(data.content);
  if (!parsed.success) {
    console.warn(`[content] Page "${key}" has invalid content`);
    return null;
  }

  return {
    key,
    title: data.title,
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
    isPublished: data.is_published,
    content: parsed.data as PageData<K>["content"],
  };
}
