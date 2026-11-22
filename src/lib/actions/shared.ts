import "server-only";
import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CacheTag } from "@/lib/content/tags";

/**
 * Every admin mutation starts here: re-verify the admin (never trust the
 * client or the proxy), then hand back an RLS-bound client so the database
 * enforces the same rule a second time.
 */
export async function adminContext() {
  const user = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  return { user, supabase };
}

/** Expire public cache entries so visitors see the change on their next request. */
export function expire(...tags: CacheTag[]) {
  for (const tag of new Set(tags)) updateTag(tag);
}
