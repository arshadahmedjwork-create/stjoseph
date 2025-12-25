-- =====================================================
-- Migration: Fix Admin Profiles RLS Recursion
-- Date: 2023-12-25
-- Description: Remove recursive policy causing infinite loop
-- =====================================================

-- Drop the recursive policy
drop policy if exists "Admins can view all other admin profiles" on public.admin_profiles;

-- Keep only the simple policy: users can view their own profile
-- This is sufficient for login verification
-- For admin management pages, we'll use service role key in Edge Functions
