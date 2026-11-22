import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AdminUser = {
  id: string;
  email: string;
  mustChangePassword: boolean;
};

/**
 * Data Access Layer: the single place that decides who is an admin.
 *
 *  - `getUser()` validates the session with the Supabase Auth server (not just
 *    a local cookie decode), so revoked or expired sessions are rejected.
 *  - The role comes from `app_metadata` (only writable with the service role),
 *    never from user-editable `user_metadata`.
 *  - The profile row must also say `admin` (matches the RLS helper is_admin()).
 *
 * Memoised per request with React.cache.
 */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  if (user.app_metadata?.role !== "admin") return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return null;

  return {
    id: user.id,
    email: user.email ?? "",
    mustChangePassword: user.app_metadata?.must_change_password === true,
  };
});

/**
 * Guards admin pages and Server Actions. Unauthenticated users are sent to the
 * login page; admins with a temporary password are sent to change it first.
 */
export async function requireAdmin(options: { allowPasswordChange?: boolean } = {}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  if (user.mustChangePassword && !options.allowPasswordChange) redirect("/admin/account/password");
  return user;
}
