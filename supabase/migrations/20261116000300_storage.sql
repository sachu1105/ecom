-- =============================================================================
-- Storage: a single public `media` bucket.
--   * Public read through the public object URL (no RLS on public buckets).
--   * Writes restricted to admins by storage RLS.
--   * The bucket itself enforces the MIME allow-list and the maximum size, so
--     limits hold even if application checks were bypassed.
--   * SVG is intentionally excluded (it can carry script).
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800, -- 50 MB (video upper bound; images are capped lower in the app)
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "media: admin read"
  on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

create policy "media: admin upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
