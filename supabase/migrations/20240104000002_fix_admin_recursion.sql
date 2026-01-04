-- =====================================================
-- Migration: Fix Infinite Recursion in Admin Policies
-- Date: 2024-01-04
-- Description: Fix RLS policies to prevent infinite recursion
-- =====================================================

-- Drop all policies on admin_profiles to start fresh
DROP POLICY IF EXISTS "Admins can view all admin profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admins can create new admins" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admins can update their own profile" ON public.admin_profiles;

-- Create simple, non-recursive policies for admin_profiles
-- Key: These policies should NOT query admin_profiles table itself

-- Policy 1: Authenticated users can view their own profile
CREATE POLICY "Users can view own admin profile"
  ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Service role has full access
CREATE POLICY "Service role has full access to admin_profiles"
  ON public.admin_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 3: Users can update their own profile (first_login, last_login_at)
CREATE POLICY "Users can update own admin profile"
  ON public.admin_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Now fix alumni_submissions policies to avoid recursion
-- The key is to make them simple and direct

DROP POLICY IF EXISTS "Service role has full access" ON public.alumni_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.alumni_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.alumni_submissions;

-- Policy 1: Service role has full access (for Edge Functions)
CREATE POLICY "Service role has full access"
  ON public.alumni_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Authenticated users who have a matching record in admin_profiles can view
-- Use a simple NOT EXISTS to avoid recursion - just check if the row exists
CREATE POLICY "Admins can view all submissions"
  ON public.alumni_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
      LIMIT 1
    )
  );

-- Policy 3: Authenticated users who have a matching record in admin_profiles can update
CREATE POLICY "Admins can update submissions"
  ON public.alumni_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
      LIMIT 1
    )
  );

-- Grant necessary permissions
GRANT SELECT ON public.admin_profiles TO authenticated;
GRANT SELECT, UPDATE ON public.alumni_submissions TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Users can view own admin profile" ON public.admin_profiles 
  IS 'Non-recursive: Users can only see their own admin profile to avoid infinite recursion';

COMMENT ON POLICY "Admins can view all submissions" ON public.alumni_submissions 
  IS 'Checks admin_profiles with LIMIT 1 to prevent recursion issues';
