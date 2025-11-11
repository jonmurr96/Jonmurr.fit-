-- Run this in Supabase SQL Editor to see which tables exist
-- This will help us know which migrations are already applied

SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Expected tables from each migration:
-- schema.sql (22 tables): challenges, daily_logs, earned_badges, exercises, food_items, gamification_state, generated_meal_plans, macro_targets, meals, milestones, progress_photos, quick_add_meal_items, quick_add_meals, saved_workouts, streaks, training_programs, user_profile, water_logs, weight_logs, workout_history, workouts, workout_sets
-- migration_users_auth.sql (1 table): users
-- migration_gamification_v2.sql (5 tables): user_gamification_profile, loot_inventory, challenge_progress, ai_usage_log, xp_transactions
-- migration_heat_map.sql (1 table): daily_activity_summary

-- If you see ALL 29 tables (22 + 1 + 5 + 1), then only RLS migration is left!
