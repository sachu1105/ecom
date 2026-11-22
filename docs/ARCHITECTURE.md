# Architecture

A project-portfolio and case-study platform for a surface-protection business.
Public site + secure CMS in one Next.js application, backed by Supabase.
There is deliberately **no** e-commerce: no cart, checkout, payments, orders or
customer accounts.

## 1. Runtime topology

```
Browser ──► Next.js 16 (App Router, Cache Components, Partial Prefetching)
              │
              ├─ Public routes  (/ /projects /projects/[slug] /about /contact)
              │     Server Components → cached content layer ('use cache' + cacheTag)
              │     → cookie-less Supabase client (publishable key, RLS = anon)
              │
              ├─ Admin routes   (/admin/**)
              │     proxy.ts refreshes the Supabase session cookie (optimistic gate)
              │     requireAdmin() in every page, Server Action and Route Handler (real gate)
              │     → cookie-bound Supabase client (RLS = authenticated admin)
              │
              ├─ POST /api/contact
              │     Zod → honeypot/timing → DB-backed rate limit → insert (service role)
              │     → Resend notification (optional)
              │
              └─ Media uploads
                    Server Action authorises + validates type/size, issues a signed
                    upload URL → browser uploads straight to Supabase Storage
                    → Server Action records the asset row.
                    Bucket limits + storage RLS enforce the same rules again.

Supabase: Postgres (RLS on every table) · Auth (email/password, no sign-ups) · Storage (`media` bucket)
```

No separate backend service exists. Server Actions and Route Handlers are the
only code paths that mutate data.

## 2. Rendering and caching

`cacheComponents: true` is enabled, which changes the rules compared with
older Next.js versions:

| Concern | Approach |
| --- | --- |
| Public content | `src/lib/content/queries.ts`. Every reader is a `'use cache'` function with `cacheLife('hours')` and a `cacheTag`. It uses a **cookie-less** Supabase client, so the result is identical for all visitors and lands in the prerendered static shell. |
| Raw fetches | The public Supabase client fetches with `cache: "no-store"`. Without it, Next.js would also keep the HTTP responses in its untagged fetch cache, and `updateTag()` would re-run the function only to receive stale rows for up to 15 minutes. Caching belongs to the tagged `'use cache'` layer alone. |
| Invalidation | Every admin mutation calls `updateTag()` for the affected tags (`projects`, `categories`, `homepage`, `pages`, `settings`, `media`). Visitors see the change on their next request. The hourly lifetime is only a safety net for edits made directly in the Supabase dashboard. |
| Request data | `searchParams` (project filters), `params` (project slug) and `cookies()` (admin session) are read **inside `<Suspense>`** so the static shell still renders. |
| Dynamic params | `/projects/[slug]` uses `generateStaticParams` with the published slugs. Cache Components requires at least one entry, so a placeholder is returned when there are no projects yet. |
| Admin data | Never cached. Read through the cookie-bound client under RLS, behind Suspense. |

## 3. Security model

Defence in depth, with each layer able to stand alone:

1. **Postgres RLS** on every table. `public.is_admin()` requires **both** the
   trusted JWT claim `app_metadata.role = 'admin'` and a matching
   `profiles.role = 'admin'` row. `user_metadata` is never consulted. Changing
   the profile row revokes access immediately, even with an unexpired JWT.
2. **Server-side authorisation**: `requireAdmin()` (`src/lib/auth/dal.ts`)
   verifies the user with the Auth server (`getUser()`, not a cookie decode)
   and checks the same two conditions. It runs in every admin page, Server
   Action and protected Route Handler.
3. **proxy.ts** refreshes sessions and redirects anonymous visitors away from
   `/admin`. It is a UX convenience, never the security boundary.
4. **Service-role key** lives only in `src/lib/supabase/admin.ts` (marked
   `server-only`). It is used for exactly three things: contact-form inserts,
   rate-limit bookkeeping and clearing the `must_change_password` flag.
5. **Storage**: the `media` bucket enforces a MIME allow-list and size limit;
   storage RLS allows writes for admins only. Upload paths are generated on
   the server, never chosen by the client.
6. **Input**: every mutation is parsed with Zod on the server. JSONB content
   is validated against per-section-type schemas before it is written.
   Rich text is stored as plain text and rendered as text nodes. There is no
   `dangerouslySetInnerHTML` of user content, so stored XSS is not possible.
   Email HTML is escaped.
7. **Abuse**: the contact form and admin login go through a Postgres-backed
   sliding-window rate limiter (`private.check_rate_limit`), keyed by a
   salted SHA-256 hash of the client IP. Raw IPs are never stored. The contact
   form also uses a honeypot and a minimum fill time.
8. **Headers**: CSP-adjacent hardening headers (`X-Frame-Options`,
   `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are set
   in `next.config.ts`; admin responses are `Cache-Control: private, no-store`.

No public registration exists. Disable "Allow new users to sign up" in
Supabase Auth. The only account is created by `scripts/create-super-admin.ts`.

## 4. Content model

Everything the visitor sees is data. Nothing about the client's categories,
projects, copy or brand is hard-coded.

| Table | Purpose |
| --- | --- |
| `profiles` | Role per auth user (`admin`). |
| `project_categories` | Admin-defined categories/applications. New film types or services need no code change. |
| `projects` | Case studies (`draft`/`published`, featured flag, ordering, SEO). |
| `project_media` | Installation photographs (the project's main gallery). |
| `project_sections` | Flexible case-study blocks: `text`, `gallery`, `full_image`, `image_text`, `before_after`, `video`, `specifications`, `quote`. |
| `homepage_sections` | Live homepage blocks: `hero`, `featured_projects`, `category_showcase`, `image_text`, `campaign_banner`, `video`, `before_after`, `intro`, `enquiry_cta`. |
| `homepage_section_drafts` | Unpublished edits (admin-only). Preview renders live + drafts; *Publish* promotes them. |
| `pages` | Structured page content (`about`, `projects`, `contact`). |
| `site_settings` | Key/value JSONB: `brand`, `contact`, `social`, `footer`, `seo`, `navigation`. `is_public` gates anonymous reads. |
| `media_assets` | Media library: storage path, MIME, size, dimensions, alt text. |
| `inquiries` | Contact-form submissions (admin-only). |
| `private.rate_limits` | Rate-limit counters. Not exposed through the API. |

**Media references** inside JSONB are `{ "path": string, "alt"?: string }`.
`path` is a storage key in the `media` bucket, or an absolute URL on an
allow-listed host (used by the optional demo seed). `resolveMediaUrl()` turns
it into a public URL.

**Section schemas** live in one place per domain:

- `src/lib/validations/sections.ts`: Zod schemas, the server-side source of truth.
- `src/config/section-fields.ts`: field descriptors that drive the generic
  admin editor (`src/components/admin/fields`).

Adding a new section type means adding a schema, a field descriptor and a
renderer, and nothing else.

## 5. Source layout

```
src/
  app/
    (public)/            public site (shared header/footer layout)
    admin/login          sign-in (outside the protected layout)
    admin/(dashboard)/   protected CMS
    api/contact          enquiry endpoint
    sitemap.ts robots.ts
  components/
    layout/ homepage/ projects/ shared/ forms/   public UI
    admin/ media/                                 CMS UI
    ui/                                           shadcn/ui primitives
  lib/
    supabase/   client factories (public, server, browser, admin, proxy)
    auth/       data-access layer + auth actions
    actions/    Server Actions per domain (all call requireAdmin first)
    content/    cached public readers, admin readers, media URL helpers
    validations/ Zod schemas
    utils/      slug, whatsapp, rate limit, formatting
  config/       section field descriptors, upload limits, constants
  types/        database row types
proxy.ts        session refresh + optimistic admin redirect (src/proxy.ts)
supabase/migrations  schema, RLS, storage, rate limiting
supabase/seed        baseline content (+ optional demo projects)
scripts/create-super-admin.ts
```

## 6. Design system

- Light theme only. Tokens are defined once in `src/app/globals.css`
  (`--color-*`, type scale, spacing, motion) and mapped to Tailwind and to
  shadcn/ui's variables.
- Poppins via `next/font` (self-hosted at build time).
- The brand accent is a site setting. It is injected as `--brand` /
  `--brand-foreground` at the top of the public layout, with the foreground
  colour computed for contrast.
- Entrance animations are CSS-only (`.reveal` uses scroll-driven animations,
  `.reveal-load` animates on load). Content is visible by default and never
  depends on JavaScript or hydration. Reduced-motion preferences are respected.
  Motion is used only for the header menus.
- Public UI is image-first and editorial: full-bleed photography, bold
  uppercase display type, pill buttons, sharp-cornered imagery, minimal
  borders and almost no shadows. The admin uses the same tokens with denser
  shadcn/ui components.
