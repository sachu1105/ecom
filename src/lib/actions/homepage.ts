"use server";

import { z } from "zod";
import { adminContext, expire } from "./shared";
import { actionError, dbErrorMessage, type ActionResult } from "./types";
import { uuidSchema } from "@/lib/validations/common";
import {
  HOMEPAGE_SECTION_TYPES,
  homepageSectionInputSchema,
  homepageSectionSchemas,
  type HomepageSectionType,
} from "@/lib/validations/sections";
import { reorderSchema } from "@/lib/validations/project";
import { CACHE_TAGS } from "@/lib/content/tags";

type SectionInput = z.input<typeof homepageSectionInputSchema>;

function validate(type: HomepageSectionType, input: SectionInput) {
  const base = homepageSectionInputSchema.safeParse(input);
  if (!base.success) return { ok: false as const, error: "Invalid section." };
  const schema = homepageSectionSchemas[type];
  const content = schema.content.safeParse(base.data.content);
  const settings = schema.settings.safeParse(base.data.settings);
  if (!content.success || !settings.success) {
    const issue = (content.success ? settings.error! : content.error).issues[0];
    return { ok: false as const, error: `${issue.path.join(".") || "content"}: ${issue.message}` };
  }
  return {
    ok: true as const,
    title: base.data.title || null,
    content: content.data as Record<string, unknown>,
    settings: settings.data as Record<string, unknown>,
  };
}

async function sectionType(supabase: Awaited<ReturnType<typeof adminContext>>["supabase"], id: string) {
  const { data } = await supabase.from("homepage_sections").select("section_type").eq("id", id).maybeSingle();
  return data && (HOMEPAGE_SECTION_TYPES as readonly string[]).includes(data.section_type)
    ? (data.section_type as HomepageSectionType)
    : null;
}

/** New sections start hidden so nothing goes live before it is ready. */
export async function addHomepageSectionAction(type: HomepageSectionType): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await adminContext();
  if (!z.enum(HOMEPAGE_SECTION_TYPES).safeParse(type).success) return actionError("Unknown section type.");
  const schema = homepageSectionSchemas[type];
  const { data: last } = await supabase
    .from("homepage_sections")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("homepage_sections")
    .insert({
      section_type: type,
      title: null,
      content: schema.content.parse({}) as never,
      settings: schema.settings.parse({}) as never,
      is_enabled: false,
      display_order: (last?.display_order ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error) return actionError(dbErrorMessage(error));
  return { ok: true, data: { id: data.id }, message: "Section added (hidden until you enable it)." };
}

/** Stores edits as a draft. The live homepage is unchanged until published. */
export async function saveHomepageDraftAction(id: string, input: SectionInput): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid section.");
  const type = await sectionType(supabase, id);
  if (!type) return actionError("Section not found.");
  const valid = validate(type, input);
  if (!valid.ok) return actionError(valid.error);

  const { error } = await supabase.from("homepage_section_drafts").upsert({
    section_id: id,
    title: valid.title,
    content: valid.content as never,
    settings: valid.settings as never,
  });
  if (error) return actionError(dbErrorMessage(error));
  return { ok: true, message: "Draft saved. Preview it, then publish when ready." };
}

/** Publishes the submitted values (or the stored draft) to the live section. */
export async function publishHomepageSectionAction(id: string, input?: SectionInput): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid section.");
  const type = await sectionType(supabase, id);
  if (!type) return actionError("Section not found.");

  let source: SectionInput | undefined = input;
  if (!source) {
    const { data: draft } = await supabase
      .from("homepage_section_drafts")
      .select("title, content, settings")
      .eq("section_id", id)
      .maybeSingle();
    if (!draft) return actionError("There is no draft to publish.");
    source = {
      title: draft.title ?? "",
      content: draft.content as Record<string, unknown>,
      settings: draft.settings as Record<string, unknown>,
    };
  }
  const valid = validate(type, source);
  if (!valid.ok) return actionError(valid.error);

  const { error } = await supabase
    .from("homepage_sections")
    .update({ title: valid.title, content: valid.content as never, settings: valid.settings as never })
    .eq("id", id);
  if (error) return actionError(dbErrorMessage(error));
  await supabase.from("homepage_section_drafts").delete().eq("section_id", id);

  expire(CACHE_TAGS.homepage);
  return { ok: true, message: "Section published." };
}

export async function publishAllHomepageDraftsAction(): Promise<ActionResult> {
  const { supabase } = await adminContext();
  const { data, error } = await supabase.from("homepage_section_drafts").select("section_id");
  if (error) return actionError(dbErrorMessage(error));
  for (const row of data ?? []) {
    const result = await publishHomepageSectionAction(row.section_id);
    if (!result.ok) return result;
  }
  expire(CACHE_TAGS.homepage);
  return { ok: true, message: data?.length ? "All drafts published." : "Nothing to publish." };
}

export async function discardHomepageDraftAction(id: string): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid section.");
  const { error } = await supabase.from("homepage_section_drafts").delete().eq("section_id", id);
  if (error) return actionError(dbErrorMessage(error));
  return { ok: true, message: "Draft discarded." };
}

export async function setHomepageSectionEnabledAction(id: string, enabled: boolean): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid section.");
  const { error } = await supabase.from("homepage_sections").update({ is_enabled: enabled === true }).eq("id", id);
  if (error) return actionError(dbErrorMessage(error));
  expire(CACHE_TAGS.homepage);
  return { ok: true, message: enabled ? "Section is live." : "Section hidden." };
}

export async function deleteHomepageSectionAction(id: string): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid section.");
  const { error } = await supabase.from("homepage_sections").delete().eq("id", id);
  if (error) return actionError(dbErrorMessage(error));
  expire(CACHE_TAGS.homepage);
  return { ok: true, message: "Section deleted." };
}

export async function reorderHomepageSectionsAction(ids: string[]): Promise<ActionResult> {
  const { supabase } = await adminContext();
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return actionError("Invalid order.");
  const results = await Promise.all(
    parsed.data.map((id, index) => supabase.from("homepage_sections").update({ display_order: index }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return actionError(dbErrorMessage(failed.error));
  expire(CACHE_TAGS.homepage);
  return { ok: true };
}
