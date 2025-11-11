// Onboarding System Type Definitions

export interface OnboardingData {
  // Personal Info
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  heightFt: number;
  heightIn: number;
  weightLbs: number;
  
  // Fitness Goals
  mainGoal: 'lose_weight' | 'gain_weight' | 'maintain_weight' | 'build_muscle' | 'build_endurance' | 'general_fitness';
  targetWeightLbs?: number;
  activeDaysPerWeek: number;
  focusAreas: string[];
  timelineMonths: number;
  hasInjuries: boolean;
  injuryDetails?: string;
  medicalConditions: string[];
  
  // Body Type
  somatotype?: 'ectomorph' | 'mesomorph' | 'endomorph';
  fatDistribution?: string;
  
  // Workout Preferences
  equipmentAccess: 'bodyweight' | 'dumbbells' | 'full_gym';
  workoutDuration: '20-30' | '30-60' | '60-90' | '90+';
  weightChangeDifficulty?: 'hard_to_gain' | 'hard_to_lose' | 'build_muscle_effectively';
  routineType?: 'fun_based' | 'balanced' | 'progressive_overload';
  
  // Diet & Lifestyle
  dietQuality: number; // 1-5 scale
  dietaryRestrictions: string[];
  eatingStyle?: 'emotional' | 'bored' | 'unconscious' | 'habitual' | 'energy_driven';
  averageSleepHours: number;
}

export interface OnboardingResults {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  waterIntakeOz: number;
  workoutPlanId?: string;
  mealPlanId?: string;
}

export interface OnboardingFormData extends OnboardingData, Partial<OnboardingResults> {}

export type OnboardingStep = 
  | 'personal_info'
  | 'fitness_goals'
  | 'body_type'
  | 'workout_preferences'
  | 'diet_lifestyle'
  | 'summary';

export const FOCUS_AREAS = [
  'Chest',
  'Back',
  'Arms',
  'Shoulders',
  'Core/Abs',
  'Legs',
  'Glutes',
  'Full Body',
  'Cardio',
  'Flexibility',
] as const;

export const MEDICAL_CONDITIONS = [
  'None',
  'Diabetes',
  'High Blood Pressure',
  'Heart Condition',
  'Asthma',
  'Joint Issues',
  'Back Problems',
  'Other',
] as const;

export const DIETARY_RESTRICTIONS = [
  'None',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut Allergy',
  'Shellfish Allergy',
  'Kosher',
  'Halal',
  'Low Carb',
  'Keto',
  'Other',
] as const;
