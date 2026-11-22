# Surface protection project portfolio

A premium, editorial project-portfolio website for a surface-protection
business (kitchen worktops, countertops, cabinetry, interior surfaces), with a
secure CMS so the owner can run the whole site without a developer.

It is **not** a shop: there is no cart, checkout, payments, orders or customer accounts.

- **Public site**: `/`, `/projects`, `/projects/[slug]`, `/about`, `/contact`
- **CMS**: `/admin` (projects, categories, homepage builder, media library,
  pages, enquiries, settings)
- **Stack**: Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4,
  shadcn/ui, Supabase (Postgres, Auth, Storage) via `@supabase/ssr`,
  React Hook Form, Zod, Embla Carousel, Motion, Sonner, Resend

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the design decisions, data
flow and security model.

---

## 1. Prerequisites

- Node.js 20.9+ (developed on 22)
- A Supabase project (free tier is fine). Docker is only needed if you want a
  local Supabase stack.
- Optional: a [Resend](https://resend.com) account for enquiry emails

## 2. Setup

```bash
npm install
```

### Option A: fully local (no Supabase account)

Runs Postgres, Auth, Storage and the REST API in Docker on your machine via the
Supabase CLI. Needs Docker Desktop running. The first start downloads the
container images once (about 1–1.5 GB).

```bash
npm run local:start     # lean stack: db, auth, storage, REST, gateway (no Studio)
npm run local:env       # writes .env.local with the local URL and keys
npm run admin:create    # admin@example.com / ChangeMe-Local-2026 (change at first sign-in)
npm run dev             # http://localhost:3000, CMS at /admin/login
```

- Migrations, `seed.sql` **and** the demo projects (`demo.sql`) are applied
  automatically on start.
- `npm run local:reset` wipes the local database and re-applies migrations and seeds.
  Re-run `npm run admin:create` afterwards.
- `npm run local:start:studio` also starts Supabase Studio (table browser at
  http://127.0.0.1:54323).
- `npm run local:stop` stops the containers (data is kept).
- Plain Postgres alone is not enough: the app uses Supabase Auth (admin login),
  Storage (media) and the REST API, which this stack provides.

### Option B: hosted Supabase project

```bash
cp .env.example .env.local     # then fill in the values (section 3)
```

### Apply the database

The schema, RLS policies, storage bucket and rate limiter are plain SQL migrations in
`supabase/migrations`. With the Supabase CLI (installed as a dev dependency):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npm run db:push            # applies supabase/migrations
```

Then load the baseline content (settings, pages and a starter homepage): run
`supabase/seed/seed.sql` in the Supabase SQL editor.

> Avoid `supabase db push --include-seed` against production: `config.toml`
> lists `demo.sql` as a seed for local development.

Optional demo content (6 projects, 4 categories, imagery from images.unsplash.com),
useful for previews: run `supabase/seed/demo.sql` in the SQL editor as well.
Delete or replace the demo items from the dashboard before launch.

> Without the CLI, run the files in `supabase/migrations` (in order) and then
> `supabase/seed/seed.sql` in the Supabase SQL editor.

### Configure Supabase Auth

In the Supabase dashboard → **Authentication**:

1. **Sign In / Providers → Email**: keep Email enabled.
2. **Sign In / Providers → User Signups**: turn off **Allow new users to sign up**.
   There is no public registration.
3. **Password settings**: minimum length 12, require lower/upper case and digits.
4. **URL Configuration → Site URL**: your production URL.

`supabase/config.toml` already applies the same rules to a local stack.

### Create the Super Admin

```bash
# .env.local must contain NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
# ADMIN_EMAIL and ADMIN_PASSWORD (temporary, ≥12 chars, mixed case + digit)
npm run admin:create
```

The script:

- creates the user with the Auth Admin API (email pre-confirmed), or updates it if it
  already exists (never duplicates)
- sets the trusted `app_metadata.role = "admin"`. `user_metadata` is never used for
  authorisation.
- sets `app_metadata.must_change_password = true`, so the first sign-in at
  `/admin/login` forces a password change at `/admin/account/password`
- creates or synchronises the `profiles` row with role `admin`
- never prints the password and never runs on application start

Afterwards, remove `ADMIN_PASSWORD` from the environment. To issue a new temporary
password later: `npm run admin:create -- --reset`.

### Run

```bash
npm run dev        # http://localhost:3000, CMS at /admin
```

If Supabase is not configured, the public site still builds and renders
graceful empty states. The CMS explains what is missing.

## 3. Environment variables

| Variable | Required | Where it is used |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Browser + server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Browser + server (RLS-limited publishable/anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **Server only**: contact inserts, rate limiting, clearing the forced password-change flag, admin bootstrap |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | bootstrap only | `npm run admin:create` |
| `RESEND_API_KEY` | optional | Enquiry email notifications |
| `CONTACT_EMAIL` | optional | Fallback notification recipient(s), comma-separated. The owner normally sets these in CMS → Settings → Notifications, which takes precedence. |
| `RESEND_FROM_EMAIL` | optional | Verified sender, e.g. `Website <enquiries@yourdomain.com>` |
| `WHATSAPP_PHONE` | optional | Fallback if no WhatsApp number is set in Settings → Contact |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical URLs, sitemap, Open Graph (otherwise the SEO setting or Vercel URL) |
| `RATE_LIMIT_SALT` | optional | Salt for hashing client IPs (defaults to a server secret) |

Secrets are only read in modules marked `server-only`; importing them from client
code fails the build.

## 4. Using the CMS

| Area | What the owner can do |
| --- | --- |
| **Projects** | Create, edit, delete; save drafts; publish/unpublish; feature; reorder; assign a category; cover image; installation gallery (alt text and captions); flexible sections (text, gallery, full-width image, image + text, before/after, video, specifications, quote); SEO fields |
| **Categories** | Add new applications or film types at any time; cover image, description, order, show/hide. Menus, filters and the homepage update automatically. |
| **Homepage** | Predefined sections (hero with image or video, featured projects, category showcase, image + text, campaign banner, video, before/after, company intro, enquiry CTA). Add, remove, reorder, show/hide. Edits are saved as **drafts**; use **Preview** to see them on the page, then **Publish**. |
| **Media** | Upload images and videos (drag and drop), search, edit alt text, see where each file is used, delete unused files. Uploads go straight to Supabase Storage via signed URLs. |
| **Pages** | About (hero, introduction, story, expertise, process, values, imagery, CTA), Projects intro and project-page CTA, Contact copy; SEO and publish state |
| **Enquiries** | Inbox with read/unread/archive, reply by email, call, delete |
| **Settings** | Brand name, logos, **accent colour**, contact details, WhatsApp, social links, footer, SEO defaults, navigation, and **Notifications** (which inboxes receive new enquiries; private, never shown on the site) |

Changes appear on the public site on the next request (cache tags are expired
on every save).

## 5. Quality checks

```bash
npm run lint
npm run typecheck          # tsc --noEmit
npm run test:db            # migrations + seeds + RLS/security tests in PGlite
npm run build
npm run check              # all of the above
```

`npm run test:db` runs the real migrations and seeds in an in-process Postgres
(PGlite) with stand-ins for Supabase's `auth`/`storage` schemas, then verifies
the security model as anonymous visitor, signed-in non-admin, a user with a forged
admin claim but no admin profile, the admin, and the service role (65 checks). It
also validates that all seeded JSON content matches the app's Zod schemas.

## 6. Deployment (Vercel)

1. Push the repository and import it in Vercel.
2. Add the environment variables from section 3 (Production and Preview).
   Set `NEXT_PUBLIC_SITE_URL` to the production domain.
3. Make sure the database is migrated and seeded (section 2) **before** the
   first build: pages are prerendered from Supabase at build time.
4. Deploy. Then create the admin (`npm run admin:create`) if not done yet, sign in
   at `/admin/login` and change the temporary password.
5. In Supabase → Authentication → URL Configuration, set the Site URL to the production domain.

Other Node hosts work with `npm run build && npm start`. On serverless
platforms the in-memory `use cache` store is per-instance. Content is still
correct (prerendered shells plus tag invalidation), but see the Next.js
`cacheHandlers` docs if you want a shared cache.

### Production checklist

- [ ] Sign-ups disabled in Supabase Auth; password policy set
- [ ] Super Admin created, temporary password changed, `ADMIN_PASSWORD` removed
- [ ] Brand, contact, WhatsApp, social, SEO and Site URL filled in under Settings
- [ ] Demo content (if loaded) replaced
- [ ] `RESEND_API_KEY` and `RESEND_FROM_EMAIL` set, sender domain verified in Resend
- [ ] Enquiry recipients set in CMS → Settings → Notifications (or `CONTACT_EMAIL`)
- [ ] Custom domain with HTTPS (HSTS is sent by default)

## 7. Project structure

```
src/
  app/(public)/            public pages + shared header/footer layout
  app/admin/login          sign-in
  app/admin/account/       password change (forced on first sign-in)
  app/admin/(dashboard)/   CMS pages
  app/admin/homepage/preview  draft preview
  app/api/contact          enquiry endpoint
  components/{layout,homepage,projects,shared,forms}  public UI
  components/{admin,media}                            CMS UI
  components/ui            shadcn/ui primitives
  config/                  media rules, CMS field descriptors
  lib/supabase             client factories (public, server, browser, admin, proxy)
  lib/auth                 data-access layer (requireAdmin) + auth actions
  lib/actions              Server Actions per domain
  lib/content              cached public readers, admin readers, media helpers
  lib/validations          Zod schemas (source of truth for all JSONB content)
  lib/utils                formatting, WhatsApp, rate limiting, site URL
  proxy.ts                 session refresh + optimistic /admin redirect
supabase/migrations        schema, RLS, storage, rate limiting
supabase/seed              baseline (seed.sql) and optional demo (demo.sql)
scripts/                   create-super-admin.ts, test-database.ts
```

## 8. Extending

- **New project category or film type**: add it under CMS → Categories. No code change.
- **New homepage or case-study section type**: add a Zod schema in
  `src/lib/validations/sections.ts`, a field descriptor in `src/config/fields.ts`,
  a renderer component, and the type name to the `check` constraint in a new migration.
- **Brand accent**: CMS → Settings → Brand. All other design tokens live in
  `src/app/globals.css`.
