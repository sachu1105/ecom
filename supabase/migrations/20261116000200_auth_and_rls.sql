-- =============================================================================
-- Authorisation helpers and Row Level Security for every application table.
--
-- Admin = trusted JWT claim app_metadata.role = 'admin'
--         AND profiles.role = 'admin'.
-- user_metadata is user-editable and is never consulted.
-- =============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
     and exists (
       select 1
       from public.profiles p
       where p.id = auth.uid()
         and p.role = 'admin'
     );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Profiles can only be created or changed with the service role (bootstrap script).
-- Prevent privilege escalation through the API even if a policy is misconfigured.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- PostgREST switches to the request's role, so current_user is
  -- anon / authenticated / service_role. Migrations run as postgres.
  if current_user not in ('service_role', 'postgres', 'supabase_admin')
     and (tg_op = 'INSERT' or new.role is distinct from old.role) then
    raise exception 'profile roles can only be changed by the service role'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere
-- -----------------------------------------------------------------------------
alter table public.profiles                enable row level security;
alter table public.project_categories      enable row level security;
alter table public.projects                enable row level security;
alter table public.project_media           enable row level security;
alter table public.project_sections        enable row level security;
alter table public.homepage_sections       enable row level security;
alter table public.homepage_section_drafts enable row level security;
alter table public.site_settings           enable row level security;
alter table public.pages                   enable row level security;
alter table public.media_assets            enable row level security;
alter table public.inquiries               enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "profiles: read own or admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- No insert/update/delete policies: managed with the service role only.

-- -----------------------------------------------------------------------------
-- project_categories
-- -----------------------------------------------------------------------------
create policy "categories: public reads active"
  on public.project_categories for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "categories: admin insert"
  on public.project_categories for insert to authenticated
  with check ((select public.is_admin()));

create policy "categories: admin update"
  on public.project_categories for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "categories: admin delete"
  on public.project_categories for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- projects
-- -----------------------------------------------------------------------------
create policy "projects: public reads published"
  on public.projects for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy "projects: admin insert"
  on public.projects for insert to authenticated
  with check ((select public.is_admin()));

create policy "projects: admin update"
  on public.projects for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "projects: admin delete"
  on public.projects for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- project_media (visible only when the parent project is published)
-- -----------------------------------------------------------------------------
create policy "project_media: public reads of published projects"
  on public.project_media for select to anon, authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id and p.status = 'published'
    )
    or (select public.is_admin())
  );

create policy "project_media: admin insert"
  on public.project_media for insert to authenticated
  with check ((select public.is_admin()));

create policy "project_media: admin update"
  on public.project_media for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "project_media: admin delete"
  on public.project_media for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- project_sections (visible only when the parent project is published)
-- -----------------------------------------------------------------------------
create policy "project_sections: public reads of published projects"
  on public.project_sections for select to anon, authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_sections.project_id and p.status = 'published'
    )
    or (select public.is_admin())
  );

create policy "project_sections: admin insert"
  on public.project_sections for insert to authenticated
  with check ((select public.is_admin()));

create policy "project_sections: admin update"
  on public.project_sections for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "project_sections: admin delete"
  on public.project_sections for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- homepage_sections
-- -----------------------------------------------------------------------------
create policy "homepage_sections: public reads enabled"
  on public.homepage_sections for select to anon, authenticated
  using (is_enabled or (select public.is_admin()));

create policy "homepage_sections: admin insert"
  on public.homepage_sections for insert to authenticated
  with check ((select public.is_admin()));

create policy "homepage_sections: admin update"
  on public.homepage_sections for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "homepage_sections: admin delete"
  on public.homepage_sections for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- homepage_section_drafts (admin only, never public)
-- -----------------------------------------------------------------------------
create policy "homepage_section_drafts: admin all"
  on public.homepage_section_drafts for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- site_settings
-- -----------------------------------------------------------------------------
create policy "site_settings: public reads public keys"
  on public.site_settings for select to anon, authenticated
  using (is_public or (select public.is_admin()));

create policy "site_settings: admin insert"
  on public.site_settings for insert to authenticated
  with check ((select public.is_admin()));

create policy "site_settings: admin update"
  on public.site_settings for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "site_settings: admin delete"
  on public.site_settings for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- pages
-- -----------------------------------------------------------------------------
create policy "pages: public reads published"
  on public.pages for select to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "pages: admin insert"
  on public.pages for insert to authenticated
  with check ((select public.is_admin()));

create policy "pages: admin update"
  on public.pages for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "pages: admin delete"
  on public.pages for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- media_assets (library metadata is admin-only; files are served publicly
-- from the public `media` bucket)
-- -----------------------------------------------------------------------------
create policy "media_assets: admin all"
  on public.media_assets for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- inquiries (never public; inserts happen server-side with the service role
-- after validation and rate limiting, so there is no insert policy)
-- -----------------------------------------------------------------------------
create policy "inquiries: admin read"
  on public.inquiries for select to authenticated
  using ((select public.is_admin()));

create policy "inquiries: admin update"
  on public.inquiries for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "inquiries: admin delete"
  on public.inquiries for delete to authenticated
  using ((select public.is_admin()));
