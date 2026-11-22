import { z } from "zod";
import {
  captionedMediaSchema,
  ctaSchema,
  mediaRefSchema,
  optionalMedia,
  text,
} from "./common";

/* ===========================================================================
   Project (case-study) sections
   =========================================================================== */

export const PROJECT_SECTION_TYPES = [
  "text",
  "gallery",
  "full_image",
  "image_text",
  "before_after",
  "video",
  "specifications",
  "quote",
] as const;
export type ProjectSectionType = (typeof PROJECT_SECTION_TYPES)[number];

export const projectSectionContentSchemas = {
  text: z.object({
    body: text(10000),
    layout: z.enum(["standard", "lead"]).default("standard"),
  }),
  gallery: z.object({
    images: z.array(captionedMediaSchema).max(40).default([]),
    layout: z.enum(["grid", "carousel", "masonry"]).default("grid"),
  }),
  full_image: z.object({
    image: optionalMedia,
    caption: text(300),
  }),
  image_text: z.object({
    image: optionalMedia,
    body: text(4000),
    imagePosition: z.enum(["left", "right"]).default("left"),
  }),
  before_after: z.object({
    before: optionalMedia,
    after: optionalMedia,
    beforeLabel: text(40),
    afterLabel: text(40),
    caption: text(300),
  }),
  video: z.object({
    video: optionalMedia,
    poster: optionalMedia,
    caption: text(300),
    autoplay: z.boolean().default(false),
  }),
  specifications: z.object({
    items: z
      .array(z.object({ label: text(80), value: text(300) }))
      .max(40)
      .default([]),
  }),
  quote: z.object({
    quote: text(1200),
    author: text(120),
    role: text(160),
  }),
} satisfies Record<ProjectSectionType, z.ZodType>;

export type ProjectSectionContent<T extends ProjectSectionType> = z.infer<
  (typeof projectSectionContentSchemas)[T]
>;

export type ProjectSection = {
  [K in ProjectSectionType]: {
    id: string;
    type: K;
    heading: string | null;
    content: ProjectSectionContent<K>;
  };
}[ProjectSectionType];

export const projectSectionInputSchema = z.object({
  id: z.uuid().optional(),
  section_type: z.enum(PROJECT_SECTION_TYPES),
  heading: text(200),
  content: z.record(z.string(), z.unknown()).default({}),
});
export type ProjectSectionInput = z.infer<typeof projectSectionInputSchema>;

/** Validates a section's content against its type. */
export function parseProjectSectionContent(type: ProjectSectionType, content: unknown) {
  return projectSectionContentSchemas[type].safeParse(content ?? {});
}

/* ===========================================================================
   Homepage sections
   =========================================================================== */

export const HOMEPAGE_SECTION_TYPES = [
  "hero",
  "featured_projects",
  "category_showcase",
  "image_text",
  "campaign_banner",
  "video",
  "before_after",
  "intro",
  "enquiry_cta",
] as const;
export type HomepageSectionType = (typeof HOMEPAGE_SECTION_TYPES)[number];

const overlay = z.coerce.number().int().min(0).max(90).default(35);
const align = z.enum(["left", "center"]).default("left");

export const homepageSectionSchemas = {
  hero: {
    content: z.object({
      eyebrow: text(80),
      heading: text(160),
      subtitle: text(400),
      image: optionalMedia,
      mobileImage: optionalMedia,
      video: optionalMedia,
      primaryCta: ctaSchema,
      secondaryCta: ctaSchema,
    }),
    settings: z.object({
      align,
      overlay,
      height: z.enum(["tall", "full"]).default("tall"),
      useVideo: z.boolean().default(true),
    }),
  },
  featured_projects: {
    content: z.object({
      eyebrow: text(80),
      heading: text(160),
      description: text(600),
      cta: ctaSchema,
    }),
    settings: z.object({
      layout: z.enum(["carousel", "grid"]).default("carousel"),
      limit: z.coerce.number().int().min(1).max(24).default(8),
      background: z.enum(["white", "muted"]).default("muted"),
    }),
  },
  category_showcase: {
    content: z.object({
      eyebrow: text(80),
      heading: text(160),
      description: text(600),
    }),
    settings: z.object({
      layout: z.enum(["carousel", "grid"]).default("grid"),
      limit: z.coerce.number().int().min(1).max(24).default(8),
    }),
  },
  image_text: {
    content: z.object({
      eyebrow: text(80),
      heading: text(160),
      body: text(4000),
      image: optionalMedia,
      cta: ctaSchema,
    }),
    settings: z.object({
      imagePosition: z.enum(["left", "right"]).default("right"),
      background: z.enum(["white", "muted"]).default("white"),
      imageRatio: z.enum(["portrait", "square", "landscape"]).default("portrait"),
    }),
  },
  campaign_banner: {
    content: z.object({
      eyebrow: text(80),
      heading: text(160),
      body: text(600),
      image: optionalMedia,
      mobileImage: optionalMedia,
      cta: ctaSchema,
    }),
    settings: z.object({
      align,
      overlay,
      height: z.enum(["medium", "tall"]).default("tall"),
    }),
  },
  video: {
    content: z.object({
      eyebrow: text(80),
      heading: text(160),
      body: text(600),
      video: optionalMedia,
      poster: optionalMedia,
    }),
    settings: z.object({
      autoplay: z.boolean().default(true),
      fullWidth: z.boolean().default(true),
    }),
  },
  before_after: {
    content: z.object({
      eyebrow: text(80),
      heading: text(160),
      body: text(600),
      before: optionalMedia,
      after: optionalMedia,
      beforeLabel: text(40),
      afterLabel: text(40),
    }),
    settings: z.object({
      background: z.enum(["white", "muted"]).default("muted"),
    }),
  },
  intro: {
    content: z.object({
      eyebrow: text(80),
      heading: text(240),
      body: text(2000),
      stats: z
        .array(z.object({ value: text(24), label: text(80) }))
        .max(6)
        .default([]),
      cta: ctaSchema,
    }),
    settings: z.object({
      background: z.enum(["white", "muted"]).default("white"),
    }),
  },
  enquiry_cta: {
    content: z.object({
      eyebrow: text(80),
      heading: text(160),
      body: text(600),
      cta: ctaSchema,
      showWhatsApp: z.boolean().default(true),
    }),
    settings: z.object({
      theme: z.enum(["dark", "light", "brand"]).default("dark"),
    }),
  },
} satisfies Record<HomepageSectionType, { content: z.ZodType; settings: z.ZodType }>;

export type HomepageContent<T extends HomepageSectionType> = z.infer<
  (typeof homepageSectionSchemas)[T]["content"]
>;
export type HomepageSettings<T extends HomepageSectionType> = z.infer<
  (typeof homepageSectionSchemas)[T]["settings"]
>;

export type HomepageSection = {
  [K in HomepageSectionType]: {
    id: string;
    type: K;
    title: string | null;
    isEnabled: boolean;
    hasDraft?: boolean;
    content: HomepageContent<K>;
    settings: HomepageSettings<K>;
  };
}[HomepageSectionType];

export function parseHomepageSection(
  type: HomepageSectionType,
  content: unknown,
  settings: unknown,
) {
  const schema = homepageSectionSchemas[type];
  const c = schema.content.safeParse(content ?? {});
  const s = schema.settings.safeParse(settings ?? {});
  return { content: c, settings: s };
}

export const homepageSectionInputSchema = z.object({
  title: text(200),
  content: z.record(z.string(), z.unknown()).default({}),
  settings: z.record(z.string(), z.unknown()).default({}),
});

/** Re-export for consumers that want the media schema with sections. */
export { mediaRefSchema };
