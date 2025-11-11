-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR MULTI-USER DATA ISOLATION
-- ============================================================================
-- This migration adds RLS policies to all 27 Supabase tables to ensure
-- complete multi-user data isolation at the database level.
--
-- PREREQUISITES:
-- 1. migration_users_auth.sql must be applied first
-- 2. All tables must exist in the database
-- 3. Supabase Auth must be configured
--
-- HOW TO APPLY:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run" to execute
-- 4. Verify success - all tables should show "RLS enabled" in Table Editor
--
-- ROLLBACK (if needed):
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Run: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- 3. For each table, run: ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- 4. Run: DROP POLICY IF EXISTS policy_name ON table_name; (for each policy)
--
-- WHAT THIS DOES:
-- - Enables RLS on all 27 tables
-- - Creates SELECT/INSERT/UPDATE/DELETE policies for user-owned data
-- - Prevents data leakage between users at the database level
-- - Uses defensive checks to prevent orphaned row access
-- ============================================================================

-- Start transaction for atomic rollback if any step fails
BEGIN;

-- ============================================================================
-- HELPER FUNCTION: Safely check if a user owns a record through foreign keys
-- ============================================================================
-- This prevents NULL/orphaned row errors in nested SELECT policies

CREATE OR REPLACE FUNCTION user_owns_meal(meal_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meals 
    WHERE meals.id = meal_id_param 
    AND meals.user_id = auth.uid()::text
  );
$$;

CREATE OR REPLACE FUNCTION user_owns_quick_add_meal(meal_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM quick_add_meals 
    WHERE quick_add_meals.id = meal_id_param 
    AND quick_add_meals.user_id = auth.uid()::text
  );
$$;

CREATE OR REPLACE FUNCTION user_owns_training_program(program_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM training_programs 
    WHERE training_programs.id = program_id_param 
    AND training_programs.user_id = auth.uid()::text
  );
$$;

CREATE OR REPLACE FUNCTION user_owns_workout(workout_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workouts w
    JOIN training_programs tp ON w.program_id = tp.id
    WHERE w.id = workout_id_param 
    AND tp.user_id = auth.uid()::text
  );
$$;

CREATE OR REPLACE FUNCTION user_owns_exercise(exercise_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM exercises e
    JOIN workouts w ON e.workout_id = w.id
    JOIN training_programs tp ON w.program_id = tp.id
    WHERE e.id = exercise_id_param 
    AND tp.user_id = auth.uid()::text
  );
$$;

-- ============================================================================
-- USER PROFILE & SETTINGS TABLES
-- ============================================================================

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profile;
CREATE POLICY "Users can view own profile"
  ON user_profile FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profile;
CREATE POLICY "Users can insert own profile"
  ON user_profile FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profile;
CREATE POLICY "Users can update own profile"
  ON user_profile FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON user_profile;
CREATE POLICY "Users can delete own profile"
  ON user_profile FOR DELETE
  USING (auth.uid()::text = user_id);

-- macro_targets
ALTER TABLE macro_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own macro targets" ON macro_targets;
CREATE POLICY "Users can view own macro targets"
  ON macro_targets FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own macro targets" ON macro_targets;
CREATE POLICY "Users can insert own macro targets"
  ON macro_targets FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own macro targets" ON macro_targets;
CREATE POLICY "Users can update own macro targets"
  ON macro_targets FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own macro targets" ON macro_targets;
CREATE POLICY "Users can delete own macro targets"
  ON macro_targets FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- MEAL TRACKING TABLES
-- ============================================================================

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meals" ON meals;
CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own meals" ON meals;
CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own meals" ON meals;
CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own meals" ON meals;
CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  USING (auth.uid()::text = user_id);

-- food_items (uses helper function for safety)
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own food items" ON food_items;
CREATE POLICY "Users can view own food items"
  ON food_items FOR SELECT
  USING (user_owns_meal(meal_id));

DROP POLICY IF EXISTS "Users can insert own food items" ON food_items;
CREATE POLICY "Users can insert own food items"
  ON food_items FOR INSERT
  WITH CHECK (user_owns_meal(meal_id));

DROP POLICY IF EXISTS "Users can update own food items" ON food_items;
CREATE POLICY "Users can update own food items"
  ON food_items FOR UPDATE
  USING (user_owns_meal(meal_id))
  WITH CHECK (user_owns_meal(meal_id));

DROP POLICY IF EXISTS "Users can delete own food items" ON food_items;
CREATE POLICY "Users can delete own food items"
  ON food_items FOR DELETE
  USING (user_owns_meal(meal_id));

-- daily_logs
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily logs" ON daily_logs;
CREATE POLICY "Users can view own daily logs"
  ON daily_logs FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own daily logs" ON daily_logs;
CREATE POLICY "Users can insert own daily logs"
  ON daily_logs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own daily logs" ON daily_logs;
CREATE POLICY "Users can update own daily logs"
  ON daily_logs FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own daily logs" ON daily_logs;
CREATE POLICY "Users can delete own daily logs"
  ON daily_logs FOR DELETE
  USING (auth.uid()::text = user_id);

-- quick_add_meals
ALTER TABLE quick_add_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quick add meals" ON quick_add_meals;
CREATE POLICY "Users can view own quick add meals"
  ON quick_add_meals FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own quick add meals" ON quick_add_meals;
CREATE POLICY "Users can insert own quick add meals"
  ON quick_add_meals FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own quick add meals" ON quick_add_meals;
CREATE POLICY "Users can update own quick add meals"
  ON quick_add_meals FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own quick add meals" ON quick_add_meals;
CREATE POLICY "Users can delete own quick add meals"
  ON quick_add_meals FOR DELETE
  USING (auth.uid()::text = user_id);

-- quick_add_meal_items (uses helper function for safety)
ALTER TABLE quick_add_meal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quick add meal items" ON quick_add_meal_items;
CREATE POLICY "Users can view own quick add meal items"
  ON quick_add_meal_items FOR SELECT
  USING (user_owns_quick_add_meal(meal_id));

DROP POLICY IF EXISTS "Users can insert own quick add meal items" ON quick_add_meal_items;
CREATE POLICY "Users can insert own quick add meal items"
  ON quick_add_meal_items FOR INSERT
  WITH CHECK (user_owns_quick_add_meal(meal_id));

DROP POLICY IF EXISTS "Users can update own quick add meal items" ON quick_add_meal_items;
CREATE POLICY "Users can update own quick add meal items"
  ON quick_add_meal_items FOR UPDATE
  USING (user_owns_quick_add_meal(meal_id))
  WITH CHECK (user_owns_quick_add_meal(meal_id));

DROP POLICY IF EXISTS "Users can delete own quick add meal items" ON quick_add_meal_items;
CREATE POLICY "Users can delete own quick add meal items"
  ON quick_add_meal_items FOR DELETE
  USING (user_owns_quick_add_meal(meal_id));

-- generated_meal_plans
ALTER TABLE generated_meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meal plans" ON generated_meal_plans;
CREATE POLICY "Users can view own meal plans"
  ON generated_meal_plans FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own meal plans" ON generated_meal_plans;
CREATE POLICY "Users can insert own meal plans"
  ON generated_meal_plans FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own meal plans" ON generated_meal_plans;
CREATE POLICY "Users can update own meal plans"
  ON generated_meal_plans FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own meal plans" ON generated_meal_plans;
CREATE POLICY "Users can delete own meal plans"
  ON generated_meal_plans FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- WORKOUT TRACKING TABLES
-- ============================================================================

ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own training programs" ON training_programs;
CREATE POLICY "Users can view own training programs"
  ON training_programs FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own training programs" ON training_programs;
CREATE POLICY "Users can insert own training programs"
  ON training_programs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own training programs" ON training_programs;
CREATE POLICY "Users can update own training programs"
  ON training_programs FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own training programs" ON training_programs;
CREATE POLICY "Users can delete own training programs"
  ON training_programs FOR DELETE
  USING (auth.uid()::text = user_id);

-- workouts (uses helper function for safety)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (user_owns_training_program(program_id));

DROP POLICY IF EXISTS "Users can insert own workouts" ON workouts;
CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  WITH CHECK (user_owns_training_program(program_id));

DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (user_owns_training_program(program_id))
  WITH CHECK (user_owns_training_program(program_id));

DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;
CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (user_owns_training_program(program_id));

-- exercises (uses helper function for safety)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own exercises" ON exercises;
CREATE POLICY "Users can view own exercises"
  ON exercises FOR SELECT
  USING (user_owns_workout(workout_id));

DROP POLICY IF EXISTS "Users can insert own exercises" ON exercises;
CREATE POLICY "Users can insert own exercises"
  ON exercises FOR INSERT
  WITH CHECK (user_owns_workout(workout_id));

DROP POLICY IF EXISTS "Users can update own exercises" ON exercises;
CREATE POLICY "Users can update own exercises"
  ON exercises FOR UPDATE
  USING (user_owns_workout(workout_id))
  WITH CHECK (user_owns_workout(workout_id));

DROP POLICY IF EXISTS "Users can delete own exercises" ON exercises;
CREATE POLICY "Users can delete own exercises"
  ON exercises FOR DELETE
  USING (user_owns_workout(workout_id));

-- workout_sets (uses helper function for safety)
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workout sets" ON workout_sets;
CREATE POLICY "Users can view own workout sets"
  ON workout_sets FOR SELECT
  USING (user_owns_exercise(exercise_id));

DROP POLICY IF EXISTS "Users can insert own workout sets" ON workout_sets;
CREATE POLICY "Users can insert own workout sets"
  ON workout_sets FOR INSERT
  WITH CHECK (user_owns_exercise(exercise_id));

DROP POLICY IF EXISTS "Users can update own workout sets" ON workout_sets;
CREATE POLICY "Users can update own workout sets"
  ON workout_sets FOR UPDATE
  USING (user_owns_exercise(exercise_id))
  WITH CHECK (user_owns_exercise(exercise_id));

DROP POLICY IF EXISTS "Users can delete own workout sets" ON workout_sets;
CREATE POLICY "Users can delete own workout sets"
  ON workout_sets FOR DELETE
  USING (user_owns_exercise(exercise_id));

-- workout_history
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workout history" ON workout_history;
CREATE POLICY "Users can view own workout history"
  ON workout_history FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own workout history" ON workout_history;
CREATE POLICY "Users can insert own workout history"
  ON workout_history FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own workout history" ON workout_history;
CREATE POLICY "Users can update own workout history"
  ON workout_history FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own workout history" ON workout_history;
CREATE POLICY "Users can delete own workout history"
  ON workout_history FOR DELETE
  USING (auth.uid()::text = user_id);

-- saved_workouts
ALTER TABLE saved_workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved workouts" ON saved_workouts;
CREATE POLICY "Users can view own saved workouts"
  ON saved_workouts FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own saved workouts" ON saved_workouts;
CREATE POLICY "Users can insert own saved workouts"
  ON saved_workouts FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own saved workouts" ON saved_workouts;
CREATE POLICY "Users can update own saved workouts"
  ON saved_workouts FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own saved workouts" ON saved_workouts;
CREATE POLICY "Users can delete own saved workouts"
  ON saved_workouts FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- PROGRESS TRACKING TABLES
-- ============================================================================

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own weight logs" ON weight_logs;
CREATE POLICY "Users can view own weight logs"
  ON weight_logs FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own weight logs" ON weight_logs;
CREATE POLICY "Users can insert own weight logs"
  ON weight_logs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own weight logs" ON weight_logs;
CREATE POLICY "Users can update own weight logs"
  ON weight_logs FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own weight logs" ON weight_logs;
CREATE POLICY "Users can delete own weight logs"
  ON weight_logs FOR DELETE
  USING (auth.uid()::text = user_id);

-- water_logs
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own water logs" ON water_logs;
CREATE POLICY "Users can view own water logs"
  ON water_logs FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own water logs" ON water_logs;
CREATE POLICY "Users can insert own water logs"
  ON water_logs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own water logs" ON water_logs;
CREATE POLICY "Users can update own water logs"
  ON water_logs FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own water logs" ON water_logs;
CREATE POLICY "Users can delete own water logs"
  ON water_logs FOR DELETE
  USING (auth.uid()::text = user_id);

-- progress_photos
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress photos" ON progress_photos;
CREATE POLICY "Users can view own progress photos"
  ON progress_photos FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own progress photos" ON progress_photos;
CREATE POLICY "Users can insert own progress photos"
  ON progress_photos FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own progress photos" ON progress_photos;
CREATE POLICY "Users can update own progress photos"
  ON progress_photos FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own progress photos" ON progress_photos;
CREATE POLICY "Users can delete own progress photos"
  ON progress_photos FOR DELETE
  USING (auth.uid()::text = user_id);

-- milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own milestones" ON milestones;
CREATE POLICY "Users can view own milestones"
  ON milestones FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own milestones" ON milestones;
CREATE POLICY "Users can insert own milestones"
  ON milestones FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own milestones" ON milestones;
CREATE POLICY "Users can update own milestones"
  ON milestones FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own milestones" ON milestones;
CREATE POLICY "Users can delete own milestones"
  ON milestones FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- GAMIFICATION TABLES
-- ============================================================================

ALTER TABLE gamification_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own gamification state" ON gamification_state;
CREATE POLICY "Users can view own gamification state"
  ON gamification_state FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own gamification state" ON gamification_state;
CREATE POLICY "Users can insert own gamification state"
  ON gamification_state FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own gamification state" ON gamification_state;
CREATE POLICY "Users can update own gamification state"
  ON gamification_state FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own gamification state" ON gamification_state;
CREATE POLICY "Users can delete own gamification state"
  ON gamification_state FOR DELETE
  USING (auth.uid()::text = user_id);

-- streaks
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own streaks" ON streaks;
CREATE POLICY "Users can view own streaks"
  ON streaks FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own streaks" ON streaks;
CREATE POLICY "Users can insert own streaks"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own streaks" ON streaks;
CREATE POLICY "Users can update own streaks"
  ON streaks FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own streaks" ON streaks;
CREATE POLICY "Users can delete own streaks"
  ON streaks FOR DELETE
  USING (auth.uid()::text = user_id);

-- badge_progress
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badge progress" ON badge_progress;
CREATE POLICY "Users can view own badge progress"
  ON badge_progress FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own badge progress" ON badge_progress;
CREATE POLICY "Users can insert own badge progress"
  ON badge_progress FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own badge progress" ON badge_progress;
CREATE POLICY "Users can update own badge progress"
  ON badge_progress FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own badge progress" ON badge_progress;
CREATE POLICY "Users can delete own badge progress"
  ON badge_progress FOR DELETE
  USING (auth.uid()::text = user_id);

-- challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own challenges" ON challenges;
CREATE POLICY "Users can view own challenges"
  ON challenges FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own challenges" ON challenges;
CREATE POLICY "Users can insert own challenges"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;
CREATE POLICY "Users can update own challenges"
  ON challenges FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own challenges" ON challenges;
CREATE POLICY "Users can delete own challenges"
  ON challenges FOR DELETE
  USING (auth.uid()::text = user_id);

-- user_gamification_profile
ALTER TABLE user_gamification_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own gamification profile" ON user_gamification_profile;
CREATE POLICY "Users can view own gamification profile"
  ON user_gamification_profile FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own gamification profile" ON user_gamification_profile;
CREATE POLICY "Users can insert own gamification profile"
  ON user_gamification_profile FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own gamification profile" ON user_gamification_profile;
CREATE POLICY "Users can update own gamification profile"
  ON user_gamification_profile FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own gamification profile" ON user_gamification_profile;
CREATE POLICY "Users can delete own gamification profile"
  ON user_gamification_profile FOR DELETE
  USING (auth.uid()::text = user_id);

-- loot_inventory
ALTER TABLE loot_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own loot inventory" ON loot_inventory;
CREATE POLICY "Users can view own loot inventory"
  ON loot_inventory FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own loot inventory" ON loot_inventory;
CREATE POLICY "Users can insert own loot inventory"
  ON loot_inventory FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own loot inventory" ON loot_inventory;
CREATE POLICY "Users can update own loot inventory"
  ON loot_inventory FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own loot inventory" ON loot_inventory;
CREATE POLICY "Users can delete own loot inventory"
  ON loot_inventory FOR DELETE
  USING (auth.uid()::text = user_id);

-- xp_transactions
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own xp transactions" ON xp_transactions;
CREATE POLICY "Users can view own xp transactions"
  ON xp_transactions FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own xp transactions" ON xp_transactions;
CREATE POLICY "Users can insert own xp transactions"
  ON xp_transactions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own xp transactions" ON xp_transactions;
CREATE POLICY "Users can update own xp transactions"
  ON xp_transactions FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own xp transactions" ON xp_transactions;
CREATE POLICY "Users can delete own xp transactions"
  ON xp_transactions FOR DELETE
  USING (auth.uid()::text = user_id);

-- ai_usage_log
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ai usage log" ON ai_usage_log;
CREATE POLICY "Users can view own ai usage log"
  ON ai_usage_log FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own ai usage log" ON ai_usage_log;
CREATE POLICY "Users can insert own ai usage log"
  ON ai_usage_log FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own ai usage log" ON ai_usage_log;
CREATE POLICY "Users can update own ai usage log"
  ON ai_usage_log FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own ai usage log" ON ai_usage_log;
CREATE POLICY "Users can delete own ai usage log"
  ON ai_usage_log FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- HEAT MAP / ACTIVITY TRACKING TABLES
-- ============================================================================

ALTER TABLE daily_activity_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity summary" ON daily_activity_summary;
CREATE POLICY "Users can view own activity summary"
  ON daily_activity_summary FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own activity summary" ON daily_activity_summary;
CREATE POLICY "Users can insert own activity summary"
  ON daily_activity_summary FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own activity summary" ON daily_activity_summary;
CREATE POLICY "Users can update own activity summary"
  ON daily_activity_summary FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own activity summary" ON daily_activity_summary;
CREATE POLICY "Users can delete own activity summary"
  ON daily_activity_summary FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- COMMIT TRANSACTION - All policies applied successfully
-- ============================================================================

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run these after applying migration)
-- ============================================================================
-- Check RLS is enabled on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
--
-- Check all policies:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
--
-- Count policies per table:
-- SELECT tablename, COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename ORDER BY tablename;
-- ============================================================================
