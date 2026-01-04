-- =====================================================
-- Migration: Fix Admin Permissions and RLS Policies
-- Date: 2024-01-04
-- Description: Fix permission errors for admin operations
-- =====================================================

-- Drop all existing conflicting policies on alumni_submissions
DROP POLICY IF EXISTS "Service role has full access" ON public.alumni_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.alumni_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.alumni_submissions;
DROP POLICY IF EXISTS "Admins can update submission status" ON public.alumni_submissions;

-- Create clear, non-conflicting policies for alumni_submissions
-- Policy 1: Service role has full access (for Edge Functions)
CREATE POLICY "Service role has full access"
  ON public.alumni_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON public.alumni_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );

-- Policy 3: Admins can update submissions (review_status, admin_notes)
CREATE POLICY "Admins can update submissions"
  ON public.alumni_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.alumni_submissions TO authenticated;
GRANT SELECT ON public.admin_profiles TO authenticated;

-- Ensure admin_profiles table has correct policies
DROP POLICY IF EXISTS "Admins can view all admin profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admins can create new admins" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admins can update their own profile" ON public.admin_profiles;

-- Recreate admin_profiles policies
CREATE POLICY "Admins can view all admin profiles"
  ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Admins can create new admins"
  ON public.admin_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their own profile"
  ON public.admin_profiles
  FOR UPDATE
  TO authenticated
  USING (admin_profiles.id = auth.uid())
  WITH CHECK (admin_profiles.id = auth.uid());

-- Add comment
COMMENT ON POLICY "Admins can update submissions" ON public.alumni_submissions 
  IS 'Allows authenticated users in admin_profiles table to update alumni_submissions';
