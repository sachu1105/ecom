-- =============================================================================
-- Core schema: tables, constraints, indexes, timestamp triggers.
-- Media binaries are never stored here: only Supabase Storage paths.
-- JSONB structure is validated in the application layer (Zod); the database
-- only guarantees each JSONB column holds an object.
-- =============================================================================

create schema if not exists private;

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: one row per auth user, holds the application role
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- project_categories: admin-defined, never hard-coded in the frontend
-- -----------------------------------------------------------------------------
create table public.project_categories (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 1 and 120),
  slug              text not null unique
                    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  description       text check (char_length(description) <= 2000),
  cover_image_path  text check (char_length(cover_image_path) <= 1024),
  is_active         boolean not null default true,
  display_order     integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index project_categories_active_order_idx
  on public.project_categories (is_active, display_order);

-- -----------------------------------------------------------------------------
-- projects: case studies
-- -----------------------------------------------------------------------------
create table public.projects (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null check (char_length(title) between 1 and 200),
  slug               text not null unique
                     check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 160),
  short_description  text check (char_length(short_description) <= 600),
  description        text check (char_length(description) <= 20000),
  category_id        uuid references public.project_categories (id) on delete set null,
  location           text check (char_length(location) <= 200),
  completion_date    date,
  application_type   text check (char_length(application_type) <= 200),
  material_used      text check (char_length(material_used) <= 200),
  cover_image_path   text check (char_length(cover_image_path) <= 1024),
  cover_image_alt    text check (char_length(cover_image_alt) <= 300),
  status             text not null default 'draft' check (status in ('draft', 'published')),
  is_featured        boolean not null default false,
  display_order      integer not null default 0,
  seo_title          text check (char_length(seo_title) <= 200),
  seo_description    text check (char_length(seo_description) <= 320),
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index projects_status_order_idx on public.projects (status, display_order);
create index projects_category_idx on public.projects (category_id);
create index projects_published_at_idx on public.projects (published_at desc);
create index projects_featured_idx on public.projects (display_order)
  where status = 'published' and is_featured;

-- Stamp published_at the first time a project is published.
create or replace function public.stamp_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger projects_stamp_published_at
  before insert or update of status on public.projects
  for each row execute function public.stamp_published_at();

-- -----------------------------------------------------------------------------
-- project_media: installation photographs / clips for a project
-- -----------------------------------------------------------------------------
create table public.project_media (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  media_type     text not null check (media_type in ('image', 'video')),
  storage_path   text not null check (char_length(storage_path) between 1 and 1024),
  alt_text       text check (char_length(alt_text) <= 300),
  caption        text check (char_length(caption) <= 500),
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

create index project_media_project_order_idx
  on public.project_media (project_id, display_order);

-- -----------------------------------------------------------------------------
-- project_sections: flexible case-study blocks
-- -----------------------------------------------------------------------------
create table public.project_sections (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  section_type   text not null check (section_type in (
                   'text', 'gallery', 'full_image', 'image_text',
                   'before_after', 'video', 'specifications', 'quote')),
  heading        text check (char_length(heading) <= 200),
  content        jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index project_sections_project_order_idx
  on public.project_sections (project_id, display_order);

-- -----------------------------------------------------------------------------
-- homepage_sections: predefined, orderable homepage blocks (live versions)
-- -----------------------------------------------------------------------------
create table public.homepage_sections (
  id             uuid primary key default gen_random_uuid(),
  section_type   text not null check (section_type in (
                   'hero', 'featured_projects', 'category_showcase', 'image_text',
                   'campaign_banner', 'video', 'before_after', 'intro', 'enquiry_cta')),
  title          text check (char_length(title) <= 200),
  content        jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  settings       jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  is_enabled     boolean not null default false,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index homepage_sections_enabled_order_idx
  on public.homepage_sections (is_enabled, display_order);

-- Unpublished edits. Kept in a separate admin-only table so drafts can never
-- leak through the public API.
create table public.homepage_section_drafts (
  section_id  uuid primary key references public.homepage_sections (id) on delete cascade,
  title       text check (char_length(title) <= 200),
  content     jsonb not null check (jsonb_typeof(content) = 'object'),
  settings    jsonb not null check (jsonb_typeof(settings) = 'object'),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- site_settings: key/value JSONB (brand, contact, social, footer, seo, navigation)
-- -----------------------------------------------------------------------------
create table public.site_settings (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique check (key ~ '^[a-z][a-z0-9_]{0,63}$'),
  value       jsonb not null default '{}'::jsonb check (jsonb_typeof(value) = 'object'),
  is_public   boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- pages: structured content for About / Projects / Contact pages
-- -----------------------------------------------------------------------------
create table public.pages (
  id               uuid primary key default gen_random_uuid(),
  page_key         text not null unique check (page_key ~ '^[a-z][a-z0-9_-]{0,63}$'),
  title            text not null check (char_length(title) between 1 and 200),
  content          jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  seo_title        text check (char_length(seo_title) <= 200),
  seo_description  text check (char_length(seo_description) <= 320),
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- media_assets: the media library (metadata only, binaries live in Storage)
-- -----------------------------------------------------------------------------
create table public.media_assets (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null unique check (char_length(storage_path) between 1 and 1024),
  file_name     text not null check (char_length(file_name) between 1 and 255),
  mime_type     text not null check (char_length(mime_type) <= 100),
  media_type    text not null check (media_type in ('image', 'video')),
  size_bytes    bigint not null check (size_bytes >= 0),
  width         integer check (width > 0),
  height        integer check (height > 0),
  alt_text      text check (char_length(alt_text) <= 300),
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index media_assets_created_idx on public.media_assets (created_at desc);
create index media_assets_type_idx on public.media_assets (media_type);

-- -----------------------------------------------------------------------------
-- inquiries: contact-form submissions (admin-only)
-- -----------------------------------------------------------------------------
create table public.inquiries (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 120),
  email          text not null check (char_length(email) between 3 and 254),
  phone          text check (char_length(phone) <= 40),
  subject        text check (char_length(subject) <= 200),
  message        text not null check (char_length(message) between 1 and 5000),
  project_id     uuid references public.projects (id) on delete set null,
  project_title  text check (char_length(project_title) <= 200),
  status         text not null default 'new' check (status in ('new', 'read', 'archived')),
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index inquiries_created_idx on public.inquiries (created_at desc);
create index inquiries_status_idx on public.inquiries (status, created_at desc);
create index inquiries_project_idx on public.inquiries (project_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger project_categories_updated_at before update on public.project_categories
  for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger project_sections_updated_at before update on public.project_sections
  for each row execute function public.set_updated_at();
create trigger homepage_sections_updated_at before update on public.homepage_sections
  for each row execute function public.set_updated_at();
create trigger homepage_section_drafts_updated_at before update on public.homepage_section_drafts
  for each row execute function public.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
create trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();
create trigger media_assets_updated_at before update on public.media_assets
  for each row execute function public.set_updated_at();
