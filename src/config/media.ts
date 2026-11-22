/**
 * Media rules shared by the client uploader, server actions and validation.
 * The Supabase bucket enforces the same MIME list and the global maximum
 * (supabase/migrations/20261116000300_storage.sql).
 */

export const MEDIA_BUCKET = "media";

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

export const ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES] as const;

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export const MIME_EXTENSIONS: Record<(typeof ALLOWED_MIME_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/**
 * External hosts that content may reference directly (used by the optional
 * demo seed). Keep in sync with `images.remotePatterns` in next.config.ts.
 */
export const EXTERNAL_MEDIA_HOSTS = ["images.unsplash.com"] as const;

export function isImageMime(mime: string) {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

export function isVideoMime(mime: string) {
  return (VIDEO_MIME_TYPES as readonly string[]).includes(mime);
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exp;
  return `${value.toFixed(value >= 10 || exp === 0 ? 0 : 1)} ${units[exp]}`;
}
