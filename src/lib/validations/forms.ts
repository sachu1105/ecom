import { z } from "zod";
import { mediaPathSchema, slugSchema, text } from "./common";

/* ----------------------------- Categories ------------------------------ */

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: slugSchema,
  description: text(2000),
  cover_image_path: z
    .preprocess((v) => (v === "" ? null : v), mediaPathSchema.nullable())
    .default(null),
  is_active: z.boolean().default(true),
});
export type CategoryFormInput = z.input<typeof categoryFormSchema>;

/* ------------------------------- Contact ------------------------------- */

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.email("Please enter a valid email").trim().max(254),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v === "" || /^[+\d\s().-]{6,40}$/.test(v), "Please enter a valid phone number")
    .default(""),
  subject: z.string().trim().max(200).default(""),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a little more (10+ characters)")
    .max(5000, "Please keep your message under 5000 characters"),
  project: z.string().trim().max(160).default(""),
  // Anti-spam: honeypot must be empty; startedAt is the form render time (ms).
  // Accepted by validation on purpose: a filled value is discarded silently by
  // the API so bots get no signal about which field gave them away.
  website: z.string().max(500).default(""),
  startedAt: z.coerce.number().int().nonnegative().default(0),
});
export type ContactFormInput = z.input<typeof contactFormSchema>;

/* -------------------------------- Auth --------------------------------- */

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().max(254),
  password: z.string().min(1, "Enter your password").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const passwordChangeSchema = z
  .object({
    password: z
      .string()
      .min(12, "Use at least 12 characters")
      .max(200)
      .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v), {
        message: "Include upper- and lower-case letters and a number",
      }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

/* -------------------------------- Media -------------------------------- */

export const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(100),
  size: z.number().int().positive(),
});

export const registerMediaSchema = z.object({
  path: mediaPathSchema,
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(100),
  size: z.number().int().positive(),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
  alt: text(300),
});

export const mediaAltSchema = z.object({
  id: z.uuid(),
  alt: text(300),
});

/* ------------------------------ Inquiries ------------------------------ */

export const inquiryStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["new", "read", "archived"]),
});
