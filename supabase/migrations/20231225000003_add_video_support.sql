-- Migration: Add video support to alumni_submissions
-- Description: Adds video_path column for video file storage
-- Version: 1.1
-- Date: 2025-12-25

-- Add video_path column to alumni_submissions table
ALTER TABLE alumni_submissions
ADD COLUMN IF NOT EXISTS video_path text;

-- Add comment
COMMENT ON COLUMN alumni_submissions.video_path IS 'Supabase Storage path for video file';

-- Update the has_content constraint to include video
ALTER TABLE alumni_submissions
DROP CONSTRAINT IF EXISTS has_content;

ALTER TABLE alumni_submissions
ADD CONSTRAINT has_content CHECK (
  message_text IS NOT NULL OR 
  audio_path IS NOT NULL OR 
  video_path IS NOT NULL OR 
  image_paths IS NOT NULL
);
