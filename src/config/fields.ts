/**
 * Field descriptors that drive the generic admin editor
 * (src/components/admin/fields/field-editor.tsx). They describe *how to edit*
 * the JSONB shapes whose *rules* live in src/lib/validations. Keep the names in sync.
 */

export type Option = { value: string; label: string };

export type FieldDef =
  | { kind: "text"; name: string; label: string; placeholder?: string; help?: string; max?: number }
  | { kind: "textarea"; name: string; label: string; rows?: number; help?: string; max?: number }
  | { kind: "media"; name: string; label: string; accept: "image" | "video"; help?: string }
  | { kind: "mediaList"; name: string; label: string; accept: "image"; withCaption?: boolean; help?: string }
  | { kind: "select"; name: string; label: string; options: Option[]; help?: string }
  | { kind: "switch"; name: string; label: string; help?: string }
  | { kind: "number"; name: string; label: string; min: number; max: number; step?: number; help?: string }
  | { kind: "color"; name: string; label: string; help?: string }
  | { kind: "cta"; name: string; label: string; help?: string }
  | { kind: "group"; name: string; label: string; fields: FieldDef[]; help?: string }
  | { kind: "list"; name: string; label: string; itemLabel: string; fields: FieldDef[]; max?: number; help?: string };

const t = (name: string, label: string, extra: Partial<Extract<FieldDef, { kind: "text" }>> = {}): FieldDef => ({
  kind: "text",
  name,
  label,
  ...extra,
});
const ta = (name: string, label: string, rows = 4, help?: string): FieldDef => ({ kind: "textarea", name, label, rows, help });
const img = (name: string, label: string, help?: string): FieldDef => ({ kind: "media", name, label, accept: "image", help });
const vid = (name: string, label: string, help?: string): FieldDef => ({ kind: "media", name, label, accept: "video", help });
const sel = (name: string, label: string, options: [string, string][], help?: string): FieldDef => ({
  kind: "select",
  name,
  label,
  options: options.map(([value, l]) => ({ value, label: l })),
  help,
});
const sw = (name: string, label: string, help?: string): FieldDef => ({ kind: "switch", name, label, help });
const cta = (name: string, label: string): FieldDef => ({
  kind: "cta",
  name,
  label,
  help: "Use a path like /projects, a full https:// link, mailto: or tel:",
});

const background = sel("background", "Background", [
  ["white", "Off-white"],
  ["muted", "Stone"],
]);
const align = sel("align", "Text alignment", [
  ["left", "Left"],
  ["center", "Centre"],
]);
const overlay: FieldDef = {
  kind: "number",
  name: "overlay",
  label: "Image darkening (%)",
  min: 0,
  max: 90,
  step: 5,
  help: "Increase for better text contrast on bright images.",
};
const eyebrow = t("eyebrow", "Eyebrow", { help: "Small uppercase label above the heading." });

/* ------------------------------- Homepage -------------------------------- */

export const HOMEPAGE_SECTION_META: Record<
  string,
  { label: string; description: string; content: FieldDef[]; settings: FieldDef[] }
> = {
  hero: {
    label: "Hero",
    description: "Full-width cinematic opening with image or video.",
    content: [
      eyebrow,
      t("heading", "Heading"),
      ta("subtitle", "Short description", 3),
      img("image", "Background image", "Landscape, at least 2400px wide. Also used as the video poster."),
      img("mobileImage", "Mobile image (optional)", "Portrait crop for phones."),
      vid("video", "Background video (optional)", "MP4/WebM, muted loop, ideally under 15 MB."),
      cta("primaryCta", "Primary button"),
      cta("secondaryCta", "Secondary button"),
    ],
    settings: [
      align,
      overlay,
      sel("height", "Height", [
        ["tall", "Tall (≈88% of screen)"],
        ["full", "Full screen"],
      ]),
      sw("useVideo", "Play video when provided"),
    ],
  },
  featured_projects: {
    label: "Featured projects",
    description: "Large photographic cards of featured projects.",
    content: [eyebrow, t("heading", "Heading"), ta("description", "Description", 2), cta("cta", "Link")],
    settings: [
      sel("layout", "Layout", [
        ["carousel", "Horizontal carousel"],
        ["grid", "Grid"],
      ]),
      { kind: "number", name: "limit", label: "Number of projects", min: 1, max: 24 },
      background,
    ],
  },
  category_showcase: {
    label: "Category showcase",
    description: "Active project categories with cover images.",
    content: [eyebrow, t("heading", "Heading"), ta("description", "Description", 2)],
    settings: [
      sel("layout", "Layout", [
        ["grid", "Editorial grid"],
        ["carousel", "Horizontal carousel"],
      ]),
      { kind: "number", name: "limit", label: "Number of categories", min: 1, max: 24 },
    ],
  },
  image_text: {
    label: "Image & text",
    description: "Editorial split: photograph alongside a story.",
    content: [eyebrow, t("heading", "Heading"), ta("body", "Body", 6, "Separate paragraphs with a blank line."), img("image", "Image"), cta("cta", "Button")],
    settings: [
      sel("imagePosition", "Image position", [
        ["left", "Left"],
        ["right", "Right"],
      ]),
      sel("imageRatio", "Image shape", [
        ["portrait", "Portrait"],
        ["square", "Square"],
        ["landscape", "Landscape"],
      ]),
      background,
    ],
  },
  campaign_banner: {
    label: "Campaign banner",
    description: "Full-width photographic campaign statement.",
    content: [eyebrow, t("heading", "Heading"), ta("body", "Body", 3), img("image", "Image"), img("mobileImage", "Mobile image (optional)"), cta("cta", "Button")],
    settings: [
      align,
      overlay,
      sel("height", "Height", [
        ["medium", "Medium"],
        ["tall", "Tall"],
      ]),
    ],
  },
  video: {
    label: "Video",
    description: "Showcase film of installations.",
    content: [eyebrow, t("heading", "Heading"), ta("body", "Description", 2), vid("video", "Video"), img("poster", "Poster image")],
    settings: [sw("autoplay", "Autoplay muted loop (otherwise shows player controls)"), sw("fullWidth", "Full width")],
  },
  before_after: {
    label: "Before & after",
    description: "Interactive comparison slider.",
    content: [
      eyebrow,
      t("heading", "Heading"),
      ta("body", "Description", 3),
      img("before", "Before image"),
      img("after", "After image", "Use the same framing as the before image."),
      t("beforeLabel", "Before label", { placeholder: "Before" }),
      t("afterLabel", "After label", { placeholder: "After" }),
    ],
    settings: [background],
  },
  intro: {
    label: "Company introduction",
    description: "Large statement with supporting figures.",
    content: [
      eyebrow,
      ta("heading", "Statement", 3),
      ta("body", "Body", 5),
      { kind: "list", name: "stats", label: "Figures", itemLabel: "Figure", max: 6, fields: [t("value", "Value", { placeholder: "1,200+" }), t("label", "Label")] },
      cta("cta", "Link"),
    ],
    settings: [background],
  },
  enquiry_cta: {
    label: "Enquiry call-to-action",
    description: "Closing invitation to get in touch.",
    content: [eyebrow, t("heading", "Heading"), ta("body", "Body", 3), cta("cta", "Button"), sw("showWhatsApp", "Show WhatsApp button")],
    settings: [
      sel("theme", "Colour", [
        ["dark", "Dark"],
        ["light", "Light grey"],
        ["brand", "Brand accent"],
      ]),
    ],
  },
};

/* --------------------------- Project sections ---------------------------- */

export const PROJECT_SECTION_META: Record<string, { label: string; description: string; fields: FieldDef[] }> = {
  text: {
    label: "Text",
    description: "Narrative paragraphs.",
    fields: [
      ta("body", "Text", 8, "Separate paragraphs with a blank line."),
      sel("layout", "Style", [
        ["standard", "Standard"],
        ["lead", "Large lead paragraph"],
      ]),
    ],
  },
  gallery: {
    label: "Image gallery",
    description: "A set of photographs with optional captions.",
    fields: [
      { kind: "mediaList", name: "images", label: "Images", accept: "image", withCaption: true },
      sel("layout", "Layout", [
        ["grid", "Editorial grid"],
        ["masonry", "Masonry"],
        ["carousel", "Horizontal scroll"],
      ]),
    ],
  },
  full_image: { label: "Full-width image", description: "Edge-to-edge photograph.", fields: [img("image", "Image"), t("caption", "Caption")] },
  image_text: {
    label: "Image & text",
    description: "Photograph beside a paragraph.",
    fields: [
      img("image", "Image"),
      ta("body", "Text", 6),
      sel("imagePosition", "Image position", [
        ["left", "Left"],
        ["right", "Right"],
      ]),
    ],
  },
  before_after: {
    label: "Before & after",
    description: "Comparison slider.",
    fields: [img("before", "Before"), img("after", "After"), t("beforeLabel", "Before label"), t("afterLabel", "After label"), t("caption", "Caption")],
  },
  video: {
    label: "Video",
    description: "Installation film.",
    fields: [vid("video", "Video"), img("poster", "Poster image"), t("caption", "Caption"), sw("autoplay", "Autoplay muted loop")],
  },
  specifications: {
    label: "Specifications",
    description: "Label / value list (film, finish, area…).",
    fields: [
      { kind: "list", name: "items", label: "Specifications", itemLabel: "Row", max: 40, fields: [t("label", "Label", { placeholder: "Film" }), t("value", "Value")] },
    ],
  },
  quote: {
    label: "Quote / testimonial",
    description: "Client words in large type.",
    fields: [ta("quote", "Quote", 4), t("author", "Name"), t("role", "Role / company")],
  },
};

/* --------------------------------- Pages --------------------------------- */

const items = (name: string, label: string, itemLabel: string): FieldDef => ({
  kind: "list",
  name,
  label,
  itemLabel,
  max: 12,
  fields: [t("title", "Title"), ta("body", "Description", 3)],
});

export const PAGE_FIELDS: Record<string, { label: string; description: string; fields: FieldDef[] }> = {
  about: {
    label: "About",
    description: "Company profile page.",
    fields: [
      { kind: "group", name: "hero", label: "Hero", fields: [eyebrow, t("heading", "Heading"), ta("subtitle", "Subtitle", 3), img("image", "Hero image")] },
      { kind: "group", name: "intro", label: "Company introduction", fields: [eyebrow, t("heading", "Heading"), ta("body", "Body", 6), img("image", "Image")] },
      { kind: "group", name: "story", label: "Company story", fields: [eyebrow, t("heading", "Heading"), ta("body", "Body", 8), img("image", "Image")] },
      { kind: "group", name: "expertise", label: "Expertise", fields: [eyebrow, t("heading", "Heading"), items("items", "Areas of expertise", "Area")] },
      { kind: "group", name: "process", label: "Work process", fields: [eyebrow, t("heading", "Heading"), items("steps", "Steps", "Step")] },
      { kind: "group", name: "values", label: "Brand values", fields: [eyebrow, t("heading", "Heading"), items("items", "Values", "Value")] },
      { kind: "group", name: "gallery", label: "Editorial imagery", fields: [{ kind: "mediaList", name: "images", label: "Images", accept: "image" }] },
      { kind: "group", name: "cta", label: "Closing call-to-action", fields: [t("heading", "Heading"), ta("body", "Body", 3), cta("primaryCta", "Button")] },
    ],
  },
  projects: {
    label: "Projects",
    description: "Portfolio listing intro and project-page enquiry block.",
    fields: [
      eyebrow,
      t("heading", "Heading"),
      ta("intro", "Introduction", 3),
      ta("emptyMessage", "Message when no projects are published", 2),
      t("enquiryEyebrow", "Project page CTA: eyebrow"),
      t("enquiryHeading", "Project page CTA: heading", { help: "Use {project} to insert the project name." }),
      ta("enquiryBody", "Project page CTA: body", 3, "Use {project} to insert the project name."),
      t("enquiryLabel", "Project page CTA: button label"),
    ],
  },
  contact: {
    label: "Contact",
    description: "Contact page copy.",
    fields: [
      eyebrow,
      t("heading", "Heading"),
      ta("intro", "Introduction", 3),
      t("formHeading", "Form heading"),
      ta("successMessage", "Message after sending", 2),
      img("image", "Side image (optional)"),
    ],
  },
};

/* ------------------------------- Settings -------------------------------- */

export const SETTINGS_FIELDS: Record<string, { label: string; description: string; fields: FieldDef[] }> = {
  brand: {
    label: "Brand",
    description: "Name, logo and accent colour.",
    fields: [
      t("name", "Company name"),
      t("tagline", "Tagline"),
      img("logo", "Logo (on light backgrounds)", "PNG/WebP with transparency, about 400px wide. Without one, a wordmark is generated."),
      img("logoInverse", "Logo (on dark images)", "White version for the transparent header and footer."),
      { kind: "color", name: "accentColor", label: "Accent colour", help: "Used sparingly for highlights and focus states." },
    ],
  },
  contact: {
    label: "Contact",
    description: "Details shown in the footer and contact page.",
    fields: [
      t("email", "Business email"),
      t("phone", "Business phone"),
      t("whatsapp", "WhatsApp number", { help: "International format with country code, digits only (e.g. 447700900123)." }),
      ta("whatsappMessage", "Default WhatsApp message", 2),
      ta("address", "Address", 3),
      t("hours", "Opening hours"),
      t("mapUrl", "Map link (https://)"),
    ],
  },
  social: {
    label: "Social",
    description: "Social media profiles.",
    fields: [
      {
        kind: "list",
        name: "links",
        label: "Profiles",
        itemLabel: "Profile",
        max: 12,
        fields: [
          sel("platform", "Platform", [
            ["instagram", "Instagram"],
            ["facebook", "Facebook"],
            ["linkedin", "LinkedIn"],
            ["youtube", "YouTube"],
            ["tiktok", "TikTok"],
            ["x", "X"],
            ["pinterest", "Pinterest"],
            ["behance", "Behance"],
            ["website", "Website"],
          ]),
          t("url", "URL (https://)"),
        ],
      },
    ],
  },
  footer: {
    label: "Footer",
    description: "Footer copy.",
    fields: [ta("description", "Short description", 3), t("copyright", "Copyright line", { help: "Use {year} and {brand}, e.g. © {year} {brand}." }), sw("showCategories", "List categories in the footer")],
  },
  seo: {
    label: "SEO",
    description: "Search and social sharing defaults.",
    fields: [
      t("siteUrl", "Site URL", { help: "e.g. https://www.example.com, used for canonical URLs and the sitemap." }),
      t("defaultTitle", "Default title"),
      t("titleTemplate", "Title template", { help: "%s is replaced by the page title, e.g. %s | Brand." }),
      ta("description", "Default description", 3),
      img("ogImage", "Social sharing image", "1200×630 px."),
    ],
  },
  navigation: {
    label: "Navigation",
    description: "Header menu and floating buttons.",
    fields: [
      t("projectsLabel", "Projects menu label", { placeholder: "Projects" }),
      t("categoriesLabel", "Categories menu label", { placeholder: "Applications" }),
      sw("showCategoryMenu", "Show categories dropdown"),
      sw("showCta", "Show header button"),
      cta("cta", "Header button"),
      sw("showWhatsAppButton", "Show floating WhatsApp button"),
    ],
  },
  notifications: {
    label: "Notifications",
    description: "Private: never shown on the website.",
    fields: [
      t("enquiryEmails", "Send new enquiries to", {
        placeholder: "you@company.com, sales@company.com",
        help: "Up to 5 addresses, separated by commas. Leave empty to use the CONTACT_EMAIL server setting. Emails are sent with Resend (RESEND_API_KEY).",
      }),
    ],
  },
};
