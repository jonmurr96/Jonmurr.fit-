import { supabase } from './supabaseClient';
import { OnboardingFormData } from '../types/onboarding';

export interface SaveOnboardingResponse {
  success: boolean;
  error?: string;
}

/**
 * Save onboarding data to Supabase
 */
export async function saveOnboardingData(
  userId: string,
  data: OnboardingFormData
): Promise<SaveOnboardingResponse> {
  try {
    // Prepare data for insertion (convert arrays to JSONB)
    const onboardingData = {
      user_id: userId,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      height_ft: data.heightFt,
      height_in: data.heightIn,
      weight_lbs: data.weightLbs,
      main_goal: data.mainGoal,
      target_weight_lbs: data.targetWeightLbs,
      active_days_per_week: data.activeDaysPerWeek,
      focus_areas: JSON.stringify(data.focusAreas || []),
      timeline_months: data.timelineMonths,
      has_injuries: data.hasInjuries,
      injury_details: data.injuryDetails,
      medical_conditions: JSON.stringify(data.medicalConditions || []),
      somatotype: data.somatotype,
      fat_distribution: data.fatDistribution,
      equipment_access: data.equipmentAccess,
      workout_duration: data.workoutDuration,
      weight_change_difficulty: data.weightChangeDifficulty,
      routine_type: data.routineType,
      diet_quality: data.dietQuality,
      dietary_restrictions: JSON.stringify(data.dietaryRestrictions || []),
      eating_style: data.eatingStyle,
      average_sleep_hours: data.averageSleepHours,
      bmr: data.bmr,
      tdee: data.tdee,
      daily_calories: data.dailyCalories,
      protein_g: data.proteinG,
      carbs_g: data.carbsG,
      fats_g: data.fatsG,
      water_intake_oz: data.waterIntakeOz,
      workout_plan_id: data.workoutPlanId,
      meal_plan_id: data.mealPlanId,
    };

    // Insert or update onboarding data
    const { error: upsertError } = await supabase
      .from('user_onboarding_data')
      .upsert(onboardingData, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error saving onboarding data:', upsertError);
      return { success: false, error: upsertError.message };
    }

    // Mark user as onboarding complete
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ onboarding_complete: true })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Error updating user onboarding status:', userUpdateError);
      return { success: false, error: userUpdateError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error saving onboarding data:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Get onboarding data for a user
 */
export async function getOnboardingData(userId: string): Promise<OnboardingFormData | null> {
  try {
    const { data, error } = await supabase
      .from('user_onboarding_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      console.error('Error fetching onboarding data:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Convert database format back to form data format
    return {
      dateOfBirth: data.date_of_birth,
      gender: data.gender,
      heightFt: data.height_ft,
      heightIn: data.height_in,
      weightLbs: data.weight_lbs,
      mainGoal: data.main_goal,
      targetWeightLbs: data.target_weight_lbs,
      activeDaysPerWeek: data.active_days_per_week,
      focusAreas: JSON.parse(data.focus_areas || '[]'),
      timelineMonths: data.timeline_months,
      hasInjuries: data.has_injuries,
      injuryDetails: data.injury_details,
      medicalConditions: JSON.parse(data.medical_conditions || '[]'),
      somatotype: data.somatotype,
      fatDistribution: data.fat_distribution,
      equipmentAccess: data.equipment_access,
      workoutDuration: data.workout_duration,
      weightChangeDifficulty: data.weight_change_difficulty,
      routineType: data.routine_type,
      dietQuality: data.diet_quality,
      dietaryRestrictions: JSON.parse(data.dietary_restrictions || '[]'),
      eatingStyle: data.eating_style,
      averageSleepHours: data.average_sleep_hours,
      bmr: data.bmr,
      tdee: data.tdee,
      dailyCalories: data.daily_calories,
      proteinG: data.protein_g,
      carbsG: data.carbs_g,
      fatsG: data.fats_g,
      waterIntakeOz: data.water_intake_oz,
      workoutPlanId: data.workout_plan_id,
      mealPlanId: data.meal_plan_id,
    };
  } catch (error) {
    console.error('Unexpected error fetching onboarding data:', error);
    return null;
  }
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_onboarding_data')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Clear onboarding data (for re-taking onboarding)
 */
export async function clearOnboardingData(userId: string): Promise<SaveOnboardingResponse> {
  try {
    const { error: deleteError } = await supabase
      .from('user_onboarding_data')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Mark user as not onboarding complete
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ onboarding_complete: false })
      .eq('id', userId);

    if (userUpdateError) {
      return { success: false, error: userUpdateError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}
