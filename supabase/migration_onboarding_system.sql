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
