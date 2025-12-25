-- =====================================================
-- Migration: Remove Image Support
-- Date: 2023-12-25
-- Description: Remove image_paths column and update constraints
-- =====================================================

-- Drop the image_paths column
ALTER TABLE public.alumni_submissions
DROP COLUMN IF EXISTS image_paths;

-- Update the has_content constraint to remove image check
ALTER TABLE public.alumni_submissions
DROP CONSTRAINT IF EXISTS has_content;

ALTER TABLE public.alumni_submissions
ADD CONSTRAINT has_content CHECK (
  (message_text IS NOT NULL AND message_text <> '') OR
  audio_path IS NOT NULL OR
  video_path IS NOT NULL
);

-- Add comment to document the change
COMMENT ON TABLE public.alumni_submissions IS 'Alumni submissions table - supports text, audio, and video only';
