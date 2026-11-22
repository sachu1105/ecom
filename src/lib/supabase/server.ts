import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, assertSupabaseConfigured } from "./env";

/**
 * Cookie-bound client for the signed-in admin (Server Components, Server
 * Actions, Route Handlers). Queries run as `authenticated` under RLS.
 * Create a fresh client per request; never share it across requests.
 */
export async function createSupabaseServerClient() {
  assertSupabaseConfigured();
  // Session work (token expiry checks, refresh) uses the current time. With
  // Partial Prefetching, Next.js also prerenders per-session shells where
  // cookies() resolves, so opt out of prerendering explicitly: everything
  // below runs only at request time.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // proxy.ts refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
