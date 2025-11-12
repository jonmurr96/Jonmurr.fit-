import { supabase } from './supabaseClient';
import { getOnboardingData } from './onboardingService';
import { createUserService } from './database/userService';
import { createProgressService } from './database/progressService';
import { createWorkoutService } from './database/workoutService';
import { createMealPlanService } from './database/mealPlanService';
import { generateWorkoutPlan, generateMealPlan } from './geminiService';
import { WorkoutPlanPreferences, NutritionPlanPreferences } from '../types';

export interface OnboardingSyncResult {
  success: boolean;
  error?: string;
  synced: {
    macros: boolean;
    weight: boolean;
    waterGoal: boolean;
    workoutPlan: boolean;
    mealPlan: boolean;
  };
  workoutPlanId?: string;
  mealPlanId?: string;
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
      workoutPlan: false,
      mealPlan: false,
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
    const workoutService = createWorkoutService(userId);
    const mealPlanService = createMealPlanService(userId);

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

    // 7. & 8. Generate AI Workout and Meal Plans (in parallel for speed)
    console.log('🏋️🍽️ Generating personalized workout and meal plans...');
    
    const [workoutResult, mealResult] = await Promise.allSettled([
      // Workout Plan Generation
      (async () => {
        const workoutPreferences: WorkoutPlanPreferences = {
          goal: mapGoalToWorkoutGoal(onboardingData.mainGoal),
          experienceLevel: 'Beginner',
          currentWeight: onboardingData.weightLbs,
          currentWeightUnit: 'lbs',
          daysPerWeek: onboardingData.activeDaysPerWeek,
          equipment: mapEquipmentToArray(onboardingData.equipmentAccess),
          focusAreas: normalizeFocusAreas(onboardingData.focusAreas || []),
          trainingStyle: normalizeTrainingStyle(onboardingData.routineType),
          injuriesText: onboardingData.hasInjuries && onboardingData.injuryDetails ? onboardingData.injuryDetails : 'None',
          trainingDays: getTrainingDays(onboardingData.activeDaysPerWeek),
          timePerWorkout: mapSessionDuration(onboardingData.workoutDuration),
          medicalConditions: (onboardingData.medicalConditions || []) as ('Asthma' | 'High Blood Pressure' | 'Diabetes' | 'None')[],
        };

        const generatedProgram = await generateWorkoutPlan(workoutPreferences);
        
        if (generatedProgram) {
          await workoutService.saveProgram(generatedProgram, true); // Save and set as active
          console.log('✅ Workout plan generated and set as active:', generatedProgram.programName);
          return true;
        }
        return false;
      })(),
      
      // Meal Plan Generation
      (async () => {
        const heightCm = (onboardingData.heightFt * 12 + onboardingData.heightIn) * 2.54;
        const mealPreferences: NutritionPlanPreferences = {
          gender: onboardingData.gender === 'male' ? 'Male' : onboardingData.gender === 'female' ? 'Female' : 'Non-Binary',
          age: calculateAge(onboardingData.dateOfBirth),
          heightCm: Math.round(heightCm),
          currentWeight: onboardingData.weightLbs,
          currentWeightUnit: 'lbs',
          targetWeight: onboardingData.targetWeightLbs,
          goal: mapGoalToMealGoal(onboardingData.mainGoal),
          activityLevel: mapActivityLevel(onboardingData.activeDaysPerWeek),
          metabolismType: mapMetabolismType(onboardingData.somatotype),
          eatingPattern: mapEatingPattern(onboardingData.eatingStyle),
          mealsPerDay: '3 meals',
          dietaryRestrictions: onboardingData.dietaryRestrictions?.filter(r => r !== 'None').join(', ') || 'None',
          dislikes: '',
          foodBudget: '$80–150/week',
          mealSimplicity: 'Moderate variety',
          sleep: mapSleepDuration(onboardingData.averageSleepHours),
          waterIntake: mapWaterIntake(onboardingData.waterIntakeOz),
        };

        const generatedMealPlan = await generateMealPlan(mealPreferences);
        
        if (generatedMealPlan) {
          await mealPlanService.saveMealPlan(generatedMealPlan, false); // Save meal plan (not active by default)
          console.log('✅ Meal plan generated:', generatedMealPlan.planName);
          return true;
        }
        return false;
      })(),
    ]);

    // Update sync results based on parallel generation outcomes
    if (workoutResult.status === 'fulfilled' && workoutResult.value) {
      result.synced.workoutPlan = true;
    } else if (workoutResult.status === 'rejected') {
      console.error('❌ Error generating workout plan:', workoutResult.reason);
    }

    if (mealResult.status === 'fulfilled' && mealResult.value) {
      result.synced.mealPlan = true;
    } else if (mealResult.status === 'rejected') {
      console.error('❌ Error generating meal plan:', mealResult.reason);
    }

    // Mark sync as successful if core data (macros and weight) synced
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

// ==================== HELPER FUNCTIONS ====================

/**
 * Map onboarding goal to workout plan goal format
 */
function mapGoalToWorkoutGoal(goal: string): 'Muscle Gain' | 'Fat Loss' | 'Build Strength' | 'Improve Endurance' | 'Recomposition' | 'General Fitness' {
  const mapping: Record<string, 'Muscle Gain' | 'Fat Loss' | 'Build Strength' | 'Improve Endurance' | 'Recomposition' | 'General Fitness'> = {
    'lose_weight': 'Fat Loss',
    'gain_weight': 'Muscle Gain',
    'maintain_weight': 'Recomposition',
    'build_muscle': 'Muscle Gain',
    'build_endurance': 'Improve Endurance',
    'general_fitness': 'General Fitness',
  };
  return mapping[goal] || 'Recomposition';
}

/**
 * Map equipment access to array format
 */
function mapEquipmentToArray(equipment: string): ('Bodyweight' | 'Dumbbells' | 'Resistance Bands' | 'Barbells / Gym Machines' | 'Full Gym')[] {
  const mapping: Record<string, ('Bodyweight' | 'Dumbbells' | 'Resistance Bands' | 'Barbells / Gym Machines' | 'Full Gym')[]> = {
    'bodyweight': ['Bodyweight'],
    'dumbbells': ['Dumbbells', 'Bodyweight'],
    'full_gym': ['Dumbbells', 'Barbells / Gym Machines', 'Bodyweight'],
  };
  return mapping[equipment] || ['Bodyweight'];
}

/**
 * Generate training days array based on days per week
 */
function getTrainingDays(daysPerWeek: number): number[] {
  // Map to days of the week (1=Monday, 7=Sunday)
  const trainingSchedules: Record<number, number[]> = {
    1: [1], // Monday only
    2: [1, 4], // Monday, Thursday
    3: [1, 3, 5], // Mon, Wed, Fri
    4: [1, 2, 4, 6], // Mon, Tue, Thu, Sat
    5: [1, 2, 3, 4, 5], // Mon-Fri
    6: [1, 2, 3, 4, 5, 6], // Mon-Sat
    7: [1, 2, 3, 4, 5, 6, 7], // Every day
  };
  return trainingSchedules[daysPerWeek] || [1, 3, 5];
}

/**
 * Map onboarding goal to meal plan goal format
 */
function mapGoalToMealGoal(goal: string): 'Lose Body Fat' | 'Gain Muscle / Weight' | 'Maintain / Recomp' {
  const mapping: Record<string, 'Lose Body Fat' | 'Gain Muscle / Weight' | 'Maintain / Recomp'> = {
    'lose_weight': 'Lose Body Fat',
    'gain_weight': 'Gain Muscle / Weight',
    'maintain_weight': 'Maintain / Recomp',
    'build_muscle': 'Gain Muscle / Weight',
    'build_endurance': 'Maintain / Recomp',
    'general_fitness': 'Maintain / Recomp',
  };
  return mapping[goal] || 'Maintain / Recomp';
}

/**
 * Map active days per week to activity level
 */
function mapActivityLevel(activeDays: number): 'Little to no exercise' | '1–2 days/week' | '3–4 days/week' | '5+ days/week' {
  if (activeDays <= 1) return 'Little to no exercise';
  if (activeDays <= 2) return '1–2 days/week';
  if (activeDays <= 4) return '3–4 days/week';
  return '5+ days/week';
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Map workout duration to session duration format
 */
function mapSessionDuration(duration?: string): '20-30 min' | '30-45 min' | '45-60 min' | '60-90+ min' {
  const mapping: Record<string, '20-30 min' | '30-45 min' | '45-60 min' | '60-90+ min'> = {
    '20-30': '20-30 min',
    '30-60': '45-60 min',
    '60-90': '60-90+ min',
    '90+': '60-90+ min',
  };
  return mapping[duration || '30-60'] || '45-60 min';
}

/**
 * Normalize focus areas to valid FocusArea literals
 */
function normalizeFocusAreas(areas: string[]): ('Arms' | 'Chest' | 'Shoulders' | 'Back' | 'Core / Abs' | 'Glutes' | 'Legs' | 'Full Body')[] {
  const normalizedMapping: Record<string, 'Arms' | 'Chest' | 'Shoulders' | 'Back' | 'Core / Abs' | 'Glutes' | 'Legs' | 'Full Body'> = {
    'Arms': 'Arms',
    'Chest': 'Chest',
    'Shoulders': 'Shoulders',
    'Back': 'Back',
    'Core/Abs': 'Core / Abs',
    'Core / Abs': 'Core / Abs',
    'Glutes': 'Glutes',
    'Legs': 'Legs',
    'Full Body': 'Full Body',
    'Cardio': 'Full Body', // Map cardio to full body
    'Flexibility': 'Full Body', // Map flexibility to full body
  };
  
  return areas.map(area => normalizedMapping[area] || 'Full Body').filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
}

/**
 * Normalize training style to valid TrainingStyle literal
 */
function normalizeTrainingStyle(style?: string): 'Progress Overload' | 'Balanced' | 'Keep it Fun' {
  const mapping: Record<string, 'Progress Overload' | 'Balanced' | 'Keep it Fun'> = {
    'progressive_overload': 'Progress Overload',
    'fun_based': 'Keep it Fun',
    'balanced': 'Balanced',
  };
  return mapping[style || 'balanced'] || 'Balanced';
}

/**
 * Map somatotype to metabolism type
 */
function mapMetabolismType(somatotype?: string): 'I gain fat easily' | 'I struggle to gain weight' | 'I gain/lose fairly evenly' {
  const mapping: Record<string, 'I gain fat easily' | 'I struggle to gain weight' | 'I gain/lose fairly evenly'> = {
    'ectomorph': 'I struggle to gain weight',
    'mesomorph': 'I gain/lose fairly evenly',
    'endomorph': 'I gain fat easily',
  };
  return mapping[somatotype || 'mesomorph'] || 'I gain/lose fairly evenly';
}

/**
 * Map eating style to eating pattern
 */
function mapEatingPattern(eatingStyle?: string): 'I mostly eat out' | 'I cook sometimes' | 'I cook most meals' | 'I follow a structured meal routine' {
  const mapping: Record<string, 'I mostly eat out' | 'I cook sometimes' | 'I cook most meals' | 'I follow a structured meal routine'> = {
    'emotional': 'I mostly eat out',
    'bored': 'I cook sometimes',
    'unconscious': 'I mostly eat out',
    'habitual': 'I cook most meals',
    'energy_driven': 'I follow a structured meal routine',
    'balanced': 'I cook most meals',
  };
  return mapping[eatingStyle || 'balanced'] || 'I cook most meals';
}

/**
 * Map sleep hours to sleep duration category
 */
function mapSleepDuration(hours: number): 'Less than 6 hours' | '6–8 hours' | '8+ hours' {
  if (hours < 6) return 'Less than 6 hours';
  if (hours <= 8) return '6–8 hours';
  return '8+ hours';
}

/**
 * Map water intake in oz to water intake level
 */
function mapWaterIntake(waterOz?: number): 'Low (<60 oz/day)' | 'Moderate (60–100 oz/day)' | 'High (100+ oz/day)' {
  const oz = waterOz || 128;
  if (oz < 60) return 'Low (<60 oz/day)';
  if (oz <= 100) return 'Moderate (60–100 oz/day)';
  return 'High (100+ oz/day)';
}
