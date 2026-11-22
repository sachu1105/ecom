import { z } from "zod";
import {
  ctaSchema,
  hexColorSchema,
  hrefSchema,
  optionalMedia,
  requiredText,
  text,
} from "./common";

export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "linkedin",
  "youtube",
  "tiktok",
  "x",
  "pinterest",
  "behance",
  "website",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v), "Use a full https:// URL");

/** Digits only, international format without "+", e.g. 447700900123. */
export const whatsappNumberSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d]/g, ""))
  .refine((v) => v === "" || (v.length >= 7 && v.length <= 15), "Enter 7–15 digits incl. country code");

/** Comma-separated list of up to 5 email addresses ("" allowed). */
export const emailListSchema = z
  .string()
  .trim()
  .max(1000)
  .transform((v) =>
    v
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
  .refine((list) => list.length <= 5, "Up to 5 addresses")
  .refine((list) => list.every((e) => z.email().max(254).safeParse(e).success), "Enter valid email addresses, separated by commas")
  .transform((list) => [...new Set(list)].join(", "));

export const siteSettingSchemas = {
  brand: z.object({
    name: requiredText(80, "Brand name is required"),
    tagline: text(160),
    logo: optionalMedia,
    logoInverse: optionalMedia,
    accentColor: hexColorSchema.default("#A47B4F"),
  }),
  contact: z.object({
    email: z.union([z.literal(""), z.email().max(254)]).default(""),
    phone: text(40),
    whatsapp: whatsappNumberSchema.default(""),
    whatsappMessage: text(300),
    address: text(500),
    hours: text(200),
    mapUrl: httpsUrl.default(""),
  }),
  social: z.object({
    links: z
      .array(z.object({ platform: z.enum(SOCIAL_PLATFORMS), url: httpsUrl }))
      .max(12)
      .default([]),
  }),
  footer: z.object({
    description: text(600),
    copyright: text(200),
    showCategories: z.boolean().default(true),
  }),
  seo: z.object({
    siteUrl: httpsUrl.or(z.string().trim().regex(/^http:\/\/localhost(:\d+)?$/)).default(""),
    defaultTitle: text(120),
    titleTemplate: text(120),
    description: text(320),
    ogImage: optionalMedia,
  }),
  navigation: z.object({
    showCategoryMenu: z.boolean().default(true),
    showCta: z.boolean().default(true),
    cta: ctaSchema,
    showWhatsAppButton: z.boolean().default(true),
    projectsLabel: text(40),
    categoriesLabel: text(40),
  }),
  /** Private: stored with is_public = false, readable only by admins and the server. */
  notifications: z.object({
    enquiryEmails: emailListSchema.default(""),
  }),
} as const;

export type SiteSettingKey = keyof typeof siteSettingSchemas;
/** Settings never exposed to visitors (RLS hides rows with is_public = false). */
export const PRIVATE_SETTING_KEYS: readonly SiteSettingKey[] = ["notifications"];
export const SITE_SETTING_KEYS = Object.keys(siteSettingSchemas) as SiteSettingKey[];

export type SiteSettings = { [K in SiteSettingKey]: z.infer<(typeof siteSettingSchemas)[K]> };

/** Defaults used when a setting row is missing or invalid. */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brand: siteSettingSchemas.brand.parse({ name: "Studio" }),
  contact: siteSettingSchemas.contact.parse({}),
  social: siteSettingSchemas.social.parse({}),
  footer: siteSettingSchemas.footer.parse({}),
  seo: siteSettingSchemas.seo.parse({}),
  navigation: siteSettingSchemas.navigation.parse({}),
  notifications: siteSettingSchemas.notifications.parse({}),
};

export { hrefSchema };
