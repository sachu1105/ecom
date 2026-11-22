import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Finds where media paths are referenced across all content (columns and
 * JSONB). Used to flag unused media and to block deleting media in use.
 */
export async function findMediaUsage(supabase: SupabaseClient<Database>) {
  const [projects, categories, projectMedia, sections, homepage, drafts, pages, settings] = await Promise.all([
    supabase.from("projects").select("title, cover_image_path"),
    supabase.from("project_categories").select("name, cover_image_path"),
    supabase.from("project_media").select("storage_path, project_id"),
    supabase.from("project_sections").select("project_id, content"),
    supabase.from("homepage_sections").select("section_type, content, settings"),
    supabase.from("homepage_section_drafts").select("content, settings"),
    supabase.from("pages").select("page_key, content"),
    supabase.from("site_settings").select("key, value"),
  ]);

  const usage = new Map<string, Set<string>>();
  const add = (path: string | null | undefined, label: string) => {
    if (!path) return;
    if (!usage.has(path)) usage.set(path, new Set());
    usage.get(path)!.add(label);
  };

  for (const p of projects.data ?? []) add(p.cover_image_path, `Project cover: ${p.title}`);
  for (const c of categories.data ?? []) add(c.cover_image_path, `Category: ${c.name}`);
  for (const m of projectMedia.data ?? []) add(m.storage_path, "Project gallery");

  // JSONB: collect every {"path": "..."} value.
  const scan = (value: unknown, label: string) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const v of value) scan(v, label);
      return;
    }
    for (const [k, v] of Object.entries(value)) {
      if (k === "path" && typeof v === "string") add(v, label);
      else scan(v, label);
    }
  };
  for (const s of sections.data ?? []) scan(s.content, "Project section");
  for (const h of homepage.data ?? []) {
    scan(h.content, `Homepage: ${h.section_type}`);
    scan(h.settings, `Homepage: ${h.section_type}`);
  }
  for (const d of drafts.data ?? []) scan(d.content, "Homepage draft");
  for (const p of pages.data ?? []) scan(p.content, `Page: ${p.page_key}`);
  for (const s of settings.data ?? []) scan(s.value, `Settings: ${s.key}`);

  return new Map([...usage].map(([k, v]) => [k, [...v]]));
}
