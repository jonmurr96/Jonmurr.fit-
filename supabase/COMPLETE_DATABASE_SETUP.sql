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
-- Create users table to store user profiles
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  fitness_goal TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create function to automatically create user profile when auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, username, avatar_url, onboarding_complete)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run the function after a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  USING (auth.uid()::text = id);

-- Create RLS policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Create RLS policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON users
  FOR DELETE
  USING (auth.uid()::text = id);

-- Note: INSERT is handled by the trigger from auth.users
-- We don't need a policy for INSERT since profiles are auto-created

COMMENT ON TABLE users IS 'User profile data linked to auth.users via id';
COMMENT ON COLUMN users.id IS 'References auth.users.id';
COMMENT ON COLUMN users.onboarding_complete IS 'Whether user has completed the onboarding flow';
-- Migration: Smart Onboarding System
-- Creates tables for storing user onboarding questionnaire data and calculated results

-- 1. User Onboarding Data Table
CREATE TABLE IF NOT EXISTS user_onboarding_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  
  -- Personal Info
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  height_ft INTEGER NOT NULL CHECK (height_ft >= 3 AND height_ft <= 8),
  height_in INTEGER NOT NULL CHECK (height_in >= 0 AND height_in <= 11),
  weight_lbs NUMERIC(5, 1) NOT NULL CHECK (weight_lbs > 0),
  
  -- Fitness Goals
  main_goal TEXT NOT NULL CHECK (main_goal IN ('lose_weight', 'gain_weight', 'maintain_weight', 'build_muscle', 'build_endurance', 'general_fitness')),
  target_weight_lbs NUMERIC(5, 1),
  active_days_per_week INTEGER NOT NULL CHECK (active_days_per_week >= 1 AND active_days_per_week <= 7),
  focus_areas JSONB DEFAULT '[]',
  timeline_months INTEGER NOT NULL CHECK (timeline_months >= 1 AND timeline_months <= 24),
  has_injuries BOOLEAN DEFAULT FALSE,
  injury_details TEXT,
  medical_conditions JSONB DEFAULT '[]',
  
  -- Body Type
  somatotype TEXT CHECK (somatotype IN ('ectomorph', 'mesomorph', 'endomorph')),
  fat_distribution TEXT,
  
  -- Workout Preferences
  equipment_access TEXT NOT NULL CHECK (equipment_access IN ('bodyweight', 'dumbbells', 'full_gym')),
  workout_duration TEXT NOT NULL CHECK (workout_duration IN ('20-30', '30-60', '60-90', '90+')),
  weight_change_difficulty TEXT CHECK (weight_change_difficulty IN ('hard_to_gain', 'hard_to_lose', 'build_muscle_effectively')),
  routine_type TEXT CHECK (routine_type IN ('fun_based', 'balanced', 'progressive_overload')),
  
  -- Diet & Lifestyle
  diet_quality INTEGER CHECK (diet_quality >= 1 AND diet_quality <= 5),
  dietary_restrictions JSONB DEFAULT '[]',
  eating_style TEXT CHECK (eating_style IN ('emotional', 'bored', 'unconscious', 'habitual', 'energy_driven')),
  average_sleep_hours NUMERIC(3, 1) CHECK (average_sleep_hours >= 0 AND average_sleep_hours <= 24),
  
  -- Calculated Results
  bmr NUMERIC(7, 2),
  tdee NUMERIC(7, 2),
  daily_calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fats_g INTEGER,
  water_intake_oz INTEGER,
  
  -- Generated Plan References
  workout_plan_id UUID,
  meal_plan_id UUID,
  
  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON user_onboarding_data(user_id);

-- Enable Row Level Security
ALTER TABLE user_onboarding_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read own onboarding data" ON user_onboarding_data;
CREATE POLICY "Users can read own onboarding data"
  ON user_onboarding_data
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding data" ON user_onboarding_data;
CREATE POLICY "Users can insert own onboarding data"
  ON user_onboarding_data
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding data" ON user_onboarding_data;
CREATE POLICY "Users can update own onboarding data"
  ON user_onboarding_data
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own onboarding data" ON user_onboarding_data;
CREATE POLICY "Users can delete own onboarding data"
  ON user_onboarding_data
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Comments for documentation
COMMENT ON TABLE user_onboarding_data IS 'Stores user onboarding questionnaire responses and calculated fitness metrics';
COMMENT ON COLUMN user_onboarding_data.user_id IS 'References users.id';
COMMENT ON COLUMN user_onboarding_data.bmr IS 'Basal Metabolic Rate calculated using Mifflin-St Jeor equation';
COMMENT ON COLUMN user_onboarding_data.tdee IS 'Total Daily Energy Expenditure (BMR × activity factor)';
COMMENT ON COLUMN user_onboarding_data.workout_plan_id IS 'References training_programs.id for AI-generated workout plan';
COMMENT ON COLUMN user_onboarding_data.meal_plan_id IS 'References generated_meal_plans.id for AI-generated nutrition plan';
-- Migration: Enhanced Gamification System v2
-- Adds support for 100-level system, loot, expanded challenges, and analytics

-- 1. Create User Gamification Profile Table
CREATE TABLE IF NOT EXISTS user_gamification_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL DEFAULT 'default_user',
  numeric_level INTEGER DEFAULT 1 CHECK (numeric_level >= 1 AND numeric_level <= 100),
  rank_title TEXT DEFAULT 'Newbie' CHECK (rank_title IN ('Newbie', 'Rookie', 'Unit', 'Gym Rat', 'Gym Addict', 'Bodybuilder')),
  total_xp INTEGER DEFAULT 0,
  xp_multiplier NUMERIC DEFAULT 1.0,
  perks_unlocked JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Loot Inventory Table
CREATE TABLE IF NOT EXISTS loot_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  loot_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tip', 'exercise', 'theme', 'xp_boost', 'mystery')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  icon TEXT NOT NULL,
  value JSONB,
  unlocked_on DATE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, loot_id)
);

-- 3. Create Challenge Progress Tracking Table (for historical data)
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  challenge_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  progress INTEGER DEFAULT 0,
  completed_on DATE,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add columns to existing gamification_state table (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='gamification_state' AND column_name='level_up_count') THEN
    ALTER TABLE gamification_state ADD COLUMN level_up_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='gamification_state' AND column_name='last_level_up') THEN
    ALTER TABLE gamification_state ADD COLUMN last_level_up TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='gamification_state' AND column_name='total_xp_earned') THEN
    ALTER TABLE gamification_state ADD COLUMN total_xp_earned INTEGER DEFAULT 0;
  END IF;
END $$;

-- 5. Add columns to earned_badges table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='earned_badges' AND column_name='rank_when_earned') THEN
    ALTER TABLE earned_badges ADD COLUMN rank_when_earned TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='earned_badges' AND column_name='level_when_earned') THEN
    ALTER TABLE earned_badges ADD COLUMN level_when_earned INTEGER;
  END IF;
END $$;

-- 6. Create AI Usage Tracking Table (for AI-related badges and XP)
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  usage_type TEXT NOT NULL CHECK (usage_type IN ('workout_plan', 'meal_plan', 'coaching')),
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create XP Transactions Log (for analytics and debugging)
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source TEXT, -- e.g., 'workout', 'meal', 'water', 'challenge', 'streak_bonus', 'loot'
  multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loot_inventory_user ON loot_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_week ON challenge_progress(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_date ON xp_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(user_id, source);

-- 9. Add comments
COMMENT ON TABLE user_gamification_profile IS 'Extended gamification profile with 100-level system and perks';
COMMENT ON TABLE loot_inventory IS 'Tracks unlocked loot items (tips, exercises, themes, XP boosts)';
COMMENT ON TABLE challenge_progress IS 'Historical record of challenge completions for analytics';
COMMENT ON TABLE ai_usage_log IS 'Tracks AI feature usage for badges and XP rewards';
COMMENT ON TABLE xp_transactions IS 'Audit log of all XP gains for analytics and debugging';

-- 10. Insert default gamification profile if it doesn't exist
INSERT INTO user_gamification_profile (user_id, numeric_level, rank_title, total_xp)
VALUES ('default_user', 1, 'Newbie', 0)
ON CONFLICT (user_id) DO NOTHING;

-- 11. Migration: Sync existing XP to user_gamification_profile and calculate level/rank
-- This converts existing gamification_state XP into the new level system
-- XP Formula: totalXP = 1.99 * (level ^ 2.2)

-- Function to calculate numeric level from XP
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  level INTEGER := 1;
  required_xp INTEGER;
BEGIN
  -- Loop through levels 1-100 to find the highest level achievable with given XP
  FOR i IN 1..100 LOOP
    required_xp := FLOOR(1.99 * POW(i, 2.2));
    IF xp_amount >= required_xp THEN
      level := i;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  RETURN level;
END;
$$ LANGUAGE plpgsql;

-- Function to get rank title from numeric level
CREATE OR REPLACE FUNCTION get_rank_from_level(level INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF level >= 1 AND level <= 10 THEN RETURN 'Newbie';
  ELSIF level >= 11 AND level <= 25 THEN RETURN 'Rookie';
  ELSIF level >= 26 AND level <= 40 THEN RETURN 'Unit';
  ELSIF level >= 41 AND level <= 60 THEN RETURN 'Gym Rat';
  ELSIF level >= 61 AND level <= 80 THEN RETURN 'Gym Addict';
  ELSIF level >= 81 AND level <= 100 THEN RETURN 'Bodybuilder';
  ELSE RETURN 'Newbie';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update ALL user_gamification_profile rows with calculated values from gamification_state
UPDATE user_gamification_profile ugp
SET 
  total_xp = COALESCE(gs.xp, 0),
  numeric_level = calculate_level_from_xp(COALESCE(gs.xp, 0)),
  rank_title = get_rank_from_level(calculate_level_from_xp(COALESCE(gs.xp, 0))),
  updated_at = NOW()
FROM gamification_state gs
WHERE ugp.user_id = gs.user_id;

-- Drop the temporary functions after migration
DROP FUNCTION IF EXISTS calculate_level_from_xp(INTEGER);
DROP FUNCTION IF EXISTS get_rank_from_level(INTEGER);
-- Heat Map System Migration
-- Creates daily_activity_summary table to track daily user activity for heat map visualization

-- Create daily_activity_summary table
CREATE TABLE IF NOT EXISTS daily_activity_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'default_user',
    date DATE NOT NULL,
    
    -- Activity tracking
    workout_logged BOOLEAN DEFAULT FALSE,
    meals_logged INTEGER DEFAULT 0,
    water_intake_oz DECIMAL(5,1) DEFAULT 0,
    goal_water_oz DECIMAL(5,1) DEFAULT 0,
    
    -- Goal tracking
    hit_macros BOOLEAN DEFAULT FALSE,
    hit_protein_goal BOOLEAN DEFAULT FALSE,
    
    -- Manual overrides
    is_rest_day BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one row per user per day
    UNIQUE(user_id, date)
);

-- Create index for fast lookups by user and date range
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date 
ON daily_activity_summary(user_id, date DESC);

-- Create index for querying by month
CREATE INDEX IF NOT EXISTS idx_daily_activity_month 
ON daily_activity_summary(user_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));

-- Enable Row Level Security
ALTER TABLE daily_activity_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own activity summaries
CREATE POLICY daily_activity_user_policy ON daily_activity_summary
    FOR ALL
    USING (user_id = 'default_user')
    WITH CHECK (user_id = 'default_user');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_activity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_daily_activity_timestamp_trigger
    BEFORE UPDATE ON daily_activity_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_activity_timestamp();

-- Helper function to upsert daily activity
CREATE OR REPLACE FUNCTION upsert_daily_activity(
    p_user_id TEXT,
    p_date DATE,
    p_workout_logged BOOLEAN DEFAULT NULL,
    p_meals_logged INTEGER DEFAULT NULL,
    p_water_intake_oz DECIMAL DEFAULT NULL,
    p_goal_water_oz DECIMAL DEFAULT NULL,
    p_hit_macros BOOLEAN DEFAULT NULL,
    p_hit_protein_goal BOOLEAN DEFAULT NULL,
    p_is_rest_day BOOLEAN DEFAULT NULL
)
RETURNS daily_activity_summary AS $$
DECLARE
    result daily_activity_summary;
BEGIN
    INSERT INTO daily_activity_summary (
        user_id, 
        date,
        workout_logged,
        meals_logged,
        water_intake_oz,
        goal_water_oz,
        hit_macros,
        hit_protein_goal,
        is_rest_day
    )
    VALUES (
        p_user_id,
        p_date,
        COALESCE(p_workout_logged, FALSE),
        COALESCE(p_meals_logged, 0),
        COALESCE(p_water_intake_oz, 0),
        COALESCE(p_goal_water_oz, 0),
        COALESCE(p_hit_macros, FALSE),
        COALESCE(p_hit_protein_goal, FALSE),
        COALESCE(p_is_rest_day, FALSE)
    )
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        workout_logged = COALESCE(p_workout_logged, daily_activity_summary.workout_logged),
        meals_logged = COALESCE(p_meals_logged, daily_activity_summary.meals_logged),
        water_intake_oz = COALESCE(p_water_intake_oz, daily_activity_summary.water_intake_oz),
        goal_water_oz = COALESCE(p_goal_water_oz, daily_activity_summary.goal_water_oz),
        hit_macros = COALESCE(p_hit_macros, daily_activity_summary.hit_macros),
        hit_protein_goal = COALESCE(p_hit_protein_goal, daily_activity_summary.hit_protein_goal),
        is_rest_day = COALESCE(p_is_rest_day, daily_activity_summary.is_rest_day),
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
