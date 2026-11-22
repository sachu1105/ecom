import { z } from "zod";
import { mediaPathSchema, slugSchema, text } from "./common";

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable()).default(null);

/** Project details form (React Hook Form + server action). */
export const projectFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugSchema,
  short_description: optionalText(600),
  description: optionalText(20000),
  category_id: z.preprocess(emptyToNull, z.uuid().nullable()).default(null),
  location: optionalText(200),
  completion_date: z
    .preprocess(emptyToNull, z.iso.date("Use YYYY-MM-DD").nullable())
    .default(null),
  application_type: optionalText(200),
  material_used: optionalText(200),
  cover_image_path: z.preprocess(emptyToNull, mediaPathSchema.nullable()).default(null),
  cover_image_alt: optionalText(300),
  status: z.enum(["draft", "published"]).default("draft"),
  is_featured: z.boolean().default(false),
  seo_title: optionalText(200),
  seo_description: optionalText(320),
});

/** Shape edited by the admin form (the schema normalises empty strings to null). */
export type ProjectFormInput = {
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  location: string | null;
  completion_date: string | null;
  application_type: string | null;
  material_used: string | null;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  status: "draft" | "published";
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
};
export type ProjectFormValues = z.output<typeof projectFormSchema>;

export const projectMediaItemSchema = z.object({
  id: z.uuid().optional(),
  media_type: z.enum(["image", "video"]),
  storage_path: mediaPathSchema,
  alt_text: text(300),
  caption: text(500),
});
export type ProjectMediaItem = z.infer<typeof projectMediaItemSchema>;

export const projectMediaListSchema = z.array(projectMediaItemSchema).max(80);

export const reorderSchema = z.array(z.uuid()).min(1).max(500);
