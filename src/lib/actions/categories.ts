"use server";

import { adminContext, expire } from "./shared";
import { actionError, dbErrorMessage, type ActionResult } from "./types";
import { fieldErrors, uuidSchema } from "@/lib/validations/common";
import { categoryFormSchema, type CategoryFormInput } from "@/lib/validations/forms";
import { reorderSchema } from "@/lib/validations/project";
import { CACHE_TAGS } from "@/lib/content/tags";

const tags = [CACHE_TAGS.categories, CACHE_TAGS.projects] as const;

export async function saveCategoryAction(id: string | null, input: CategoryFormInput): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await adminContext();
  if (id && !uuidSchema.safeParse(id).success) return actionError("Invalid category.");
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.", fieldErrors(parsed.error));

  const values = { ...parsed.data, description: parsed.data.description || null };

  if (id) {
    const { error } = await supabase.from("project_categories").update(values).eq("id", id);
    if (error) return actionError(dbErrorMessage(error));
    expire(...tags);
    return { ok: true, data: { id }, message: "Category saved." };
  }

  const { data: last } = await supabase
    .from("project_categories")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("project_categories")
    .insert({ ...values, display_order: (last?.display_order ?? -1) + 1 })
    .select("id")
    .single();
  if (error) return actionError(dbErrorMessage(error));
  expire(...tags);
  return { ok: true, data: { id: data.id }, message: "Category created." };
}

export async function setCategoryActiveAction(id: string, active: boolean): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid category.");
  const { error } = await supabase.from("project_categories").update({ is_active: active === true }).eq("id", id);
  if (error) return actionError(dbErrorMessage(error));
  expire(...tags);
  return { ok: true, message: active ? "Category is now visible." : "Category hidden." };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid category.");
  // Projects keep existing; their category is cleared (ON DELETE SET NULL).
  const { error } = await supabase.from("project_categories").delete().eq("id", id);
  if (error) return actionError(dbErrorMessage(error));
  expire(...tags);
  return { ok: true, message: "Category deleted." };
}

export async function reorderCategoriesAction(ids: string[]): Promise<ActionResult> {
  const { supabase } = await adminContext();
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return actionError("Invalid order.");
  const results = await Promise.all(
    parsed.data.map((id, index) => supabase.from("project_categories").update({ display_order: index }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return actionError(dbErrorMessage(failed.error));
  expire(...tags);
  return { ok: true };
}
