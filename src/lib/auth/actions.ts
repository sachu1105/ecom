"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loginSchema, passwordChangeSchema } from "@/lib/validations/forms";
import { fieldErrors } from "@/lib/validations/common";
import { clientIpFrom, rateLimit } from "@/lib/utils/rate-limit";
import { requireAdmin } from "./dal";

export type AuthFormState = { error?: string; fieldErrors?: Record<string, string>; email?: string } | undefined;

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  // Only allow internal admin paths: blocks open redirects such as //evil.com.
  return /^\/admin(\/[A-Za-z0-9\-_/]*)?$/.test(next) && !next.startsWith("/admin/login") ? next : "/admin";
}

const GENERIC_LOGIN_ERROR = "Incorrect email or password.";

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured for this deployment." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")).slice(0, 254) : "";
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), email };

  const ip = clientIpFrom(await headers());
  const [ipOk, accountOk] = await Promise.all([
    rateLimit({ scope: "login:ip", identifier: ip, limit: 10, windowSeconds: 900 }),
    rateLimit({ scope: "login:account", identifier: parsed.data.email.toLowerCase(), limit: 5, windowSeconds: 900 }),
  ]);
  if (!ipOk || !accountOk) {
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again.", email };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: GENERIC_LOGIN_ERROR, email };

  // Valid credentials but not an admin: end the session and give the same answer.
  if (data.user.app_metadata?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: GENERIC_LOGIN_ERROR, email };
  }

  if (data.user.app_metadata?.must_change_password === true) {
    redirect("/admin/account/password");
  }
  redirect(safeNext(formData.get("next")));
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

export async function changePasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await requireAdmin({ allowPasswordChange: true });

  const parsed = passwordChangeSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const ip = clientIpFrom(await headers());
  if (!(await rateLimit({ scope: "password", identifier: `${user.id}:${ip}`, limit: 5, windowSeconds: 900 }))) {
    return { error: "Too many attempts. Please wait a few minutes." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "Choose a password different from the current one."
          : error.code === "weak_password"
            ? "That password is too weak. Try a longer passphrase."
            : "Could not update the password. Please try again.",
    };
  }

  // Clear the forced-change flag (trusted app_metadata needs the service role).
  if (user.mustChangePassword) {
    const admin = getServiceSupabase();
    if (!admin) return { error: "Password updated, but SUPABASE_SERVICE_ROLE_KEY is missing to finish setup." };
    const { data: current } = await admin.auth.admin.getUserById(user.id);
    const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...(current.user?.app_metadata ?? {}), role: "admin", must_change_password: false },
    });
    if (metaError) return { error: "Password updated, but the account flag could not be cleared." };
    // Refresh so the session JWT carries the updated app_metadata.
    await supabase.auth.refreshSession();
  }

  redirect("/admin?password=updated");
}
