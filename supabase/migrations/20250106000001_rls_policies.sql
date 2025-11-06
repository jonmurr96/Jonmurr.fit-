-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_add_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Macro targets policies
CREATE POLICY "Users can view their own macro targets"
  ON public.macro_targets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own macro targets"
  ON public.macro_targets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own macro targets"
  ON public.macro_targets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own macro targets"
  ON public.macro_targets FOR DELETE
  USING (auth.uid() = user_id);

-- Weight logs policies
CREATE POLICY "Users can view their own weight logs"
  ON public.weight_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight logs"
  ON public.weight_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight logs"
  ON public.weight_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight logs"
  ON public.weight_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Water logs policies
CREATE POLICY "Users can view their own water logs"
  ON public.water_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water logs"
  ON public.water_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water logs"
  ON public.water_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water logs"
  ON public.water_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Food items policies
CREATE POLICY "Users can view their own food items"
  ON public.food_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food items"
  ON public.food_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food items"
  ON public.food_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food items"
  ON public.food_items FOR DELETE
  USING (auth.uid() = user_id);

-- Meals policies
CREATE POLICY "Users can view their own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

-- Quick add meals policies
CREATE POLICY "Users can view their own quick add meals"
  ON public.quick_add_meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quick add meals"
  ON public.quick_add_meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick add meals"
  ON public.quick_add_meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick add meals"
  ON public.quick_add_meals FOR DELETE
  USING (auth.uid() = user_id);

-- Training programs policies
CREATE POLICY "Users can view their own training programs"
  ON public.training_programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training programs"
  ON public.training_programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training programs"
  ON public.training_programs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training programs"
  ON public.training_programs FOR DELETE
  USING (auth.uid() = user_id);

-- Saved workouts policies
CREATE POLICY "Users can view their own saved workouts"
  ON public.saved_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved workouts"
  ON public.saved_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved workouts"
  ON public.saved_workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved workouts"
  ON public.saved_workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Workout history policies
CREATE POLICY "Users can view their own workout history"
  ON public.workout_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout history"
  ON public.workout_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout history"
  ON public.workout_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout history"
  ON public.workout_history FOR DELETE
  USING (auth.uid() = user_id);

-- Favorite exercises policies
CREATE POLICY "Users can view their own favorite exercises"
  ON public.favorite_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite exercises"
  ON public.favorite_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite exercises"
  ON public.favorite_exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite exercises"
  ON public.favorite_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Workout drafts policies
CREATE POLICY "Users can view their own workout drafts"
  ON public.workout_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout drafts"
  ON public.workout_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout drafts"
  ON public.workout_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout drafts"
  ON public.workout_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Photo bundles policies
CREATE POLICY "Users can view their own photo bundles"
  ON public.photo_bundles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photo bundles"
  ON public.photo_bundles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photo bundles"
  ON public.photo_bundles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photo bundles"
  ON public.photo_bundles FOR DELETE
  USING (auth.uid() = user_id);

-- Milestones policies
CREATE POLICY "Users can view their own milestones"
  ON public.milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
  ON public.milestones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestones"
  ON public.milestones FOR DELETE
  USING (auth.uid() = user_id);

-- Streaks policies
CREATE POLICY "Users can view their own streaks"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks"
  ON public.streaks FOR DELETE
  USING (auth.uid() = user_id);

-- Meal plans policies
CREATE POLICY "Users can view their own meal plans"
  ON public.meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans"
  ON public.meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON public.meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
  ON public.meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON public.user_settings FOR DELETE
  USING (auth.uid() = user_id);
