import { supabase } from './supabaseClient';
import { getOnboardingData } from './onboardingService';
import { createUserService } from './database/userService';
import { createProgressService } from './database/progressService';

export interface OnboardingSyncResult {
  success: boolean;
  error?: string;
  synced: {
    macros: boolean;
    weight: boolean;
    waterGoal: boolean;
  };
}

/**
 * Sync all onboarding data to the main app services
 * This is called after onboarding completes to populate user's profile
 */
export async function syncOnboardingToApp(userId: string): Promise<OnboardingSyncResult> {
  const result: OnboardingSyncResult = {
    success: false,
    synced: {
      macros: false,
      weight: false,
      waterGoal: false,
    },
  };

  try {
    // 1. Fetch onboarding data
    const onboardingData = await getOnboardingData(userId);
    if (!onboardingData) {
      return { ...result, error: 'No onboarding data found' };
    }

    // 2. Initialize services
    const userService = createUserService(userId);
    const progressService = createProgressService(userId);

    // 3. Sync macro targets
    if (onboardingData.dailyCalories && onboardingData.proteinG && onboardingData.carbsG && onboardingData.fatsG) {
      try {
        const macroTargets = {
          rest: {
            calories: onboardingData.dailyCalories,
            protein: onboardingData.proteinG,
            carbs: onboardingData.carbsG,
            fat: onboardingData.fatsG,
          },
          training: {
            // Training day macros can be slightly higher (10% more calories)
            calories: Math.round(onboardingData.dailyCalories * 1.1),
            protein: Math.round(onboardingData.proteinG * 1.05),
            carbs: Math.round(onboardingData.carbsG * 1.15),
            fat: onboardingData.fatsG,
          },
        };
        
        console.log('📊 Syncing macro targets:', macroTargets);
        await userService.updateMacroTargets(macroTargets);
        result.synced.macros = true;
        console.log('✅ Macro targets synced successfully');
      } catch (error: any) {
        console.error('❌ Error syncing macro targets:', error);
        console.error('Error details:', error.message, error.code);
      }
    }

    // 4. Sync initial weight (only if no weight logs exist yet)
    if (onboardingData.weightLbs) {
      try {
        // Check if user already has weight logs to avoid duplicates
        const existingLogs = await progressService.getWeightLogs();
        
        if (existingLogs.length === 0) {
          // Convert pounds to kilograms (1 lb = 0.453592 kg)
          const weightKg = onboardingData.weightLbs * 0.453592;
          const today = new Date().toISOString().split('T')[0];
          await progressService.addWeightLog(today, weightKg);
          result.synced.weight = true;
        } else {
          // Weight already logged, consider it synced
          result.synced.weight = true;
        }
      } catch (error) {
        console.error('Error syncing initial weight:', error);
      }
    }

    // 5. Sync water intake goal
    // TODO: Create user_preferences table to store water goal
    // For now, water goal is available from onboarding_data but not persisted separately
    if (onboardingData.waterIntakeOz) {
      result.synced.waterGoal = true; // Mark as synced (stored in onboarding_data)
    }

    // 6. Update user profile with fitness goal
    if (onboardingData.mainGoal) {
      try {
        await supabase
          .from('users')
          .update({ fitness_goal: onboardingData.mainGoal })
          .eq('id', userId);
      } catch (error) {
        console.error('Error updating fitness goal:', error);
      }
    }

    // Mark sync as successful if at least macros and weight synced
    result.success = result.synced.macros && result.synced.weight;

    return result;
  } catch (error: any) {
    console.error('Unexpected error during onboarding sync:', error);
    return { ...result, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Check if onboarding data has been synced to the app
 */
export async function isOnboardingSynced(userId: string): Promise<boolean> {
  try {
    // Check if user has macro targets set (indicator of sync)
    const userService = createUserService(userId);
    const macroTargets = await userService.getMacroTargets();
    
    return macroTargets !== null;
  } catch (error) {
    console.error('Error checking onboarding sync status:', error);
    return false;
  }
}

/**
 * Get personalized dashboard data from onboarding
 */
export async function getPersonalizedDashboardData(userId: string) {
  try {
    const onboardingData = await getOnboardingData(userId);
    if (!onboardingData) return null;

    return {
      dailyCalories: onboardingData.dailyCalories,
      macros: {
        protein: onboardingData.proteinG,
        carbs: onboardingData.carbsG,
        fats: onboardingData.fatsG,
      },
      waterGoal: onboardingData.waterIntakeOz,
      currentWeight: onboardingData.weightLbs,
      targetWeight: onboardingData.targetWeightLbs,
      mainGoal: onboardingData.mainGoal,
      bmr: onboardingData.bmr,
      tdee: onboardingData.tdee,
    };
  } catch (error) {
    console.error('Error fetching personalized dashboard data:', error);
    return null;
  }
}
