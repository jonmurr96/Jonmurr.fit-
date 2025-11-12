-- ============================================================================
-- JONMURR.FIT - COMPLETE DATABASE SETUP
-- Run this entire script in your Supabase SQL Editor to set up the database
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

-- ============================================================================
-- STEP 1: Create base users table with auto-profile creation
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Grant permissions on users table
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create trigger function with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, username, avatar_url, onboarding_complete)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON users;
CREATE POLICY "Users can delete own profile" ON users FOR DELETE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Allow profile creation during signup" ON users;
CREATE POLICY "Allow profile creation during signup" ON users FOR INSERT WITH CHECK (auth.uid()::text = id);

-- ============================================================================
-- STEP 2: Create onboarding data table
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

CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON user_onboarding_data(user_id);

ALTER TABLE user_onboarding_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own onboarding data" ON user_onboarding_data;
CREATE POLICY "Users can view own onboarding data" ON user_onboarding_data FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding data" ON user_onboarding_data;
CREATE POLICY "Users can insert own onboarding data" ON user_onboarding_data FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding data" ON user_onboarding_data;
CREATE POLICY "Users can update own onboarding data" ON user_onboarding_data FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own onboarding data" ON user_onboarding_data;
CREATE POLICY "Users can delete own onboarding data" ON user_onboarding_data FOR DELETE USING (auth.uid()::text = user_id);

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All migrations applied successfully!';
  RAISE NOTICE '✅ Users table created with auto-profile trigger';
  RAISE NOTICE '✅ Onboarding data table created';
  RAISE NOTICE '✅ RLS policies enabled on all tables';
  RAISE NOTICE '✅ You can now sign up users!';
END $$;
