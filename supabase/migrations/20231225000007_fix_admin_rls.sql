-- =====================================================
-- Migration: Fix Admin Profiles RLS Policy
-- Date: 2023-12-25
-- Description: Fix circular dependency in RLS policy
-- =====================================================

-- Drop the existing problematic policy
drop policy if exists "Admins can view all admin profiles" on public.admin_profiles;

-- Create new policy: Authenticated users can read their own admin profile
-- This allows login verification without circular dependency
create policy "Users can view their own admin profile"
  on public.admin_profiles
  for select
  to authenticated
  using (id = auth.uid());

-- Create new policy: Admins can view all admin profiles (for admin management pages)
create policy "Admins can view all other admin profiles"
  on public.admin_profiles
  for select
  to authenticated
  using (
    id != auth.uid() 
    and exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );
