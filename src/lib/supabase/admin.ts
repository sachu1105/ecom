import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { SUPABASE_URL } from "./env";

let client: SupabaseClient<Database> | null = null;

/**
 * Service-role client. BYPASSES RLS, so keep its use narrow:
 *   - inserting validated contact enquiries
 *   - rate-limit bookkeeping
 *   - clearing the must_change_password flag after a password change
 * `server-only` makes importing this module from client code a build error.
 */
export function getServiceSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) {
    return null;
  }
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}
