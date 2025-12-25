-- Migration: Create alumni_submissions table
-- Description: Stores alumni memory submissions with tag metadata and storage paths
-- Version: 1.0
-- Date: 2025-12-25

-- Create alumni_submissions table
create table if not exists alumni_submissions (
  -- Primary identification
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Alumni personal information
  full_name text not null,
  institution text not null,
  batch_year int not null,
  roll_number text not null,
  date_of_birth date not null,

  -- Contact information
  email text not null,
  phone text,

  -- Memory content
  message_text text,

  -- Media storage paths (NOT actual media)
  audio_path text,              -- Path in Supabase Storage: audio/{uuid}.webm
  image_paths jsonb,             -- Array of paths: images/{uuid}/{index}.jpg

  -- Consent
  consent_given boolean not null default false,

  -- AI-generated metadata (from tagMemory)
  tags text[] not null,          -- Array of tag IDs (stable identifiers)
  top_tag text not null,         -- Primary tag ID with highest score
  tag_scores jsonb not null,     -- Map of tag_id -> score (1-5)

  -- Admin workflow
  review_status text not null default 'pending',
  admin_notes text,

  -- Rejection tracking
  rejected boolean not null default false,
  rejection_reason text,

  -- Constraints
  constraint valid_batch_year check (batch_year >= 1960 and batch_year <= 2030),
  constraint valid_review_status check (review_status in ('pending', 'approved', 'rejected', 'flagged')),
  constraint valid_institution check (institution in ('SJCBA', 'SJPUC', 'SJIT', 'Other')),
  constraint valid_tag_scores check (jsonb_typeof(tag_scores) = 'object'),
  constraint valid_image_paths check (image_paths is null or jsonb_typeof(image_paths) = 'array'),
  constraint has_content check (
    message_text is not null or audio_path is not null or image_paths is not null
  )
);

-- Create indexes for performance
create index idx_alumni_submissions_batch_year on alumni_submissions(batch_year);
create index idx_alumni_submissions_institution on alumni_submissions(institution);
create index idx_alumni_submissions_review_status on alumni_submissions(review_status);
create index idx_alumni_submissions_top_tag on alumni_submissions(top_tag);
create index idx_alumni_submissions_created_at on alumni_submissions(created_at desc);
create index idx_alumni_submissions_tags on alumni_submissions using gin(tags);
create index idx_alumni_submissions_rejected on alumni_submissions(rejected) where rejected = false;

-- Enable Row Level Security
alter table alumni_submissions enable row level security;

-- RLS Policies

-- Policy: Allow service role full access (for Edge Functions)
create policy "Service role has full access"
  on alumni_submissions
  for all
  to service_role
  using (true)
  with check (true);

-- Policy: Admins can read all submissions
create policy "Admins can view all submissions"
  on alumni_submissions
  for select
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Admins can update review status and notes
create policy "Admins can update submissions"
  on alumni_submissions
  for update
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  with check (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Public users cannot directly access the table
-- All public submissions MUST go through Edge Functions

-- Add comments for documentation
comment on table alumni_submissions is 'Stores alumni memory submissions with AI-generated tags and storage paths';
comment on column alumni_submissions.audio_path is 'Supabase Storage path for audio file';
comment on column alumni_submissions.image_paths is 'Array of Supabase Storage paths for images';
comment on column alumni_submissions.tags is 'Stable tag IDs from AI analysis';
comment on column alumni_submissions.top_tag is 'Primary tag ID with highest confidence score';
comment on column alumni_submissions.tag_scores is 'JSON object mapping tag IDs to scores (1-5)';
comment on column alumni_submissions.rejected is 'True if submission failed quality gate';
