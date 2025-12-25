-- Migration: Create alumni-videos storage bucket
-- Description: Creates private bucket for video files with strict access policies
-- Version: 1.1
-- Date: 2025-12-25

-- Create alumni-videos bucket (PRIVATE)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'alumni-videos',
  'alumni-videos',
  false,  -- PRIVATE: No public access
  52428800,  -- 50MB limit per file
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for alumni-videos bucket

-- Policy: Service role can insert video files
CREATE POLICY "Service role can upload videos"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'alumni-videos');

-- Policy: Service role can read video files
CREATE POLICY "Service role can read videos"
  ON storage.objects
  FOR SELECT
  TO service_role
  USING (bucket_id = 'alumni-videos');

-- Policy: Service role can delete video files (for rollback)
CREATE POLICY "Service role can delete videos"
  ON storage.objects
  FOR DELETE
  TO service_role
  USING (bucket_id = 'alumni-videos');

-- Policy: Authenticated admins can read video files (via signed URLs)
CREATE POLICY "Admins can access videos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'alumni-videos'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
