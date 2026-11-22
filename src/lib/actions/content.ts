"use server";

import { z } from "zod";
import { adminContext, expire } from "./shared";
import { actionError, dbErrorMessage, type ActionResult } from "./types";
import { fieldErrors } from "@/lib/validations/common";
import { PAGE_KEYS, pageContentSchemas, pageMetaSchema, type PageKey } from "@/lib/validations/pages";
import { PRIVATE_SETTING_KEYS, SITE_SETTING_KEYS, siteSettingSchemas, type SiteSettingKey } from "@/lib/validations/settings";
import { inquiryStatusSchema } from "@/lib/validations/forms";
import { uuidSchema } from "@/lib/validations/common";
import { CACHE_TAGS } from "@/lib/content/tags";

/* --------------------------------- Pages --------------------------------- */

export async function savePageAction(
  key: PageKey,
  input: { meta: z.input<typeof pageMetaSchema>; content: unknown },
): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!z.enum(PAGE_KEYS as [PageKey, ...PageKey[]]).safeParse(key).success) return actionError("Unknown page.");

  const meta = pageMetaSchema.safeParse(input.meta);
  if (!meta.success) return actionError("Please fix the page details.", fieldErrors(meta.error));
  const content = pageContentSchemas[key].safeParse(input.content);
  if (!content.success) {
    return actionError("Some content is invalid.", fieldErrors(content.error));
  }

  const { error } = await supabase.from("pages").upsert(
    {
      page_key: key,
      title: meta.data.title,
      seo_title: meta.data.seo_title || null,
      seo_description: meta.data.seo_description || null,
      is_published: meta.data.is_published,
      content: content.data as never,
    },
    { onConflict: "page_key" },
  );
  if (error) return actionError(dbErrorMessage(error));
  expire(CACHE_TAGS.pages);
  return { ok: true, message: "Page saved." };
}

/* ------------------------------- Settings -------------------------------- */

export async function saveSettingAction(key: SiteSettingKey, value: unknown): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!(SITE_SETTING_KEYS as string[]).includes(key)) return actionError("Unknown setting.");
  const parsed = siteSettingSchemas[key].safeParse(value);
  if (!parsed.success) return actionError("Please fix the highlighted fields.", fieldErrors(parsed.error));

  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { key, value: parsed.data as never, is_public: !PRIVATE_SETTING_KEYS.includes(key) },
      { onConflict: "key" },
    );
  if (error) return actionError(dbErrorMessage(error));
  // Settings feed the header, footer and metadata of every page.
  expire(CACHE_TAGS.settings, CACHE_TAGS.homepage, CACHE_TAGS.pages, CACHE_TAGS.projects);
  return { ok: true, message: "Settings saved." };
}

/* ------------------------------- Inquiries ------------------------------- */

export async function setInquiryStatusAction(id: string, status: "new" | "read" | "archived"): Promise<ActionResult> {
  const { supabase } = await adminContext();
  const parsed = inquiryStatusSchema.safeParse({ id, status });
  if (!parsed.success) return actionError("Invalid request.");
  const { error } = await supabase
    .from("inquiries")
    .update({ status, read_at: status === "new" ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) return actionError(dbErrorMessage(error));
  return { ok: true };
}

export async function deleteInquiryAction(id: string): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid enquiry.");
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) return actionError(dbErrorMessage(error));
  return { ok: true, message: "Enquiry deleted." };
}
