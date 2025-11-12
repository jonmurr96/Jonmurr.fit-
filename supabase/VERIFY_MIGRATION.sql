-- ============================================================================
-- VERIFICATION SCRIPT
-- Run this AFTER applying APPLY_ALL_MIGRATIONS.sql to verify everything worked
-- ============================================================================

-- Check 1: Verify users table exists
SELECT 
  'CHECK 1: users table' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN '✅ PASSED' ELSE '❌ FAILED' END as status;

-- Check 2: Verify trigger function exists  
SELECT 
  'CHECK 2: handle_new_user function' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) THEN '✅ PASSED' ELSE '❌ FAILED' END as status;

-- Check 3: Verify trigger exists on auth.users
SELECT 
  'CHECK 3: on_auth_user_created trigger' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_schema = 'auth' 
      AND event_object_table = 'users'
      AND trigger_name = 'on_auth_user_created'
  ) THEN '✅ PASSED' ELSE '❌ FAILED' END as status;

-- Check 4: Verify RLS is enabled
SELECT 
  'CHECK 4: RLS enabled on users' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = 'users' 
      AND rowsecurity = true
  ) THEN '✅ PASSED' ELSE '❌ FAILED' END as status;

-- Check 5: Verify onboarding table exists
SELECT 
  'CHECK 5: user_onboarding_data table' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_onboarding_data'
  ) THEN '✅ PASSED' ELSE '❌ FAILED' END as status;

-- Summary: Show all checks
SELECT '🎯 SUMMARY' as info, 'If all checks show ✅ PASSED, you are ready to sign up!' as message;
