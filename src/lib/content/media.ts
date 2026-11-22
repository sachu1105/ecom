import { MEDIA_BUCKET } from "@/config/media";
import { SUPABASE_URL } from "@/lib/supabase/env";

/** Converts a stored media reference into a public URL (isomorphic). */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("https://")) return path;
  if (!SUPABASE_URL) return null;
  const encoded = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${encoded}`;
}
