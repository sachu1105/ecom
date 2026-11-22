/**
 * Super Admin bootstrap. Run manually, never on application start:
 *
 *   npm run admin:create                 # create or sync the admin from env
 *   npm run admin:create -- --reset      # also set a new temporary password
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL and
 * ADMIN_PASSWORD from .env.local / .env (or the process environment).
 *
 * - Creates the Auth user with the Admin API (email pre-confirmed).
 * - Sets the trusted app_metadata.role = "admin" (never user_metadata).
 * - Flags app_metadata.must_change_password = true, so the first sign-in is
 *   forced through /admin/account/password.
 * - Creates or synchronises the profiles row with role "admin".
 * - Idempotent: an existing user is updated, never duplicated.
 * - Never prints the password.
 */
import { config } from "dotenv";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

config({ path: [".env.local", ".env"], quiet: true });

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) fail(`${name} is not set. Add it to .env.local (see .env.example).`);
  return value;
}

function checkPassword(password: string) {
  const problems: string[] = [];
  if (password.length < 12) problems.push("at least 12 characters");
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) problems.push("upper- and lower-case letters");
  if (!/\d/.test(password)) problems.push("a number");
  if (problems.length) fail(`ADMIN_PASSWORD must contain ${problems.join(", ")}.`);
}

async function findUserByEmail(admin: SupabaseClient<Database>, email: string): Promise<User | null> {
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) fail(`Could not list users: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < perPage) return null;
  }
  return null;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const email = requireEnv("ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("ADMIN_PASSWORD");
  const reset = process.argv.includes("--reset");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("ADMIN_EMAIL is not a valid email address.");
  checkPassword(password);

  const admin = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  console.log(`→ Provisioning Super Admin ${email}`);
  let user = await findUserByEmail(admin, email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "admin", must_change_password: true },
    });
    if (error || !data.user) fail(`Could not create the user: ${error?.message ?? "unknown error"}`);
    user = data.user;
    console.log("✓ Auth user created (temporary password from ADMIN_PASSWORD).");
  } else {
    const appMetadata: Record<string, unknown> = { ...(user.app_metadata ?? {}), role: "admin" };
    if (reset) appMetadata.must_change_password = true;
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: appMetadata,
      ...(reset ? { password } : {}),
    });
    if (error) fail(`Could not update the user: ${error.message}`);
    console.log(
      reset
        ? "✓ Existing user synchronised and password reset (change required at next sign-in)."
        : "✓ Existing user found; admin role synchronised (password unchanged, use --reset to set a new one).",
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: user.id, role: "admin" }, { onConflict: "id" });
  if (profileError) {
    fail(
      `Could not create the profile row: ${profileError.message}. Have the migrations been applied (npm run db:push)?`,
    );
  }
  console.log("✓ Profile synchronised with role 'admin'.");
  console.log("\nNext: sign in at /admin/login. You will be asked to choose a new password.");
  console.log("Tip: remove ADMIN_PASSWORD from your environment once you have signed in.\n");
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
