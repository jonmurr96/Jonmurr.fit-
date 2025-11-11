-- DIAGNOSTIC QUERIES: Run these in Supabase SQL Editor to diagnose the issue

-- 1. Check if any users exist in auth.users but NOT in public.users
-- This tells us if the auth user was created but the trigger failed
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  u.id as profile_id,
  u.username
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- 2. Check the users table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check all policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 4. Check the trigger function exists and is correct
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'handle_new_user';

-- 5. Check if the trigger is attached
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- 6. Test if we can manually insert into users table (as superuser)
-- This will tell us if there's a constraint issue
-- UNCOMMENT TO TEST:
-- INSERT INTO public.users (id, full_name, username, avatar_url, onboarding_complete)
-- VALUES (
--   'test-manual-insert-12345',
--   'Test User',
--   'testuser_' || floor(random() * 10000)::text,
--   NULL,
--   FALSE
-- );
-- SELECT * FROM public.users WHERE id = 'test-manual-insert-12345';
-- DELETE FROM public.users WHERE id = 'test-manual-insert-12345';
