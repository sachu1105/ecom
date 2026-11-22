"use server";

import { z } from "zod";
import { adminContext, expire } from "./shared";
import { actionError, dbErrorMessage, type ActionResult } from "./types";
import { fieldErrors, uuidSchema } from "@/lib/validations/common";
import {
  projectFormSchema,
  projectMediaListSchema,
  reorderSchema,
  type ProjectFormInput,
  type ProjectMediaItem,
} from "@/lib/validations/project";
import {
  parseProjectSectionContent,
  projectSectionInputSchema,
  type ProjectSectionInput,
} from "@/lib/validations/sections";
import { CACHE_TAGS } from "@/lib/content/tags";

const T = CACHE_TAGS;

export async function createProjectAction(input: ProjectFormInput): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await adminContext();
  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.", fieldErrors(parsed.error));

  const { data: last } = await supabase
    .from("projects")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, display_order: (last?.display_order ?? -1) + 1 })
    .select("id")
    .single();
  if (error) return actionError(dbErrorMessage(error));

  expire(T.projects, T.categories);
  return { ok: true, data: { id: data.id }, message: "Project created." };
}

export async function updateProjectAction(id: string, input: ProjectFormInput): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid project.");
  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.", fieldErrors(parsed.error));

  const { error } = await supabase.from("projects").update(parsed.data).eq("id", id);
  if (error) return actionError(dbErrorMessage(error));

  expire(T.projects, T.categories);
  return { ok: true, message: "Project saved." };
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid project.");
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return actionError(dbErrorMessage(error));
  expire(T.projects, T.categories);
  return { ok: true, message: "Project deleted." };
}

export async function setProjectStatusAction(id: string, status: "draft" | "published"): Promise<ActionResult> {
  const { supabase } = await adminContext();
  const parsed = z.object({ id: uuidSchema, status: z.enum(["draft", "published"]) }).safeParse({ id, status });
  if (!parsed.success) return actionError("Invalid request.");
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) return actionError(dbErrorMessage(error));
  expire(T.projects, T.categories);
  return { ok: true, message: status === "published" ? "Project published." : "Project moved to drafts." };
}

export async function setProjectFeaturedAction(id: string, featured: boolean): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid project.");
  const { error } = await supabase.from("projects").update({ is_featured: featured === true }).eq("id", id);
  if (error) return actionError(dbErrorMessage(error));
  expire(T.projects);
  return { ok: true, message: featured ? "Project featured." : "Project unfeatured." };
}

export async function reorderProjectsAction(ids: string[]): Promise<ActionResult> {
  const { supabase } = await adminContext();
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return actionError("Invalid order.");
  const results = await Promise.all(
    parsed.data.map((id, index) => supabase.from("projects").update({ display_order: index }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return actionError(dbErrorMessage(failed.error));
  expire(T.projects);
  return { ok: true };
}

/** Replaces a project's installation gallery with the submitted ordered list. */
export async function saveProjectMediaAction(projectId: string, items: ProjectMediaItem[]): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(projectId).success) return actionError("Invalid project.");
  const parsed = projectMediaListSchema.safeParse(items);
  if (!parsed.success) return actionError("Some gallery items are invalid.", fieldErrors(parsed.error));

  const rows = parsed.data.map((item, index) => ({
    ...(item.id ? { id: item.id } : {}),
    project_id: projectId,
    media_type: item.media_type,
    storage_path: item.storage_path,
    alt_text: item.alt_text || null,
    caption: item.caption || null,
    display_order: index,
  }));

  const existing = await supabase.from("project_media").select("id").eq("project_id", projectId);
  if (existing.error) return actionError(dbErrorMessage(existing.error));

  const keep = new Set(rows.map((r) => r.id).filter(Boolean));
  const remove = (existing.data ?? []).map((r) => r.id).filter((id) => !keep.has(id));
  if (remove.length > 0) {
    const { error } = await supabase.from("project_media").delete().in("id", remove);
    if (error) return actionError(dbErrorMessage(error));
  }

  const updates = rows.filter((r) => r.id);
  const inserts = rows.filter((r) => !r.id);
  for (const row of updates) {
    const { id, ...rest } = row as typeof row & { id: string };
    const { error } = await supabase.from("project_media").update(rest).eq("id", id).eq("project_id", projectId);
    if (error) return actionError(dbErrorMessage(error));
  }
  if (inserts.length > 0) {
    const { error } = await supabase.from("project_media").insert(inserts);
    if (error) return actionError(dbErrorMessage(error));
  }

  expire(T.projects);
  return { ok: true, message: "Gallery saved." };
}

/** Validates and replaces a project's flexible content sections. */
export async function saveProjectSectionsAction(
  projectId: string,
  sections: ProjectSectionInput[],
): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(projectId).success) return actionError("Invalid project.");
  const list = z.array(projectSectionInputSchema).max(60).safeParse(sections);
  if (!list.success) return actionError("Sections are invalid.");

  const errors: Record<string, string> = {};
  const rows = list.data.map((section, index) => {
    const content = parseProjectSectionContent(section.section_type, section.content);
    if (!content.success) {
      const first = content.error.issues[0];
      errors[`sections.${index}`] = `${first.path.join(".") || "content"}: ${first.message}`;
    }
    return {
      ...(section.id ? { id: section.id } : {}),
      project_id: projectId,
      section_type: section.section_type,
      heading: section.heading || null,
      content: (content.success ? content.data : {}) as Record<string, unknown>,
      display_order: index,
    };
  });
  if (Object.keys(errors).length > 0) return actionError("Some sections need attention.", errors);

  const existing = await supabase.from("project_sections").select("id").eq("project_id", projectId);
  if (existing.error) return actionError(dbErrorMessage(existing.error));
  const keep = new Set(rows.map((r) => r.id).filter(Boolean));
  const remove = (existing.data ?? []).map((r) => r.id).filter((id) => !keep.has(id));
  if (remove.length > 0) {
    const { error } = await supabase.from("project_sections").delete().in("id", remove);
    if (error) return actionError(dbErrorMessage(error));
  }

  for (const row of rows.filter((r) => r.id)) {
    const { id, ...rest } = row as typeof row & { id: string };
    const { error } = await supabase
      .from("project_sections")
      .update({ ...rest, content: rest.content as never })
      .eq("id", id)
      .eq("project_id", projectId);
    if (error) return actionError(dbErrorMessage(error));
  }
  const inserts = rows.filter((r) => !r.id).map((r) => ({ ...r, content: r.content as never }));
  if (inserts.length > 0) {
    const { error } = await supabase.from("project_sections").insert(inserts);
    if (error) return actionError(dbErrorMessage(error));
  }

  expire(T.projects);
  return { ok: true, message: "Sections saved." };
}
