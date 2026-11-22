"use client";

import { useCallback, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { createUploadUrlAction, registerMediaAction, type MediaListItem } from "@/lib/actions/media";
import {
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MEDIA_BUCKET,
  formatBytes,
  isImageMime,
  isVideoMime,
} from "@/config/media";

async function readDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  try {
    if (isImageMime(file.type)) {
      const bitmap = await createImageBitmap(file);
      const dims = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dims;
    }
    if (isVideoMime(file.type)) {
      return await new Promise((resolve) => {
        const video = document.createElement("video");
        const url = URL.createObjectURL(file);
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          resolve({ width: video.videoWidth || null, height: video.videoHeight || null });
          URL.revokeObjectURL(url);
        };
        video.onerror = () => {
          resolve({ width: null, height: null });
          URL.revokeObjectURL(url);
        };
        video.src = url;
      });
    }
  } catch {
    // dimensions are optional metadata
  }
  return { width: null, height: null };
}

/** Client-side pre-check (the server and the bucket enforce the same rules). */
export function validateFile(file: File): string | null {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) return `${file.name}: unsupported file type.`;
  const max = isVideoMime(file.type) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > max) return `${file.name}: larger than ${formatBytes(max)}.`;
  return null;
}

/**
 * Upload flow: server issues a signed URL → browser uploads directly to
 * Supabase Storage (no large bodies through the Next.js server) → server
 * verifies the stored object and records it in the media library.
 */
export function useMediaUpload() {
  const [uploading, setUploading] = useState(0);

  const upload = useCallback(async (files: File[]) => {
    const done: MediaListItem[] = [];
    const errors: string[] = [];
    setUploading((n) => n + files.length);
    for (const file of files) {
      try {
        const problem = validateFile(file);
        if (problem) throw new Error(problem);

        const signed = await createUploadUrlAction({ fileName: file.name, mimeType: file.type, size: file.size });
        if (!signed.ok || !signed.data) throw new Error(signed.ok ? "Upload failed." : signed.error);

        const { error } = await getBrowserSupabase()
          .storage.from(MEDIA_BUCKET)
          .uploadToSignedUrl(signed.data.path, signed.data.token, file, {
            contentType: file.type,
            cacheControl: "31536000",
          });
        if (error) throw new Error(`${file.name}: upload failed.`);

        const dims = await readDimensions(file);
        const registered = await registerMediaAction({
          path: signed.data.path,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          ...dims,
          alt: "",
        });
        if (!registered.ok || !registered.data) throw new Error(registered.ok ? "Upload failed." : registered.error);
        done.push(registered.data);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : `${file.name}: upload failed.`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    return { uploaded: done, errors };
  }, []);

  return { upload, uploading: uploading > 0, pending: uploading };
}
