
export type Screen = 'home' | 'train' | 'log' | 'progress' | 'coach' | 'gamification';

export interface UserProfile {
  name: string;
  avatarUrl: string;
  heightCm: number;
}

export interface MacroDayTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroTargets {
  rest: MacroDayTarget;
  training: MacroDayTarget;
}


export interface DailyMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  items: FoodItem[];
  timestamp: Date;
}

export interface WorkoutSet {
  id: number;
  targetReps: string;
  targetWeight?: number;
  actualReps?: number;
  actualWeight?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  completed: boolean;
  restMinutes?: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  category?: string;
  isFavorite?: boolean;
}

export interface OptionalBlock {
    type: 'Core Finisher' | 'Cardio / Conditioning' | 'Mobility / Stretching';
    durationMinutes: number;
    exercises: Exercise[];
}

export interface Workout {
  id: string;
  day: number;
  focus: string;
  exercises: Exercise[];
  completed: boolean;
  optionalBlocks?: OptionalBlock[];
}

// --- New types for AI Plan Generation ---
export type Gender = 'Male' | 'Female' | 'Non-Binary' | 'Prefer not to say';
export type FitnessGoal = 'Muscle Gain' | 'Fat Loss' | 'Build Strength' | 'Improve Endurance' | 'Recomposition' | 'General Fitness';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type SessionDuration = '20-30 min' | '30-45 min' | '45-60 min' | '60-90+ min';
export type Equipment = 'Bodyweight' | 'Dumbbells' | 'Resistance Bands' | 'Barbells / Gym Machines' | 'Full Gym';
export type FocusArea = 'Arms' | 'Chest' | 'Shoulders' | 'Back' | 'Core / Abs' | 'Glutes' | 'Legs' | 'Full Body';
export type TrainingStyle = 'Keep it Fun' | 'Balanced' | 'Progress Overload';
export type WeightBehavior = 'I gain weight easily, lose it slowly' | 'I lose weight easily, gain it slowly' | 'Somewhere in the middle - I want guidance';
export type MedicalCondition = 'Asthma' | 'High Blood Pressure' | 'Diabetes' | 'None';
export type AddOn = 'core' | 'cardio' | 'mobility';


export interface WorkoutPlanPreferences {
    // Personal Info
    gender?: Gender;
    age?: number;
    currentWeight?: number;
    currentWeightUnit: 'kg' | 'lbs';
    targetWeight?: number;

    // Goals & Experience
    goal: FitnessGoal;
    experienceLevel?: ExperienceLevel;

    // Commitment
    daysPerWeek: number;
    trainingDays?: number[]; // 1-7 for Mon-Sun
    timePerWorkout: SessionDuration;

    // Equipment
    equipment: Equipment[];
    
    // Focus
    focusAreas: FocusArea[];
    focusAreasOther?: string;

    // Style
    trainingStyle: TrainingStyle;
    
    // Behavior
    weightBehavior?: WeightBehavior;

    // Health
    injuriesText: string;
    medicalConditions: MedicalCondition[];
    medicalConditionsOther?: string;
    
    // Add-ons
    addOns?: AddOn[];
}

export interface TrainingProgram {
  programName: string;
  durationWeeks: number;
  workouts: Workout[];
  preferences?: WorkoutPlanPreferences;
  description?: string;
  splitType?: string;
}

export interface WorkoutDraft extends TrainingProgram {
  id: string;
  lastModified: string;
}

export interface SavedWorkout extends TrainingProgram {
  id: string;
  tags: string[];
  lastPerformed?: string; // "YYYY-MM-DD"
  isPinned?: boolean;
  status: 'active' | 'inactive' | 'draft';
}

export interface WeightLog {
  date: string; // "YYYY-MM-DD"
  weightKg: number;
}

export type PhotoAngle = 'front' | 'side' | 'back';

export interface PhotoEntry {
  id: string;
  url: string;
}

export interface PhotoBundle {
  date: string; // "YYYY-MM-DD"
  photos: Partial<Record<PhotoAngle, PhotoEntry>>;
}


export interface DailyLog {
  date: string; // "YYYY-MM-DD"
  macros: DailyMacros;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface WaterLog {
  date: string; // "YYYY-MM-DD"
  intake: number; // in oz
}

export type MilestoneType = 'WEIGHT_GOAL' | 'WATER_STREAK' | 'FIRST_PHOTOS' | 'CONSISTENCY_STREAK' | 'WATER_GOAL_TODAY' | 'BADGE_UNLOCKED';

export interface Milestone {
  id: string; // e.g., '2024-08-01-WEIGHT_GOAL'
  date: string; // "YYYY-MM-DD"
  type: MilestoneType;
  title: string;
  description: string;
}

export type MuscleGroup = 'shoulders' | 'chest' | 'biceps' | 'triceps' | 'abs' | 'obliques' | 'traps' | 'lats' | 'lower_back' | 'glutes' | 'quads' | 'hamstrings' | 'calves';

// Progressive Overload Types
export type ProgressionPreference = 'Conservative' | 'Balanced' | 'Aggressive';

export interface ProgressionSuggestion {
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | 'sets' | 'deload';
  reason: string;
  action: {
    targetWeight?: number;
    targetReps?: string;
    addSet?: boolean;
  };
}

export interface CompletedWorkout extends Workout {
    dateCompleted: string; // "YYYY-MM-DD"
}

export type WorkoutHistory = CompletedWorkout[];

// --- New types for AI Meal Planner ---
export type NutritionGoal = 'Lose Body Fat' | 'Gain Muscle / Weight' | 'Maintain / Recomp';
export type ActivityLevel = 'Little to no exercise' | '1–2 days/week' | '3–4 days/week' | '5+ days/week';
export type EatingPattern = 'I mostly eat out' | 'I cook sometimes' | 'I cook most meals' | 'I follow a structured meal routine';
export type MealsPerDay = '2 meals' | '3 meals' | '4+ meals';
export type MetabolismType = 'I gain fat easily' | 'I struggle to gain weight' | 'I gain/lose fairly evenly';
export type SleepDuration = 'Less than 6 hours' | '6–8 hours' | '8+ hours';
export type WaterIntakeLevel = 'Low (<60 oz/day)' | 'Moderate (60–100 oz/day)' | 'High (100+ oz/day)';
export type MealSimplicity = 'Very simple (repeat meals)' | 'Moderate variety' | 'High variety';
export type FoodBudget = '$50–80/week' | '$80–150/week' | '$150+/week';

export interface NutritionPlanPreferences {
    gender: Gender;
    age: number;
    heightCm: number;
    currentWeight: number;
    currentWeightUnit: 'kg' | 'lbs';
    targetWeight?: number;
    goal: NutritionGoal;
    activityLevel: ActivityLevel;
    eatingPattern: EatingPattern;
    mealsPerDay: MealsPerDay;
    dietaryRestrictions: string;
    dislikes: string;
    metabolismType: MetabolismType;
    sleep: SleepDuration;
    waterIntake: WaterIntakeLevel;
    mealSimplicity: MealSimplicity;
    foodBudget: FoodBudget;
}

export interface MealPlanItem {
    food: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface PlannedMeal {
    name: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack 1' | 'Snack 2' | 'Snacks';
    items: MealPlanItem[];
    swaps?: string[];
}

export interface DailyMealPlan {
    dayOfWeek: string;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    meals: PlannedMeal[];
}

export interface GeneratedMealPlan {
    planName: string;
    description: string;
    dailyPlan: DailyMealPlan;
}

// --- Gamification Types ---

// 🎮 NEW 100-LEVEL SYSTEM
export type NumericLevel = number; // 1-100
export type RankTitle = 'Newbie' | 'Rookie' | 'Unit' | 'Gym Rat' | 'Gym Addict' | 'Bodybuilder';

// Legacy type for backward compatibility (deprecated)
export type Level = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite' | RankTitle;

export interface LevelInfo {
  level: Level;
  xpForNext: number;
  levelMinXp: number;
  levelMaxXp: number;
  progress: number;
}

export interface ExtendedLevelInfo extends LevelInfo {
  numericLevel: number;
  rankTitle: RankTitle;
  rankProgress: number;
  nextRankLevel: number | null;
  perksUnlocked: string[];
}

export interface StreakData {
  current: number;
  longest: number;
  lastLogDate: string; // "YYYY-MM-DD"
}

export type BadgeCategory = 'Workout' | 'Nutrition' | 'Consistency' | 'Special' | 'Progress' | 'AI' | 'Challenges' | 'Milestones';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface TierDefinition {
  tier: BadgeTier;
  threshold: number; // Number required to unlock this tier
  xpReward: number; // Bonus XP for reaching this tier
  label: string; // "Bronze", "Silver", etc.
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string; // emoji
  tiers: TierDefinition[]; // 4 tiers: Bronze → Diamond
  metricType: 'count' | 'streak' | 'boolean'; // How to track progress
}

export interface EarnedBadge extends Badge {
  earnedOn: string; // "YYYY-MM-DD" - when Bronze was first earned
  currentTier: BadgeTier; // Current tier level
  progressValue: number; // Raw count toward next tier
  tierProgressPct: number; // Percentage progress to next tier (0-100)
  lastTierAwardedAt: string; // "YYYY-MM-DD" - when current tier was earned
}

export type ChallengeType = 
  | 'logXWorkouts' 
  | 'hitProteinXDays' 
  | 'drinkXWaterXDays' 
  | 'logXMeals' 
  | 'hitAllMacrosXDays' 
  | 'maintainStreak' 
  | 'logWeightXTimes' 
  | 'perfectDaysInRow' 
  | 'recovery';

export type ChallengePeriod = 'weekly' | 'monthly' | 'special';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  goal: number;
  progress: number;
  xpReward: number;
  badgeId?: string;
  isCompleted: boolean;
  type: ChallengeType;
  period: ChallengePeriod;
}

export interface GamificationState {
  xp: number;
  streaks: {
    workout: StreakData;
    meal: StreakData;
    water: StreakData;
  };
  earnedBadges: EarnedBadge[];
  challenges: Challenge[];
}

// 🎁 LOOT SYSTEM TYPES
export type LootRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type LootType = 'tip' | 'exercise' | 'theme' | 'xp_boost' | 'mystery';

export interface LootItem {
  id: string;
  name: string;
  description: string;
  type: LootType;
  rarity: LootRarity;
  icon: string;
  value?: any;
}

export interface MysteryChest {
  id: string;
  name: string;
  requiredLevel?: number;
  possibleLoot: LootItem[];
}

export interface UnlockedLoot extends LootItem {
  unlockedOn: string; // "YYYY-MM-DD"
  used: boolean;
}
