-- Reset Script: Drop existing alumni_submissions table
-- Run this before deploying migrations if table structure changed

-- Drop existing table if it exists
drop table if exists alumni_submissions cascade;

-- Note: This will delete all data in the table
-- Only run this in development environment
