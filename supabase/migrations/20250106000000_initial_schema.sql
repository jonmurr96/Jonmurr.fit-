-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users profile table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  height_cm NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create macro targets table
CREATE TABLE public.macro_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('rest', 'training')),
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fat INTEGER NOT NULL,
  auto_adjust BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Create weight logs table
CREATE TABLE public.weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create water logs table
CREATE TABLE public.water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  intake_oz INTEGER NOT NULL DEFAULT 0,
  goal_oz INTEGER NOT NULL DEFAULT 128,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create food items table
CREATE TABLE public.food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fat INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  date DATE NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quick add meals table (meal templates)
CREATE TABLE public.quick_add_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create training programs table
CREATE TABLE public.training_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL,
  split_type TEXT NOT NULL,
  workouts JSONB NOT NULL,
  preferences JSONB,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create saved workouts table (workout library)
CREATE TABLE public.saved_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL,
  split_type TEXT NOT NULL,
  workouts JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  last_performed DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workout history table
CREATE TABLE public.workout_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_data JSONB NOT NULL,
  date_completed DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create favorite exercises table
CREATE TABLE public.favorite_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, (exercise_data->>'name'))
);

-- Create workout drafts table
CREATE TABLE public.workout_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_name TEXT,
  workouts JSONB NOT NULL,
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create photo bundles table (progress photos)
CREATE TABLE public.photo_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  front_url TEXT,
  side_url TEXT,
  back_url TEXT,
  weight_kg NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type, date)
);

-- Create streaks table
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL CHECK (streak_type IN ('workout', 'nutrition', 'water')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Create meal plans table
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  description TEXT,
  daily_plan JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  water_unit TEXT DEFAULT 'oz' CHECK (water_unit IN ('oz', 'ml')),
  current_weight_kg NUMERIC(5,2),
  weight_goal_kg NUMERIC(5,2),
  progression_preference TEXT DEFAULT 'Balanced' CHECK (progression_preference IN ('Conservative', 'Balanced', 'Aggressive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_meals_user_date ON public.meals(user_id, date DESC);
CREATE INDEX idx_food_items_meal ON public.food_items(meal_id);
CREATE INDEX idx_weight_logs_user_date ON public.weight_logs(user_id, date DESC);
CREATE INDEX idx_water_logs_user_date ON public.water_logs(user_id, date DESC);
CREATE INDEX idx_workout_history_user_date ON public.workout_history(user_id, date_completed DESC);
CREATE INDEX idx_training_programs_active ON public.training_programs(user_id, is_active);
CREATE INDEX idx_meal_plans_active ON public.meal_plans(user_id, is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_macro_targets_updated_at BEFORE UPDATE ON public.macro_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_water_logs_updated_at BEFORE UPDATE ON public.water_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quick_add_meals_updated_at BEFORE UPDATE ON public.quick_add_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_programs_updated_at BEFORE UPDATE ON public.training_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_workouts_updated_at BEFORE UPDATE ON public.saved_workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  -- Create default macro targets
  INSERT INTO public.macro_targets (user_id, type, calories, protein, carbs, fat)
  VALUES
    (NEW.id, 'rest', 2200, 180, 200, 70),
    (NEW.id, 'training', 2800, 180, 300, 100);

  -- Create default user settings
  INSERT INTO public.user_settings (user_id, current_weight_kg, weight_goal_kg)
  VALUES (NEW.id, 80, 75);

  -- Initialize streaks
  INSERT INTO public.streaks (user_id, streak_type, current_streak, longest_streak)
  VALUES
    (NEW.id, 'workout', 0, 0),
    (NEW.id, 'nutrition', 0, 0),
    (NEW.id, 'water', 0, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update streaks
CREATE OR REPLACE FUNCTION public.update_streak(
  p_user_id UUID,
  p_streak_type TEXT,
  p_activity_date DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  -- Get current streak data
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM public.streaks
  WHERE user_id = p_user_id AND streak_type = p_streak_type;

  -- Calculate new streak
  IF v_last_date IS NULL THEN
    v_new_streak := 1;
  ELSIF p_activity_date = v_last_date THEN
    -- Same day, don't increment
    RETURN;
  ELSIF p_activity_date = v_last_date + INTERVAL '1 day' THEN
    -- Consecutive day
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Streak broken
    v_new_streak := 1;
  END IF;

  -- Update streak
  UPDATE public.streaks
  SET
    current_streak = v_new_streak,
    longest_streak = GREATEST(v_longest_streak, v_new_streak),
    last_activity_date = p_activity_date,
    updated_at = NOW()
  WHERE user_id = p_user_id AND streak_type = p_streak_type;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update workout streak
CREATE OR REPLACE FUNCTION public.auto_update_workout_streak()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_streak(NEW.user_id, 'workout', NEW.date_completed);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workout streak
CREATE TRIGGER on_workout_completed
  AFTER INSERT ON public.workout_history
  FOR EACH ROW EXECUTE FUNCTION public.auto_update_workout_streak();

-- Function to automatically update nutrition streak
CREATE OR REPLACE FUNCTION public.auto_update_nutrition_streak()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_streak(NEW.user_id, 'nutrition', NEW.date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for nutrition streak
CREATE TRIGGER on_meal_logged
  AFTER INSERT ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.auto_update_nutrition_streak();

-- Function to automatically update water streak
CREATE OR REPLACE FUNCTION public.auto_update_water_streak()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.intake_oz >= NEW.goal_oz THEN
    PERFORM public.update_streak(NEW.user_id, 'water', NEW.date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for water streak
CREATE TRIGGER on_water_goal_met
  AFTER INSERT OR UPDATE ON public.water_logs
  FOR EACH ROW EXECUTE FUNCTION public.auto_update_water_streak();
