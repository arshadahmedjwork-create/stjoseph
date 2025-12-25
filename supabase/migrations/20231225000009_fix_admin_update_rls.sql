-- Fix RLS policies for alumni_submissions admin updates
-- The issue: RLS policies checking auth.uid() might have permission issues

-- Drop existing admin policies
drop policy if exists "Admins can view all submissions" on public.alumni_submissions;
drop policy if exists "Admins can update submission status" on public.alumni_submissions;

-- Recreate with simpler, more explicit checks
-- Admins can read all submissions
create policy "Admins can view all submissions"
  on public.alumni_submissions
  for select
  to authenticated
  using (
    auth.uid() in (
      select id from public.admin_profiles
    )
  );

-- Admins can update review_status and admin_notes
create policy "Admins can update submission status"
  on public.alumni_submissions
  for update
  to authenticated
  using (
    auth.uid() in (
      select id from public.admin_profiles
    )
  );

-- Grant explicit permissions to authenticated role
grant select, update on public.alumni_submissions to authenticated;
grant select on public.admin_profiles to authenticated;
