-- Cleanup script: Safely remove old workout tracking tables
-- Run this BEFORE applying migration_workout_sessions.sql

-- Drop old triggers first
DROP TRIGGER IF EXISTS update_workout_sessions_timestamp_trigger ON workout_sessions;
DROP TRIGGER IF EXISTS update_workout_sets_timestamp_trigger ON workout_sets;

-- Drop old functions
DROP FUNCTION IF EXISTS update_workout_timestamp();
DROP FUNCTION IF EXISTS get_previous_workout_sets(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS complete_workout_session(UUID, UUID);

-- Drop old policies
DROP POLICY IF EXISTS workout_sessions_user_policy ON workout_sessions;
DROP POLICY IF EXISTS workout_sets_user_policy ON workout_sets;

-- Drop old tables (CASCADE removes dependent objects)
DROP TABLE IF EXISTS workout_sets CASCADE;
DROP TABLE IF EXISTS workout_sessions CASCADE;

-- Confirmation message
SELECT 'Cleanup complete - ready to apply migration_workout_sessions.sql' AS status;
