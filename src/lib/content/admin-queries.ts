import "server-only";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseHomepageRows } from "./queries";
import { uuidSchema } from "@/lib/validations/common";
import { pageContentSchemas, PAGE_KEYS, type PageKey } from "@/lib/validations/pages";
import { DEFAULT_SITE_SETTINGS, siteSettingSchemas, type SiteSettingKey, type SiteSettings } from "@/lib/validations/settings";
import { homepageSectionSchemas, type HomepageSectionType } from "@/lib/validations/sections";

/*
 * Admin readers. Never cached; each re-verifies the admin and reads through
 * the cookie-bound client, so RLS applies a second, independent check.
 */

async function db() {
  await requireAdmin();
  return createSupabaseServerClient();
}

export async function getDashboardStats() {
  const supabase = await db();
  const count = (table: "projects" | "project_categories" | "inquiries", filter?: [string, string]) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    return q;
  };
  const [total, published, drafts, categories, inquiries, unread, recent] = await Promise.all([
    count("projects"),
    count("projects", ["status", "published"]),
    count("projects", ["status", "draft"]),
    count("project_categories"),
    count("inquiries"),
    count("inquiries", ["status", "new"]),
    supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(6),
  ]);
  return {
    totalProjects: total.count ?? 0,
    publishedProjects: published.count ?? 0,
    draftProjects: drafts.count ?? 0,
    totalCategories: categories.count ?? 0,
    totalInquiries: inquiries.count ?? 0,
    unreadInquiries: unread.count ?? 0,
    recentInquiries: recent.data ?? [],
  };
}

export async function getAdminProjects() {
  const supabase = await db();
  const [projects, categories] = await Promise.all([
    supabase.from("projects").select("*").order("display_order").order("created_at", { ascending: false }),
    supabase.from("project_categories").select("id, name").order("display_order"),
  ]);
  const names = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  return (projects.data ?? []).map((p) => ({ ...p, category_name: p.category_id ? names.get(p.category_id) ?? null : null }));
}

export async function getAdminCategories() {
  const supabase = await db();
  const [categories, projects] = await Promise.all([
    supabase.from("project_categories").select("*").order("display_order").order("name"),
    supabase.from("projects").select("category_id"),
  ]);
  const counts = new Map<string, number>();
  for (const p of projects.data ?? []) if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  return (categories.data ?? []).map((c) => ({ ...c, project_count: counts.get(c.id) ?? 0 }));
}

export async function getAdminProject(id: string) {
  if (!uuidSchema.safeParse(id).success) notFound();
  const supabase = await db();
  const [project, media, sections] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("project_media").select("*").eq("project_id", id).order("display_order"),
    supabase.from("project_sections").select("*").eq("project_id", id).order("display_order"),
  ]);
  if (!project.data) notFound();
  return { project: project.data, media: media.data ?? [], sections: sections.data ?? [] };
}

export async function getAdminHomepage() {
  const supabase = await db();
  const [sections, drafts] = await Promise.all([
    supabase.from("homepage_sections").select("*").order("display_order"),
    supabase.from("homepage_section_drafts").select("*"),
  ]);
  const draftMap = new Map((drafts.data ?? []).map((d) => [d.section_id, d]));
  return (sections.data ?? []).map((s) => {
    const type = s.section_type as HomepageSectionType;
    const schema = homepageSectionSchemas[type];
    const draft = draftMap.get(s.id);
    return {
      id: s.id,
      type,
      isEnabled: s.is_enabled,
      live: {
        title: s.title ?? "",
        content: (schema?.content.safeParse(s.content).data ?? {}) as Record<string, unknown>,
        settings: (schema?.settings.safeParse(s.settings).data ?? {}) as Record<string, unknown>,
      },
      draft: draft
        ? {
            title: draft.title ?? "",
            content: draft.content as Record<string, unknown>,
            settings: draft.settings as Record<string, unknown>,
            updatedAt: draft.updated_at,
          }
        : null,
      updatedAt: s.updated_at,
    };
  });
}

/** Homepage as it will look after publishing: live sections with drafts applied. */
export async function getHomepagePreview() {
  const sections = await getAdminHomepage();
  return parseHomepageRows(
    sections.map((s) => ({
      id: s.id,
      section_type: s.type,
      title: (s.draft ?? s.live).title,
      content: (s.draft ?? s.live).content,
      settings: (s.draft ?? s.live).settings,
      is_enabled: s.isEnabled,
      has_draft: !!s.draft,
    })),
  );
}

export async function getAdminPages() {
  const supabase = await db();
  const { data } = await supabase.from("pages").select("*");
  const byKey = new Map((data ?? []).map((p) => [p.page_key, p]));
  return PAGE_KEYS.map((key: PageKey) => {
    const row = byKey.get(key);
    return {
      key,
      meta: {
        title: row?.title ?? key.charAt(0).toUpperCase() + key.slice(1),
        seo_title: row?.seo_title ?? "",
        seo_description: row?.seo_description ?? "",
        is_published: row?.is_published ?? true,
      },
      content: (pageContentSchemas[key].safeParse(row?.content ?? {}).data ??
        pageContentSchemas[key].parse({})) as Record<string, unknown>,
    };
  });
}

export async function getAdminSettings(): Promise<SiteSettings> {
  const supabase = await db();
  const { data } = await supabase.from("site_settings").select("key, value");
  const settings = structuredClone(DEFAULT_SITE_SETTINGS);
  for (const row of data ?? []) {
    if (!(row.key in siteSettingSchemas)) continue;
    const key = row.key as SiteSettingKey;
    const parsed = siteSettingSchemas[key].safeParse(row.value);
    if (parsed.success) (settings as Record<string, unknown>)[key] = parsed.data;
  }
  return settings;
}

export async function getAdminInquiries(status: "all" | "new" | "read" | "archived") {
  const supabase = await db();
  let q = supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(500);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  return data ?? [];
}
