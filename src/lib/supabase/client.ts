"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser client, used only by the admin UI for direct-to-storage uploads with
 * server-issued signed upload URLs. Uses the publishable key exclusively.
 */
export function getBrowserSupabase() {
  if (!client) {
    client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
  return client;
}
