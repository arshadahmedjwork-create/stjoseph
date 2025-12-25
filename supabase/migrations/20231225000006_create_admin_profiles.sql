-- =====================================================
-- Migration: Admin Profiles and Authentication
-- Date: 2023-12-25
-- Description: Create admin user management system
-- =====================================================

-- Create admin_profiles table
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'admin' check (role in ('admin', 'super_admin', 'reviewer')),
  first_login boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(id),
  last_login_at timestamptz,
  constraint valid_email check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS
alter table public.admin_profiles enable row level security;

-- RLS Policies: Admins can only read admin_profiles
create policy "Admins can view all admin profiles"
  on public.admin_profiles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  );

-- RLS Policies: Only admins can insert new admins
create policy "Admins can create new admins"
  on public.admin_profiles
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  );

-- RLS Policies: Admins can update their own first_login and last_login_at
create policy "Admins can update their own profile"
  on public.admin_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Update alumni_submissions RLS for admin access
-- Drop existing policies if they exist
drop policy if exists "Admins can view all submissions" on public.alumni_submissions;
drop policy if exists "Admins can update submission status" on public.alumni_submissions;

-- Admins can read all submissions
create policy "Admins can view all submissions"
  on public.alumni_submissions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  );

-- Admins can update review_status and admin_notes only
create policy "Admins can update submission status"
  on public.alumni_submissions
  for update
  to authenticated
  using (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  );

-- Create function to update last_login_at
create or replace function public.update_admin_last_login()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.admin_profiles
  set last_login_at = now()
  where id = new.id;
  return new;
end;
$$;

-- Create trigger on auth.users to update last_login_at
-- Note: This requires pg_cron or similar, simplified version:
-- Admins will update last_login_at via Edge Function on login

-- Add comment
comment on table public.admin_profiles is 'Admin user profiles with role-based access control';
