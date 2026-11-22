import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, assertSupabaseConfigured } from "./env";

let client: SupabaseClient<Database> | null = null;

/**
 * Cookie-less client for public content. It never reads the request, so it is
 * safe inside `'use cache'` functions, and every query runs as `anon` under RLS:
 * drafts, enquiries and private settings are unreachable through it.
 */
export function getPublicSupabase() {
  assertSupabaseConfigured();
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        // Caching is owned by the tagged 'use cache' functions in
        // lib/content/queries.ts. Without no-store, Next.js would also keep the
        // raw HTTP responses in its (untagged) fetch cache, so updateTag() would
        // re-run the function but receive stale rows for up to 15 minutes.
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    });
  }
  return client;
}
