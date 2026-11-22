/**
 * Database test suite. Runs the real migrations and seeds inside PGlite
 * (in-process Postgres) with minimal stand-ins for Supabase's `auth` and
 * `storage` schemas and API roles, then verifies the RLS security model.
 *
 *   npm run test:db
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = process.cwd();
let failures = 0;
let passes = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passes++;
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}${detail !== undefined ? `\n      → ${JSON.stringify(detail)}` : ""}`);
  }
}

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(auth.jwt() ->> 'sub', '')::uuid
  $$;
  create function auth.role() returns text language sql stable as $$
    select auth.jwt() ->> 'role'
  $$;

  create schema storage;
  create table storage.buckets (
    id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(), bucket_id text, name text
  );
  alter table storage.objects enable row level security;

  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
  grant all on all tables in schema storage to anon, authenticated, service_role;
  -- Supabase grants table privileges on public to the API roles by default.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

const ADMIN = "11111111-1111-1111-1111-111111111111";
const VIEWER = "22222222-2222-2222-2222-222222222222";
const HALF_ADMIN = "33333333-3333-3333-3333-333333333333";

async function asRole(db: PGlite, role: "anon" | "authenticated" | "service_role", claims: Record<string, unknown> = {}) {
  await db.exec(`reset role;`);
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ role, ...claims })]);
  await db.exec(`set role ${role};`);
}

async function rows(db: PGlite, sql: string, params: unknown[] = []) {
  const res = await db.query(sql, params);
  return res.rows as Record<string, unknown>[];
}

async function fails(db: PGlite, sql: string) {
  try {
    await db.exec(sql);
    return false;
  } catch {
    return true;
  }
}

async function main() {
  const db = new PGlite();
  await db.exec(SUPABASE_STUBS);

  console.log("\nMigrations");
  const migrationsDir = join(root, "supabase", "migrations");
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
    try {
      await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
      check(`applies ${file}`, true);
    } catch (e) {
      check(`applies ${file}`, false, e instanceof Error ? e.message : e);
      throw e;
    }
  }

  console.log("\nSeeds");
  for (const file of ["seed.sql", "demo.sql", "seed.sql", "demo.sql"]) {
    try {
      await db.exec(readFileSync(join(root, "supabase", "seed", file), "utf8"));
      check(`runs ${file} (idempotent)`, true);
    } catch (e) {
      check(`runs ${file}`, false, e instanceof Error ? e.message : e);
    }
  }
  const [{ count: projectCount }] = await rows(db, `select count(*)::int as count from public.projects`);
  check("demo inserted 6 projects exactly once", projectCount === 6, projectCount);
  const [{ count: homeCount }] = await rows(db, `select count(*)::int as count from public.homepage_sections`);
  check("starter homepage inserted once", homeCount === 7, homeCount);

  // Fixtures (as the migration owner).
  await db.exec(`
    insert into auth.users (id, email) values
      ('${ADMIN}', 'admin@example.com'), ('${VIEWER}', 'viewer@example.com'), ('${HALF_ADMIN}', 'half@example.com');
    insert into public.profiles (id, role) values ('${ADMIN}', 'admin'), ('${VIEWER}', 'viewer'), ('${HALF_ADMIN}', 'viewer');
    insert into public.projects (title, slug, status) values ('Secret draft', 'secret-draft', 'draft');
    insert into public.project_sections (project_id, section_type, content)
      select id, 'text', '{"body":"draft section"}' from public.projects where slug = 'secret-draft';
    insert into public.project_categories (name, slug, is_active) values ('Hidden category', 'hidden-category', false);
    insert into public.inquiries (name, email, message) values ('Jane', 'jane@example.com', 'Hello there');
    insert into public.site_settings (key, value, is_public) values ('notifications', '{"enquiryEmails":"owner@example.com"}', false);
    insert into public.homepage_section_drafts (section_id, content, settings)
      select id, '{"heading":"unpublished"}', '{}' from public.homepage_sections limit 1;
    update public.homepage_sections set is_enabled = false where section_type = 'enquiry_cta';
  `);

  console.log("\nSeeded content matches the application schemas");
  const { parseHomepageSection, parseProjectSectionContent } = await import("../src/lib/validations/sections");
  const { pageContentSchemas } = await import("../src/lib/validations/pages");
  const { siteSettingSchemas } = await import("../src/lib/validations/settings");
  for (const s of await rows(db, `select section_type, content, settings from public.homepage_sections order by display_order`)) {
    const r = parseHomepageSection(s.section_type as never, s.content, s.settings);
    check(`homepage ${s.section_type}`, r.content.success && r.settings.success, r.content.error?.issues ?? r.settings.error?.issues);
  }
  const sectionRows = await rows(db, `select section_type, content from public.project_sections`);
  const badSections = sectionRows.filter((s) => !parseProjectSectionContent(s.section_type as never, s.content).success);
  check(`all ${sectionRows.length} project sections`, badSections.length === 0, badSections);
  for (const p of await rows(db, `select page_key, content from public.pages`)) {
    const r = pageContentSchemas[p.page_key as keyof typeof pageContentSchemas].safeParse(p.content);
    check(`page ${p.page_key}`, r.success, r.error?.issues);
  }
  // Application keys only (includes the private notifications fixture above).
  for (const s of await rows(db, `select key, value from public.site_settings where key = any($1)`, [Object.keys(siteSettingSchemas)])) {
    const schema = siteSettingSchemas[s.key as keyof typeof siteSettingSchemas];
    const r = schema.safeParse(s.value);
    check(`setting ${s.key}`, r.success, r.error?.issues);
  }
  const emails = siteSettingSchemas.notifications.shape.enquiryEmails;
  check("notification emails are normalised", emails.parse(" A@x.io; b@y.io ,a@x.io ") === "a@x.io, b@y.io");
  check("invalid notification emails are rejected", !emails.safeParse("owner@example.com, not-an-email").success);

  const [{ published_at }] = await rows(db, `select published_at from public.projects where slug = 'marble-island-kensington'`);
  check("published_at is stamped on publish", published_at !== null);

  /* ------------------------------ anon ------------------------------- */
  console.log("\nAnonymous visitor");
  await asRole(db, "anon");
  const anonProjects = await rows(db, `select slug, status from public.projects`);
  check("sees only published projects", anonProjects.length === 6 && anonProjects.every((p) => p.status === "published"), anonProjects.length);
  check("cannot see sections of draft projects", (await rows(db, `select 1 from public.project_sections s join public.projects p on p.id = s.project_id where p.slug = 'secret-draft'`)).length === 0);
  check("sees only active categories", (await rows(db, `select 1 from public.project_categories where slug = 'hidden-category'`)).length === 0);
  check("cannot read enquiries", (await rows(db, `select * from public.inquiries`)).length === 0);
  check("cannot insert enquiries directly", await fails(db, `insert into public.inquiries (name, email, message) values ('x','x@x.io','spam')`));
  check("cannot read homepage drafts", (await rows(db, `select * from public.homepage_section_drafts`)).length === 0);
  check("cannot read hidden homepage sections", (await rows(db, `select 1 from public.homepage_sections where section_type = 'enquiry_cta'`)).length === 0);
  check("cannot read private settings", (await rows(db, `select 1 from public.site_settings where key = 'notifications'`)).length === 0);
  check("can read public settings", (await rows(db, `select 1 from public.site_settings where key = 'brand'`)).length === 1);
  check("cannot read media library rows", (await rows(db, `select * from public.media_assets`)).length === 0);
  await db.exec(`update public.projects set title = 'hacked'`);
  await db.exec(`delete from public.project_categories`);
  check("cannot insert projects", await fails(db, `insert into public.projects (title, slug) values ('x', 'x')`));
  check("cannot call the rate limiter", await fails(db, `select public.check_rate_limit('k', 5, 60)`));
  check("cannot upload to storage", await fails(db, `insert into storage.objects (bucket_id, name) values ('media', 'x.jpg')`));
  check("cannot read the private schema", await fails(db, `select * from private.rate_limits`));

  /* ------------------- authenticated, not admin ---------------------- */
  console.log("\nSigned-in non-admin");
  await asRole(db, "authenticated", { sub: VIEWER, app_metadata: {}, user_metadata: { role: "admin" } });
  check("user_metadata.role = admin grants nothing", (await rows(db, `select * from public.inquiries`)).length === 0);
  check("is_admin() is false", (await rows(db, `select public.is_admin() as a`))[0].a === false);
  check("cannot escalate own profile role", await fails(db, `update public.profiles set role = 'admin' where id = '${VIEWER}'`) ||
    (await rows(db, `select role from public.profiles where id = '${VIEWER}'`))[0]?.role === "viewer");
  check("cannot create a profile", await fails(db, `insert into public.profiles (id, role) values ('${HALF_ADMIN}', 'admin')`));
  check("sees own profile only", (await rows(db, `select id from public.profiles`)).length === 1);

  console.log("\nJWT admin claim without admin profile");
  await asRole(db, "authenticated", { sub: HALF_ADMIN, app_metadata: { role: "admin" } });
  check("is_admin() requires the profile role too", (await rows(db, `select public.is_admin() as a`))[0].a === false);
  check("cannot read enquiries", (await rows(db, `select * from public.inquiries`)).length === 0);

  /* ------------------------------ admin ------------------------------ */
  console.log("\nAdmin");
  await asRole(db, "authenticated", { sub: ADMIN, app_metadata: { role: "admin" } });
  check("is_admin() is true", (await rows(db, `select public.is_admin() as a`))[0].a === true);
  check("sees drafts", (await rows(db, `select 1 from public.projects where slug = 'secret-draft'`)).length === 1);
  check("reads enquiries", (await rows(db, `select 1 from public.inquiries`)).length === 1);
  check("reads homepage drafts", (await rows(db, `select 1 from public.homepage_section_drafts`)).length === 1);
  check("reads private settings", (await rows(db, `select 1 from public.site_settings where key = 'notifications'`)).length === 1);
  check("creates a category", !(await fails(db, `insert into public.project_categories (name, slug) values ('New film', 'new-film')`)));
  check("updates enquiry status", (await db.query(`update public.inquiries set status = 'read'`)).affectedRows === 1);
  check("uploads to the media bucket", !(await fails(db, `insert into storage.objects (bucket_id, name) values ('media', 'uploads/a.jpg')`)));
  check("cannot write to other buckets", await fails(db, `insert into storage.objects (bucket_id, name) values ('other', 'a.jpg')`));
  check("cannot change profile roles via the API", await fails(db, `update public.profiles set role = 'viewer' where id = '${ADMIN}'`) ||
    (await rows(db, `select role from public.profiles where id = '${ADMIN}'`))[0]?.role === "admin");
  check("slug format is enforced", await fails(db, `insert into public.projects (title, slug) values ('x', 'Bad Slug!')`));
  check("JSONB must be an object", await fails(db, `insert into public.homepage_sections (section_type, content) values ('hero', '[]')`));
  check("unknown section types are rejected", await fails(db, `insert into public.homepage_sections (section_type) values ('carousel_of_doom')`));

  /* -------------------------- anon re-check -------------------------- */
  await asRole(db, "anon");
  check("anon writes earlier changed nothing", (await rows(db, `select 1 from public.projects where title = 'hacked'`)).length === 0);

  /* ---------------------------- service ------------------------------ */
  console.log("\nService role (server-side only)");
  await asRole(db, "service_role");
  const limits = [];
  for (let i = 0; i < 3; i++) limits.push((await rows(db, `select public.check_rate_limit('test:key', 2, 60) as ok`))[0].ok);
  check("rate limiter allows 2 then blocks", JSON.stringify(limits) === "[true,true,false]", limits);
  check("can insert enquiries (contact API path)", !(await fails(db, `insert into public.inquiries (name, email, message) values ('Bob', 'bob@example.com', 'Hi')`)));

  await db.exec(`reset role;`);
  await db.close();

  console.log(`\n${passes} passed, ${failures} failed\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
