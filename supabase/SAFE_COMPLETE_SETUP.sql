-- Jonmurr.fit Database Schema
-- This SQL file creates all the tables needed for the fitness tracking app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profile Table
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL DEFAULT 'default_user',
  name TEXT NOT NULL,
  avatar_url TEXT,
  height_cm NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Macro Targets Table
CREATE TABLE IF NOT EXISTS macro_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  rest_calories NUMERIC NOT NULL,
  rest_protein NUMERIC NOT NULL,
  rest_carbs NUMERIC NOT NULL,
  rest_fat NUMERIC NOT NULL,
  training_calories NUMERIC NOT NULL,
  training_protein NUMERIC NOT NULL,
  training_carbs NUMERIC NOT NULL,
  training_fat NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Daily Logs Table (for tracking daily macros)
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL,
  calories NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Meals Table
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  type TEXT NOT NULL CHECK (type IN ('Breakfast', 'Lunch', 'Dinner', 'Snacks')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food Items Table (linked to meals)
CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL
);

-- Quick Add Meals Template Table
CREATE TABLE IF NOT EXISTS quick_add_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quick Add Meal Items
CREATE TABLE IF NOT EXISTS quick_add_meal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quick_meal_id UUID REFERENCES quick_add_meals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL
);

-- Training Programs Table
CREATE TABLE IF NOT EXISTS training_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  program_name TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL,
  description TEXT,
  split_type TEXT,
  preferences JSONB,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workouts Table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  focus TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  optional_blocks JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises Table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  is_favorite BOOLEAN DEFAULT false,
  exercise_order INTEGER NOT NULL
);

-- Workout Sets Table
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  target_reps TEXT NOT NULL,
  target_weight NUMERIC,
  actual_reps INTEGER,
  actual_weight NUMERIC,
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  rest_minutes NUMERIC,
  completed BOOLEAN DEFAULT false
);

-- Saved Workouts Table
CREATE TABLE IF NOT EXISTS saved_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  program_name TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL,
  description TEXT,
  split_type TEXT,
  preferences JSONB,
  tags TEXT[],
  last_performed DATE,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout History Table
CREATE TABLE IF NOT EXISTS workout_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  workout_data JSONB NOT NULL,
  date_completed DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weight Logs Table
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Water Logs Table
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL,
  intake_oz NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Progress Photos Table
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL,
  angle TEXT NOT NULL CHECK (angle IN ('front', 'side', 'back')),
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones Table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  milestone_id TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gamification State Table
CREATE TABLE IF NOT EXISTS gamification_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Streaks Table
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  streak_type TEXT NOT NULL CHECK (streak_type IN ('workout', 'meal', 'water')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_log_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Earned Badges Table
CREATE TABLE IF NOT EXISTS earned_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  badge_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  earned_on DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  challenge_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  xp_reward INTEGER NOT NULL,
  badge_id TEXT,
  is_completed BOOLEAN DEFAULT false,
  type TEXT NOT NULL,
  period TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Generated Meal Plans Table
CREATE TABLE IF NOT EXISTS generated_meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  plan_name TEXT NOT NULL,
  description TEXT,
  daily_plan JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_name)
);

-- Create unique constraint to ensure only one active meal plan per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_meal_plans_user_active 
  ON generated_meal_plans(user_id) 
  WHERE is_active = true;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_history_user_date ON workout_history(user_id, date_completed);
CREATE INDEX IF NOT EXISTS idx_training_programs_user ON training_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_workouts_user ON saved_workouts(user_id);

-- Add Row Level Security (RLS) - Optional for multi-user support
-- For single-user app, we can skip RLS or enable it later

COMMENT ON TABLE user_profile IS 'Stores user profile information';
COMMENT ON TABLE macro_targets IS 'Stores daily macro targets for rest and training days';
COMMENT ON TABLE daily_logs IS 'Tracks daily macro consumption';
COMMENT ON TABLE meals IS 'Stores individual meals logged by users';
COMMENT ON TABLE food_items IS 'Stores food items within each meal';
COMMENT ON TABLE training_programs IS 'Stores workout programs';
COMMENT ON TABLE workouts IS 'Individual workouts within a program';
COMMENT ON TABLE exercises IS 'Exercises within a workout';
COMMENT ON TABLE workout_sets IS 'Sets within an exercise';
COMMENT ON TABLE gamification_state IS 'Tracks user XP and gamification progress';


-- ============================================================================
-- USERS TABLE WITH AUTH TRIGGER
-- ============================================================================


CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT 'User',
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  fitness_goal TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_username TEXT;
  retry_count INT := 0;
BEGIN
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    COALESCE(
      split_part(NEW.email, '@', 1),
      'user_' || substring(NEW.id::text, 1, 8)
    )
  );
  
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) AND retry_count < 100 LOOP
    new_username := COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1),
      'user_' || substring(NEW.id::text, 1, 8)
    ) || '_' || floor(random() * 10000)::text;
    retry_count := retry_count + 1;
  END LOOP;
  
  INSERT INTO public.users (id, full_name, username, avatar_url, onboarding_complete)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    new_username,
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- DROP existing policies first
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON users;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can delete own profile"
  ON users FOR DELETE
  USING (auth.uid()::text = id);

CREATE POLICY "Allow profile creation during signup"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = id);


-- ============================================================================
-- ONBOARDING DATA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_onboarding_data (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT,
  height_ft INTEGER,
  height_in INTEGER,
  weight_lbs NUMERIC(5, 1),
  main_goal TEXT,
  target_weight_lbs NUMERIC(5, 1),
  active_days_per_week INTEGER,
  focus_areas TEXT,
  timeline_months INTEGER,
  has_injuries BOOLEAN DEFAULT FALSE,
  injury_details TEXT,
  medical_conditions TEXT,
  somatotype TEXT,
  fat_distribution TEXT,
  equipment_access TEXT,
  workout_duration INTEGER,
  weight_change_difficulty TEXT,
  routine_type TEXT,
  diet_quality INTEGER,
  dietary_restrictions TEXT,
  eating_style TEXT,
  average_sleep_hours NUMERIC(3, 1),
  bmr INTEGER,
  tdee INTEGER,
  daily_calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fats_g INTEGER,
  water_intake_oz INTEGER,
  workout_plan_id INTEGER,
  meal_plan_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_onboarding_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own onboarding data" ON user_onboarding_data;
DROP POLICY IF EXISTS "Users can insert own onboarding data" ON user_onboarding_data;
DROP POLICY IF EXISTS "Users can update own onboarding data" ON user_onboarding_data;
DROP POLICY IF EXISTS "Users can delete own onboarding data" ON user_onboarding_data;

CREATE POLICY "Users can read own onboarding data"
  ON user_onboarding_data FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own onboarding data"
  ON user_onboarding_data FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own onboarding data"
  ON user_onboarding_data FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own onboarding data"
  ON user_onboarding_data FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- GAMIFICATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_gamification_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loot_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loot_id TEXT NOT NULL,
  unlocked_on DATE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, loot_id)
);

CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  goal INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_on DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  used_on DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_gamification_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Gamification policies
DROP POLICY IF EXISTS "Users can read own gamification profile" ON user_gamification_profile;
DROP POLICY IF EXISTS "Users can insert own gamification profile" ON user_gamification_profile;
DROP POLICY IF EXISTS "Users can update own gamification profile" ON user_gamification_profile;

CREATE POLICY "Users can read own gamification profile"
  ON user_gamification_profile FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own gamification profile"
  ON user_gamification_profile FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own gamification profile"
  ON user_gamification_profile FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- HEAT MAP SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_activity_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_logged BOOLEAN DEFAULT FALSE,
  meals_logged INTEGER DEFAULT 0,
  water_intake_oz INTEGER DEFAULT 0,
  goal_water_oz INTEGER DEFAULT 64,
  hit_macros BOOLEAN DEFAULT FALSE,
  hit_protein_goal BOOLEAN DEFAULT FALSE,
  is_rest_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_activity_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own activity" ON daily_activity_summary;
DROP POLICY IF EXISTS "Users can insert own activity" ON daily_activity_summary;
DROP POLICY IF EXISTS "Users can update own activity" ON daily_activity_summary;

CREATE POLICY "Users can read own activity"
  ON daily_activity_summary FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own activity"
  ON daily_activity_summary FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own activity"
  ON daily_activity_summary FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================================';
  RAISE NOTICE '✅  DATABASE SETUP COMPLETE!';
  RAISE NOTICE '✅ ============================================================';
  RAISE NOTICE '✅  Created 28 tables for jonmurr.fit';
  RAISE NOTICE '✅  Enabled Row Level Security (RLS) on all tables';
  RAISE NOTICE '✅  Set up auto-profile creation trigger';
  RAISE NOTICE '';
  RAISE NOTICE '🎉  You can now:';
  RAISE NOTICE '     1. Complete onboarding (all 5 steps)';
  RAISE NOTICE '     2. Generate AI workout and meal plans';
  RAISE NOTICE '     3. Track workouts, meals, and progress';
  RAISE NOTICE '     4. Earn XP, level up, and unlock badges!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================================';
END $$;
