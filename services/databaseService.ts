import { supabase } from './supabaseClient';
import {
  UserProfile,
  MacroTargets,
  WeightLog,
  WaterLog,
  Meal,
  FoodItem,
  TrainingProgram,
  SavedWorkout,
  WorkoutHistory,
  Exercise,
  WorkoutDraft,
  PhotoBundle,
  Milestone,
  GeneratedMealPlan
} from '../types';

// ============================================================================
// PROFILES
// ============================================================================

export const getProfile = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const updateProfile = async (updates: Partial<UserProfile>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: updates.name,
      avatar_url: updates.avatarUrl,
      height_cm: updates.heightCm
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================================================
// MACRO TARGETS
// ============================================================================

export const getMacroTargets = async (): Promise<MacroTargets> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('macro_targets')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;

  const rest = data.find(t => t.type === 'rest');
  const training = data.find(t => t.type === 'training');

  return {
    rest: rest ? {
      calories: rest.calories,
      protein: rest.protein,
      carbs: rest.carbs,
      fat: rest.fat
    } : { calories: 2200, protein: 180, carbs: 200, fat: 70 },
    training: training ? {
      calories: training.calories,
      protein: training.protein,
      carbs: training.carbs,
      fat: training.fat
    } : { calories: 2800, protein: 180, carbs: 300, fat: 100 }
  };
};

export const updateMacroTargets = async (targets: MacroTargets) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updates = [
    {
      user_id: user.id,
      type: 'rest' as const,
      ...targets.rest
    },
    {
      user_id: user.id,
      type: 'training' as const,
      ...targets.training
    }
  ];

  const { error } = await supabase
    .from('macro_targets')
    .upsert(updates, { onConflict: 'user_id,type' });

  if (error) throw error;
};

// ============================================================================
// WEIGHT LOGS
// ============================================================================

export const getWeightLogs = async (): Promise<WeightLog[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  if (error) throw error;
  return data.map(log => ({ date: log.date, weightKg: log.weight_kg }));
};

export const addWeightLog = async (log: WeightLog) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('weight_logs')
    .upsert({
      user_id: user.id,
      date: log.date,
      weight_kg: log.weightKg
    }, { onConflict: 'user_id,date' });

  if (error) throw error;
};

export const deleteWeightLog = async (date: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('weight_logs')
    .delete()
    .eq('user_id', user.id)
    .eq('date', date);

  if (error) throw error;
};

// ============================================================================
// WATER LOGS
// ============================================================================

export const getWaterLogs = async (): Promise<WaterLog[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30);

  if (error) throw error;
  return data.map(log => ({ date: log.date, intake: log.intake_oz }));
};

export const updateWaterLog = async (date: string, intake: number, goal: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('water_logs')
    .upsert({
      user_id: user.id,
      date,
      intake_oz: intake,
      goal_oz: goal
    }, { onConflict: 'user_id,date' });

  if (error) throw error;
};

// ============================================================================
// MEALS & FOOD ITEMS
// ============================================================================

export const getMealsForDate = async (date: string): Promise<Meal[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: mealsData, error: mealsError } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('timestamp', { ascending: true });

  if (mealsError) throw mealsError;

  const meals: Meal[] = [];
  for (const meal of mealsData) {
    const { data: itemsData, error: itemsError } = await supabase
      .from('food_items')
      .select('*')
      .eq('meal_id', meal.id);

    if (itemsError) throw itemsError;

    meals.push({
      id: meal.id,
      type: meal.type as Meal['type'],
      timestamp: new Date(meal.timestamp),
      items: itemsData.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      }))
    });
  }

  return meals;
};

export const addMeal = async (type: Meal['type'], items: FoodItem[], date: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Insert meal
  const { data: mealData, error: mealError } = await supabase
    .from('meals')
    .insert({
      user_id: user.id,
      type,
      date,
      timestamp: new Date().toISOString()
    })
    .select()
    .single();

  if (mealError) throw mealError;

  // Insert food items
  const foodItems = items.map(item => ({
    user_id: user.id,
    meal_id: mealData.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat
  }));

  const { error: itemsError } = await supabase
    .from('food_items')
    .insert(foodItems);

  if (itemsError) throw itemsError;

  return mealData.id;
};

export const deleteFoodItem = async (mealId: string, itemIndex: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get all items for this meal
  const { data: items, error: fetchError } = await supabase
    .from('food_items')
    .select('*')
    .eq('meal_id', mealId)
    .order('created_at', { ascending: true });

  if (fetchError) throw fetchError;

  if (items && items[itemIndex]) {
    const { error: deleteError } = await supabase
      .from('food_items')
      .delete()
      .eq('id', items[itemIndex].id);

    if (deleteError) throw deleteError;
  }

  // Check if meal has any items left
  const { data: remainingItems, error: checkError } = await supabase
    .from('food_items')
    .select('id')
    .eq('meal_id', mealId);

  if (checkError) throw checkError;

  // If no items left, delete the meal
  if (!remainingItems || remainingItems.length === 0) {
    const { error: deleteMealError } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (deleteMealError) throw deleteMealError;
  }
};

// ============================================================================
// QUICK ADD MEALS
// ============================================================================

export const getQuickAddMeals = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('quick_add_meals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(qam => ({
    name: qam.name,
    items: qam.items as FoodItem[]
  }));
};

export const addQuickAddMeal = async (name: string, items: FoodItem[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('quick_add_meals')
    .insert({
      user_id: user.id,
      name,
      items: items as any
    });

  if (error) throw error;
};

// ============================================================================
// TRAINING PROGRAMS
// ============================================================================

export const getActiveTrainingProgram = async (): Promise<TrainingProgram | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('training_programs')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  if (!data) return null;

  return {
    programName: data.program_name,
    description: data.description || undefined,
    durationWeeks: data.duration_weeks,
    splitType: data.split_type,
    workouts: data.workouts as any,
    preferences: data.preferences as any
  };
};

export const saveTrainingProgram = async (program: TrainingProgram) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Deactivate any existing active programs
  await supabase
    .from('training_programs')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true);

  const { error } = await supabase
    .from('training_programs')
    .insert({
      user_id: user.id,
      program_name: program.programName,
      description: program.description,
      duration_weeks: program.durationWeeks,
      split_type: program.splitType,
      workouts: program.workouts as any,
      preferences: program.preferences as any,
      is_active: true
    });

  if (error) throw error;
};

export const updateTrainingProgram = async (program: TrainingProgram) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('training_programs')
    .update({
      program_name: program.programName,
      description: program.description,
      duration_weeks: program.durationWeeks,
      split_type: program.splitType,
      workouts: program.workouts as any,
      preferences: program.preferences as any
    })
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) throw error;
};

export const deleteTrainingProgram = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('training_programs')
    .delete()
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) throw error;
};

// ============================================================================
// SAVED WORKOUTS
// ============================================================================

export const getSavedWorkouts = async (): Promise<SavedWorkout[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('saved_workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return data.map(sw => ({
    id: sw.id,
    programName: sw.program_name,
    description: sw.description || undefined,
    durationWeeks: sw.duration_weeks,
    splitType: sw.split_type,
    workouts: sw.workouts as any,
    tags: sw.tags,
    isPinned: sw.is_pinned,
    lastPerformed: sw.last_performed || undefined
  }));
};

export const addSavedWorkout = async (workout: Omit<SavedWorkout, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('saved_workouts')
    .insert({
      user_id: user.id,
      program_name: workout.programName,
      description: workout.description,
      duration_weeks: workout.durationWeeks,
      split_type: workout.splitType,
      workouts: workout.workouts as any,
      tags: workout.tags,
      is_pinned: workout.isPinned,
      last_performed: workout.lastPerformed
    });

  if (error) throw error;
};

export const updateSavedWorkout = async (id: string, updates: Partial<SavedWorkout>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('saved_workouts')
    .update({
      program_name: updates.programName,
      description: updates.description,
      duration_weeks: updates.durationWeeks,
      split_type: updates.splitType,
      workouts: updates.workouts as any,
      tags: updates.tags,
      is_pinned: updates.isPinned,
      last_performed: updates.lastPerformed
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const deleteSavedWorkout = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('saved_workouts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

// ============================================================================
// WORKOUT HISTORY
// ============================================================================

export const getWorkoutHistory = async (): Promise<WorkoutHistory> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('workout_history')
    .select('*')
    .eq('user_id', user.id)
    .order('date_completed', { ascending: false });

  if (error) throw error;

  return data.map(wh => ({
    ...(wh.workout_data as any),
    dateCompleted: wh.date_completed
  }));
};

export const addWorkoutHistory = async (workout: any, dateCompleted: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('workout_history')
    .insert({
      user_id: user.id,
      workout_data: workout as any,
      date_completed: dateCompleted
    });

  if (error) throw error;
};

// ============================================================================
// FAVORITE EXERCISES
// ============================================================================

export const getFavoriteExercises = async (): Promise<Exercise[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('favorite_exercises')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  return data.map(fe => fe.exercise_data as Exercise);
};

export const addFavoriteExercise = async (exercise: Exercise) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('favorite_exercises')
    .insert({
      user_id: user.id,
      exercise_data: exercise as any
    });

  if (error && error.code !== '23505') throw error; // 23505 = unique constraint violation
};

export const removeFavoriteExercise = async (exerciseName: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('favorite_exercises')
    .delete()
    .eq('user_id', user.id)
    .eq('exercise_data->>name', exerciseName);

  if (error) throw error;
};

// ============================================================================
// WORKOUT DRAFTS
// ============================================================================

export const getWorkoutDrafts = async (): Promise<WorkoutDraft[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('workout_drafts')
    .select('*')
    .eq('user_id', user.id)
    .order('last_modified', { ascending: false })
    .limit(5);

  if (error) throw error;

  return data.map(wd => ({
    id: wd.id,
    programName: wd.program_name || '',
    workouts: wd.workouts as any,
    lastModified: wd.last_modified,
    durationWeeks: 4,
    splitType: ''
  }));
};

export const saveWorkoutDraft = async (draft: Partial<WorkoutDraft>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('workout_drafts')
    .upsert({
      id: draft.id,
      user_id: user.id,
      program_name: draft.programName,
      workouts: draft.workouts as any,
      last_modified: new Date().toISOString()
    });

  if (error) throw error;
};

export const deleteWorkoutDraft = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('workout_drafts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

// ============================================================================
// MILESTONES
// ============================================================================

export const getMilestones = async (): Promise<Milestone[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;
  return data.map(m => ({
    id: m.id,
    type: m.type,
    title: m.title,
    description: m.description || '',
    date: m.date
  }));
};

export const addMilestone = async (milestone: Omit<Milestone, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('milestones')
    .insert({
      user_id: user.id,
      type: milestone.type,
      title: milestone.title,
      description: milestone.description,
      date: milestone.date
    });

  if (error && error.code !== '23505') throw error; // Allow duplicate prevention
};

// ============================================================================
// STREAKS
// ============================================================================

export const getStreaks = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  return data;
};

// ============================================================================
// MEAL PLANS
// ============================================================================

export const getActiveMealPlan = async (): Promise<GeneratedMealPlan | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    planName: data.plan_name,
    description: data.description || '',
    dailyPlan: data.daily_plan as any
  };
};

export const saveMealPlan = async (plan: GeneratedMealPlan, isActive: boolean = false) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (isActive) {
    // Deactivate existing active plans
    await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);
  }

  const { error } = await supabase
    .from('meal_plans')
    .insert({
      user_id: user.id,
      plan_name: plan.planName,
      description: plan.description,
      daily_plan: plan.dailyPlan as any,
      is_active: isActive
    });

  if (error) throw error;
};

export const updateMealPlan = async (plan: GeneratedMealPlan) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('meal_plans')
    .update({
      plan_name: plan.planName,
      description: plan.description,
      daily_plan: plan.dailyPlan as any
    })
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) throw error;
};

export const deactivateMealPlan = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('meal_plans')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) throw error;
};

// ============================================================================
// USER SETTINGS
// ============================================================================

export const getUserSettings = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updateUserSettings = async (settings: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      ...settings
    }, { onConflict: 'user_id' });

  if (error) throw error;
};

// ============================================================================
// PHOTO BUNDLES
// ============================================================================

export const getPhotoBundles = async (): Promise<PhotoBundle[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('photo_bundles')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;

  return data.map(pb => ({
    date: pb.date,
    frontUrl: pb.front_url || undefined,
    sideUrl: pb.side_url || undefined,
    backUrl: pb.back_url || undefined,
    weight: pb.weight_kg || undefined,
    notes: pb.notes || undefined
  }));
};

export const addPhotoBundle = async (bundle: PhotoBundle) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('photo_bundles')
    .insert({
      user_id: user.id,
      date: bundle.date,
      front_url: bundle.frontUrl,
      side_url: bundle.sideUrl,
      back_url: bundle.backUrl,
      weight_kg: bundle.weight,
      notes: bundle.notes
    });

  if (error) throw error;
};
