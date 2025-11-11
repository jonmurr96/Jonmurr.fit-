// Onboarding Calculation Utilities
// Implements TDEE, macro distribution, and water intake calculations

export interface PersonalInfo {
  age: number;
  gender: 'male' | 'female' | 'other';
  heightFt: number;
  heightIn: number;
  weightLbs: number;
}

export interface FitnessGoals {
  mainGoal: 'lose_weight' | 'gain_weight' | 'maintain_weight' | 'build_muscle' | 'build_endurance' | 'general_fitness';
  activeDaysPerWeek: number;
}

export interface CalculatedResults {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  waterIntakeOz: number;
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
 * BMR = 10×weight(kg) + 6.25×height(cm) - 5×age + s
 * where s = +5 for males, -161 for females
 */
export function calculateBMR(personal: PersonalInfo): number {
  // Convert imperial to metric
  const weightKg = personal.weightLbs * 0.453592;
  const heightCm = (personal.heightFt * 12 + personal.heightIn) * 2.54;
  
  let bmr: number;
  
  if (personal.gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * personal.age + 5;
  } else if (personal.gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * personal.age - 161;
  } else {
    // For 'other', use average of male/female
    const maleBMR = 10 * weightKg + 6.25 * heightCm - 5 * personal.age + 5;
    const femaleBMR = 10 * weightKg + 6.25 * heightCm - 5 * personal.age - 161;
    bmr = (maleBMR + femaleBMR) / 2;
  }
  
  return Math.round(bmr);
}

/**
 * Calculate activity multiplier based on active days per week
 */
export function getActivityMultiplier(activeDaysPerWeek: number): number {
  if (activeDaysPerWeek === 0) return 1.2;      // Sedentary
  if (activeDaysPerWeek <= 2) return 1.375;    // Lightly active
  if (activeDaysPerWeek <= 4) return 1.55;     // Moderately active
  if (activeDaysPerWeek <= 6) return 1.725;    // Very active
  return 1.9;                                   // Extremely active (7 days)
}

/**
 * Calculate Total Daily Energy Expenditure
 * TDEE = BMR × Activity Factor
 */
export function calculateTDEE(bmr: number, activeDaysPerWeek: number): number {
  const activityMultiplier = getActivityMultiplier(activeDaysPerWeek);
  return Math.round(bmr * activityMultiplier);
}

/**
 * Adjust calories based on goal
 */
export function calculateDailyCalories(tdee: number, goal: string): number {
  switch (goal) {
    case 'lose_weight':
      return Math.round(tdee * 0.8);  // 20% deficit
    case 'gain_weight':
    case 'build_muscle':
      return Math.round(tdee * 1.1);  // 10% surplus
    case 'maintain_weight':
    case 'build_endurance':
    case 'general_fitness':
    default:
      return tdee;
  }
}

/**
 * Calculate macronutrient distribution based on goal
 * Returns grams of protein, carbs, and fats
 */
export function calculateMacros(
  dailyCalories: number,
  weightLbs: number,
  goal: string
): { proteinG: number; carbsG: number; fatsG: number } {
  let proteinG: number;
  let fatsG: number;
  let carbsG: number;
  
  switch (goal) {
    case 'lose_weight':
      // High protein (1.2g/lb), moderate fat (25%), rest carbs
      proteinG = Math.round(weightLbs * 1.2);
      fatsG = Math.round((dailyCalories * 0.25) / 9);
      carbsG = Math.round((dailyCalories - (proteinG * 4) - (fatsG * 9)) / 4);
      break;
      
    case 'build_muscle':
    case 'gain_weight':
      // High protein (1g/lb), moderate fat (25%), rest carbs
      proteinG = Math.round(weightLbs * 1.0);
      fatsG = Math.round((dailyCalories * 0.25) / 9);
      carbsG = Math.round((dailyCalories - (proteinG * 4) - (fatsG * 9)) / 4);
      break;
      
    case 'build_endurance':
      // Moderate protein (0.8g/lb), lower fat (20%), higher carbs
      proteinG = Math.round(weightLbs * 0.8);
      fatsG = Math.round((dailyCalories * 0.20) / 9);
      carbsG = Math.round((dailyCalories - (proteinG * 4) - (fatsG * 9)) / 4);
      break;
      
    case 'maintain_weight':
    case 'general_fitness':
    default:
      // Balanced (0.8g/lb protein, 25% fat, rest carbs)
      proteinG = Math.round(weightLbs * 0.8);
      fatsG = Math.round((dailyCalories * 0.25) / 9);
      carbsG = Math.round((dailyCalories - (proteinG * 4) - (fatsG * 9)) / 4);
      break;
  }
  
  return {
    proteinG: Math.max(proteinG, 50),  // Minimum 50g protein
    carbsG: Math.max(carbsG, 100),     // Minimum 100g carbs
    fatsG: Math.max(fatsG, 30),        // Minimum 30g fats
  };
}

/**
 * Calculate daily water intake recommendation
 * Base: 0.5-1 oz per pound of body weight
 * Adjusted for activity level and gender
 */
export function calculateWaterIntake(
  weightLbs: number,
  activeDaysPerWeek: number,
  gender: string
): number {
  // Base calculation: 0.67 oz per pound
  let waterOz = weightLbs * 0.67;
  
  // Activity adjustment
  if (activeDaysPerWeek >= 5) {
    waterOz += 20;  // Add 20oz for high activity
  } else if (activeDaysPerWeek >= 3) {
    waterOz += 10;  // Add 10oz for moderate activity
  }
  
  // Gender adjustment (males typically need more)
  if (gender === 'male') {
    waterOz *= 1.1;
  }
  
  return Math.round(waterOz);
}

/**
 * Master calculation function
 * Takes all onboarding data and returns complete calculated results
 */
export function calculateOnboardingResults(
  personal: PersonalInfo,
  goals: FitnessGoals
): CalculatedResults {
  // Calculate BMR
  const bmr = calculateBMR(personal);
  
  // Calculate TDEE
  const tdee = calculateTDEE(bmr, goals.activeDaysPerWeek);
  
  // Adjust calories for goal
  const dailyCalories = calculateDailyCalories(tdee, goals.mainGoal);
  
  // Calculate macros
  const { proteinG, carbsG, fatsG } = calculateMacros(
    dailyCalories,
    personal.weightLbs,
    goals.mainGoal
  );
  
  // Calculate water intake
  const waterIntakeOz = calculateWaterIntake(
    personal.weightLbs,
    goals.activeDaysPerWeek,
    personal.gender
  );
  
  return {
    bmr,
    tdee,
    dailyCalories,
    proteinG,
    carbsG,
    fatsG,
    waterIntakeOz,
  };
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}
