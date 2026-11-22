import { z } from "zod";
import { ctaSchema, mediaRefSchema, optionalMedia, text, textItemSchema } from "./common";

const block = {
  eyebrow: text(80),
  heading: text(200),
};

export const pageContentSchemas = {
  about: z.object({
    hero: z
      .object({ ...block, subtitle: text(500), image: optionalMedia })
      .default({ eyebrow: "", heading: "", subtitle: "", image: null }),
    intro: z
      .object({ ...block, body: text(4000), image: optionalMedia })
      .default({ eyebrow: "", heading: "", body: "", image: null }),
    story: z
      .object({ ...block, body: text(6000), image: optionalMedia })
      .default({ eyebrow: "", heading: "", body: "", image: null }),
    expertise: z
      .object({ ...block, items: z.array(textItemSchema).max(12).default([]) })
      .default({ eyebrow: "", heading: "", items: [] }),
    process: z
      .object({ ...block, steps: z.array(textItemSchema).max(12).default([]) })
      .default({ eyebrow: "", heading: "", steps: [] }),
    values: z
      .object({ ...block, items: z.array(textItemSchema).max(12).default([]) })
      .default({ eyebrow: "", heading: "", items: [] }),
    gallery: z
      .object({ images: z.array(mediaRefSchema).max(12).default([]) })
      .default({ images: [] }),
    cta: z
      .object({ heading: text(200), body: text(600), primaryCta: ctaSchema })
      .default({ heading: "", body: "", primaryCta: { label: "", href: "" } }),
  }),
  projects: z.object({
    ...block,
    intro: text(800),
    emptyMessage: text(300),
    // Closing call-to-action shown on every project detail page.
    enquiryEyebrow: text(80),
    enquiryHeading: text(160),
    enquiryBody: text(600),
    enquiryLabel: text(60),
  }),
  contact: z.object({
    ...block,
    intro: text(800),
    formHeading: text(160),
    successMessage: text(300),
    image: optionalMedia,
  }),
} as const;

export type PageKey = keyof typeof pageContentSchemas;
export const PAGE_KEYS = Object.keys(pageContentSchemas) as PageKey[];
export type PageContent<K extends PageKey> = z.infer<(typeof pageContentSchemas)[K]>;

export type PageData<K extends PageKey> = {
  key: K;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  content: PageContent<K>;
};

export const pageMetaSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  seo_title: text(200),
  seo_description: text(320),
  is_published: z.boolean().default(true),
});
