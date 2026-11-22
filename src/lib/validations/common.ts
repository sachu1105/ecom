import { z } from "zod";
import { EXTERNAL_MEDIA_HOSTS } from "@/config/media";

/** Trimmed text with a maximum length; empty strings are allowed. */
export const text = (max: number) => z.string().trim().max(max).default("");

/** Trimmed, required text. */
export const requiredText = (max: number, message = "Required") =>
  z.string().trim().min(1, message).max(max);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Slug is required")
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only");

export const uuidSchema = z.uuid();

const STORAGE_KEY = /^[A-Za-z0-9][A-Za-z0-9/_.-]*$/;

/** A storage key in the media bucket, or an https URL on an allow-listed host. */
export function isAllowedMediaPath(value: string) {
  if (value.startsWith("https://")) {
    try {
      const url = new URL(value);
      return (EXTERNAL_MEDIA_HOSTS as readonly string[]).includes(url.hostname);
    } catch {
      return false;
    }
  }
  return STORAGE_KEY.test(value) && !value.includes("..") && !value.includes("//");
}

export const mediaPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(1024)
  .refine(isAllowedMediaPath, "Invalid media reference");

export const mediaRefSchema = z.object({
  path: mediaPathSchema,
  alt: text(300),
});
export type MediaRef = z.infer<typeof mediaRefSchema>;

/** Optional media: empty / missing values normalise to null. */
export const optionalMedia = z.preprocess(
  (value) =>
    value && typeof value === "object" && "path" in value && (value as { path?: unknown }).path
      ? value
      : null,
  mediaRefSchema.nullable(),
);

export const captionedMediaSchema = mediaRefSchema.extend({ caption: text(300) });
export type CaptionedMedia = z.infer<typeof captionedMediaSchema>;

/**
 * Links stored in content. Only relative paths, https, mailto: and tel: are
 * accepted, so `javascript:` and other script-bearing schemes can never reach an href.
 */
export function isSafeHref(value: string) {
  if (value === "") return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("#")) return true;
  if (/^mailto:[^\s]+$/i.test(value) || /^tel:[+\d\s()-]+$/i.test(value)) return true;
  if (/^https?:\/\//i.test(value)) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export const hrefSchema = z
  .string()
  .trim()
  .max(500)
  .refine(isSafeHref, "Use a relative path (/projects), https:// URL, mailto: or tel: link")
  .default("");

export const ctaSchema = z
  .object({
    label: text(60),
    href: hrefSchema,
  })
  .default({ label: "", href: "" });
export type Cta = z.infer<typeof ctaSchema>;

export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour, e.g. #A47B4F");

export const textItemSchema = z.object({
  title: text(120),
  body: text(1200),
});

/** Turns { _form: string[] } style Zod issues into a flat field → message map. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
