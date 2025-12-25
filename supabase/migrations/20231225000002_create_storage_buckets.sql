-- Migration: Create Supabase Storage buckets for alumni media
-- Description: Creates private buckets for audio and images with strict access policies
-- Version: 1.0
-- Date: 2025-12-25

-- Create alumni-audio bucket (PRIVATE)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'alumni-audio',
  'alumni-audio',
  false,  -- PRIVATE: No public access
  10485760,  -- 10MB limit per file
  array['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg']
)
on conflict (id) do nothing;

-- Create alumni-images bucket (PRIVATE)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'alumni-images',
  'alumni-images',
  false,  -- PRIVATE: No public access
  2097152,  -- 2MB limit per file
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Storage policies for alumni-audio bucket

-- Policy: Service role can insert audio files
create policy "Service role can upload audio"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'alumni-audio');

-- Policy: Service role can read audio files
create policy "Service role can read audio"
  on storage.objects
  for select
  to service_role
  using (bucket_id = 'alumni-audio');

-- Policy: Service role can delete audio files (for rollback)
create policy "Service role can delete audio"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'alumni-audio');

-- Policy: Authenticated admins can read audio files (via signed URLs)
create policy "Admins can access audio"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'alumni-audio'
    and exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Storage policies for alumni-images bucket

-- Policy: Service role can insert images
create policy "Service role can upload images"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'alumni-images');

-- Policy: Service role can read images
create policy "Service role can read images"
  on storage.objects
  for select
  to service_role
  using (bucket_id = 'alumni-images');

-- Policy: Service role can delete images (for rollback)
create policy "Service role can delete images"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'alumni-images');

-- Policy: Authenticated admins can read images (via signed URLs)
create policy "Admins can access images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'alumni-images'
    and exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
