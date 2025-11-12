-- ============================================================================
-- VERIFICATION SCRIPT - Run this AFTER applying COMPLETE_DATABASE_SETUP.sql
-- ============================================================================

-- Check 1: Count all tables created
SELECT 
  'Total Tables Created' as check_name,
  COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public';

-- Check 2: List all tables with RLS status
SELECT 
  tablename as table_name,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check 3: Verify critical tables exist
SELECT 
  'Critical Tables Check' as check_name,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ All Critical Tables Present'
    ELSE '❌ Missing Tables: ' || (8 - COUNT(*))::text
  END as status
FROM (
  SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
    'users',
    'user_onboarding_data',
    'workout_programs',
    'meal_plans',
    'macro_targets',
    'weight_logs',
    'daily_activity_summary',
    'user_gamification_profile'
  )
) critical_tables;

-- Check 4: Verify trigger exists for auto user profile creation
SELECT 
  'User Auto-Creation Trigger' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Trigger Exists'
    ELSE '❌ Trigger Missing'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check 5: Count RLS policies across all tables
SELECT 
  'Total RLS Policies' as check_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- Check 6: Verify key columns in onboarding table
SELECT 
  'Onboarding Table Structure' as check_name,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ All Columns Present (' || COUNT(*) || ' columns)'
    ELSE '❌ Missing Columns'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_onboarding_data';

-- Check 7: Final Setup Status
SELECT 
  '🎉 SETUP STATUS' as check_name,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') >= 23
      AND (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') > 0
      AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') > 20
    THEN '✅ DATABASE FULLY CONFIGURED - Ready for onboarding!'
    ELSE '⚠️ Some components missing - check results above'
  END as status;
