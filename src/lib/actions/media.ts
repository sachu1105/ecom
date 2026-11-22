"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { adminContext, expire } from "./shared";
import { actionError, dbErrorMessage, type ActionResult } from "./types";
import { mediaAltSchema, registerMediaSchema, uploadRequestSchema } from "@/lib/validations/forms";
import { uuidSchema } from "@/lib/validations/common";
import {
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MEDIA_BUCKET,
  MIME_EXTENSIONS,
  formatBytes,
  isImageMime,
  isVideoMime,
} from "@/config/media";
import { findMediaUsage } from "@/lib/content/media-usage";
import { resolveMediaUrl } from "@/lib/content/media";
import { CACHE_TAGS } from "@/lib/content/tags";
import type { MediaAssetRow } from "@/types/database";

export type MediaListItem = MediaAssetRow & { url: string | null; usedIn: string[] };

function checkFile(mimeType: string, size: number) {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return "Unsupported file type. Use JPG, PNG, WebP, AVIF, GIF, MP4, WebM or MOV.";
  }
  const max = isVideoMime(mimeType) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (size > max) return `File is too large (max ${formatBytes(max)} for this type).`;
  return null;
}

/**
 * Step 1: authorise and validate, then issue a one-time signed upload URL.
 * The server chooses the storage path: never the client's file name.
 */
export async function createUploadUrlAction(
  input: z.input<typeof uploadRequestSchema>,
): Promise<ActionResult<{ path: string; token: string }>> {
  const { supabase } = await adminContext();
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid upload request.");
  const problem = checkFile(parsed.data.mimeType, parsed.data.size);
  if (problem) return actionError(problem);

  const ext = MIME_EXTENSIONS[parsed.data.mimeType as keyof typeof MIME_EXTENSIONS];
  const now = new Date();
  const path = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return actionError("Could not start the upload. Please try again.");
  return { ok: true, data: { path: data.path, token: data.token } };
}

/**
 * Step 2: after the browser uploads, verify the stored object (real size and
 * type, not what the client claimed) and record it in the library.
 */
export async function registerMediaAction(
  input: z.input<typeof registerMediaSchema>,
): Promise<ActionResult<MediaListItem>> {
  const { supabase, user } = await adminContext();
  const parsed = registerMediaSchema.safeParse(input);
  if (!parsed.success || !parsed.data.path.startsWith("uploads/")) return actionError("Invalid media.");

  const { data: info, error: infoError } = await supabase.storage.from(MEDIA_BUCKET).info(parsed.data.path);
  if (infoError || !info) return actionError("The uploaded file could not be found.");

  const mimeType = info.contentType || parsed.data.mimeType;
  const size = info.size ?? parsed.data.size;
  const problem = checkFile(mimeType, size);
  if (problem) {
    await supabase.storage.from(MEDIA_BUCKET).remove([parsed.data.path]);
    return actionError(problem);
  }

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      storage_path: parsed.data.path,
      file_name: parsed.data.fileName.replace(/[^\w.\- ()]/g, "_").slice(0, 255),
      mime_type: mimeType,
      media_type: isImageMime(mimeType) ? "image" : "video",
      size_bytes: size,
      width: parsed.data.width,
      height: parsed.data.height,
      alt_text: parsed.data.alt || null,
      created_by: user.id,
    })
    .select("*")
    .single();
  if (error) return actionError(dbErrorMessage(error));
  return { ok: true, data: { ...data, url: resolveMediaUrl(data.storage_path), usedIn: [] } };
}

export async function listMediaAction(input: {
  q?: string;
  type?: "image" | "video" | "all";
}): Promise<ActionResult<MediaListItem[]>> {
  const { supabase } = await adminContext();
  const parsed = z
    .object({ q: z.string().trim().max(100).default(""), type: z.enum(["image", "video", "all"]).default("all") })
    .safeParse(input);
  if (!parsed.success) return actionError("Invalid filter.");

  let query = supabase.from("media_assets").select("*").order("created_at", { ascending: false }).limit(300);
  if (parsed.data.type !== "all") query = query.eq("media_type", parsed.data.type);
  if (parsed.data.q) {
    const safe = parsed.data.q.replace(/[%_,()]/g, " ");
    query = query.or(`file_name.ilike.%${safe}%,alt_text.ilike.%${safe}%`);
  }
  const [{ data, error }, usage] = await Promise.all([query, findMediaUsage(supabase)]);
  if (error) return actionError(dbErrorMessage(error));
  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      ...row,
      url: resolveMediaUrl(row.storage_path),
      usedIn: usage.get(row.storage_path) ?? [],
    })),
  };
}

export async function updateMediaAltAction(input: z.input<typeof mediaAltSchema>): Promise<ActionResult> {
  const { supabase } = await adminContext();
  const parsed = mediaAltSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid alt text.");
  const { error } = await supabase
    .from("media_assets")
    .update({ alt_text: parsed.data.alt || null })
    .eq("id", parsed.data.id);
  if (error) return actionError(dbErrorMessage(error));
  return { ok: true, message: "Alt text saved." };
}

/** Deletes media only when nothing references it. */
export async function deleteMediaAction(id: string): Promise<ActionResult> {
  const { supabase } = await adminContext();
  if (!uuidSchema.safeParse(id).success) return actionError("Invalid media.");
  const { data: asset } = await supabase.from("media_assets").select("storage_path").eq("id", id).maybeSingle();
  if (!asset) return actionError("Media not found.");

  const usage = await findMediaUsage(supabase);
  const usedIn = usage.get(asset.storage_path);
  if (usedIn?.length) {
    return actionError(`This file is still used (${usedIn.slice(0, 3).join(", ")}). Remove it there first.`);
  }

  const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove([asset.storage_path]);
  if (storageError) return actionError("Could not delete the file from storage.");
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) return actionError(dbErrorMessage(error));
  expire(CACHE_TAGS.projects);
  return { ok: true, message: "Media deleted." };
}
