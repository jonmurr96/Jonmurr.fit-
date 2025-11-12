-- ============================================================================
-- DIAGNOSTIC QUERY - Run this to check if tables and triggers exist
-- ============================================================================

-- Check if users table exists
SELECT 
  'users table exists' AS check_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) AS result;

-- Check if trigger function exists
SELECT 
  'handle_new_user function exists' AS check_name,
  EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'handle_new_user'
  ) AS result;

-- Check if trigger exists
SELECT 
  'on_auth_user_created trigger exists' AS check_name,
  EXISTS (
    SELECT FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth'
    AND c.relname = 'users'
    AND t.tgname = 'on_auth_user_created'
  ) AS result;

-- List all columns in users table (if exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
