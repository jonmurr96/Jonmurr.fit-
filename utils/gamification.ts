
import { Level, LevelInfo, Badge, Challenge, ChallengeType, GamificationState, EarnedBadge } from '../types';

// 🎮 NEW 100-LEVEL SYSTEM WITH RANK TITLES
export type RankTitle = 'Newbie' | 'Rookie' | 'Unit' | 'Gym Rat' | 'Gym Addict' | 'Bodybuilder';

export interface ExtendedLevelInfo extends LevelInfo {
  numericLevel: number;
  rankTitle: RankTitle;
  rankProgress: number; // Progress within current rank (0-100%)
  nextRankLevel: number | null; // Level when next rank is achieved
  perksUnlocked: string[]; // List of perks available at this level
}

// Rank ranges for the 100-level system
export const RANK_RANGES: Record<RankTitle, { min: number; max: number; color: string }> = {
  'Newbie': { min: 1, max: 10, color: '#9ca3af' }, // gray
  'Rookie': { min: 11, max: 25, color: '#60a5fa' }, // blue
  'Unit': { min: 26, max: 40, color: '#a78bfa' }, // purple
  'Gym Rat': { min: 41, max: 60, color: '#f97316' }, // orange
  'Gym Addict': { min: 61, max: 80, color: '#ef4444' }, // red
  'Bodybuilder': { min: 81, max: 100, color: '#fbbf24' }, // gold
};

// 🎯 EXPONENTIAL XP CURVE - makes early levels fast, later levels challenging
// Target: ~50,000 total XP to reach level 100
// Formula for CUMULATIVE XP: totalXP = A * (level ^ B)
// Solving for level 100 = 50000: A * (100 ^ B) = 50000
// Using B = 2.2 for good progression curve: A = 50000 / (100^2.2) = 50000 / 25118.86 ≈ 1.99
const CURVE_MULTIPLIER = 1.99;
const CURVE_EXPONENT = 2.2;

// Get TOTAL (cumulative) XP needed to reach a specific level
export const getTotalXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return Math.floor(CURVE_MULTIPLIER * Math.pow(level, CURVE_EXPONENT));
};

// Get XP needed for a SINGLE level (difference from previous level)
export const calculateXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  const currentLevelTotal = getTotalXPForLevel(level);
  const previousLevelTotal = getTotalXPForLevel(level - 1);
  return currentLevelTotal - previousLevelTotal;
};

// Get rank title from numeric level
export const getRankTitle = (level: number): RankTitle => {
  for (const [rank, range] of Object.entries(RANK_RANGES)) {
    if (level >= range.min && level <= range.max) {
      return rank as RankTitle;
    }
  }
  return 'Bodybuilder'; // Max rank
};

// Get perks unlocked at a specific level
export const getPerksForLevel = (level: number): string[] => {
  const perks: string[] = [];
  
  // Milestone perks
  if (level >= 5) perks.push('Custom streak goal');
  if (level >= 10) perks.push('Newbie rank badge', 'Dark theme unlocked');
  if (level >= 15) perks.push('Weekly XP bonus +10%');
  if (level >= 20) perks.push('Advanced analytics');
  if (level >= 25) perks.push('Rookie rank badge', 'Blue theme unlocked');
  if (level >= 30) perks.push('AI coaching tips');
  if (level >= 35) perks.push('Priority challenge access');
  if (level >= 40) perks.push('Unit rank badge', 'Purple theme unlocked');
  if (level >= 45) perks.push('Custom workout builder');
  if (level >= 50) perks.push('Legendary loot access', 'Weekly XP bonus +25%');
  if (level >= 60) perks.push('Gym Rat rank badge', 'Orange theme unlocked');
  if (level >= 65) perks.push('Beast mode workouts');
  if (level >= 70) perks.push('Elite meal plans');
  if (level >= 75) perks.push('Weekly XP bonus +50%');
  if (level >= 80) perks.push('Gym Addict rank badge', 'Red theme unlocked');
  if (level >= 85) perks.push('Champion status');
  if (level >= 90) perks.push('Exclusive exercises');
  if (level >= 95) perks.push('Master coaching');
  if (level >= 100) perks.push('Bodybuilder rank badge', 'Gold theme unlocked', 'MAX LEVEL ACHIEVED');
  
  return perks;
};

// 📊 CALCULATE EXTENDED LEVEL INFO
export const calculateExtendedLevelInfo = (xp: number): ExtendedLevelInfo => {
  // Find current numeric level
  let numericLevel = 1;
  for (let level = 1; level <= 100; level++) {
    const totalXPNeeded = getTotalXPForLevel(level + 1);
    if (xp < totalXPNeeded) {
      numericLevel = level;
      break;
    }
  }
  if (xp >= getTotalXPForLevel(100)) numericLevel = 100;
  
  const rankTitle = getRankTitle(numericLevel);
  const rankRange = RANK_RANGES[rankTitle];
  
  // Calculate XP for current and next level
  const currentLevelTotalXP = getTotalXPForLevel(numericLevel);
  const nextLevelTotalXP = numericLevel < 100 ? getTotalXPForLevel(numericLevel + 1) : Infinity;
  const xpForThisLevel = nextLevelTotalXP - currentLevelTotalXP;
  const xpInCurrentLevel = xp - currentLevelTotalXP;
  
  // Progress to next level
  const progress = numericLevel >= 100 ? 100 : Math.min((xpInCurrentLevel / xpForThisLevel) * 100, 100);
  
  // Rank progress (progress within current rank tier)
  const rankProgressValue = ((numericLevel - rankRange.min) / (rankRange.max - rankRange.min + 1)) * 100;
  const rankProgress = Math.min(Math.max(rankProgressValue, 0), 100);
  
  // Next rank level
  let nextRankLevel: number | null = null;
  const currentRankIndex = Object.keys(RANK_RANGES).indexOf(rankTitle);
  if (currentRankIndex < Object.keys(RANK_RANGES).length - 1) {
    const nextRank = Object.keys(RANK_RANGES)[currentRankIndex + 1] as RankTitle;
    nextRankLevel = RANK_RANGES[nextRank].min;
  }
  
  return {
    level: rankTitle as any, // For backward compatibility
    numericLevel,
    rankTitle,
    xpForNext: numericLevel < 100 ? nextLevelTotalXP : Infinity,
    levelMinXp: currentLevelTotalXP,
    levelMaxXp: nextLevelTotalXP,
    progress,
    rankProgress,
    nextRankLevel,
    perksUnlocked: getPerksForLevel(numericLevel),
  };
};

// Legacy function for backward compatibility
export const calculateLevelInfo = (xp: number): LevelInfo => {
  const extended = calculateExtendedLevelInfo(xp);
  return {
    level: extended.rankTitle as any,
    xpForNext: extended.xpForNext,
    levelMinXp: extended.levelMinXp,
    levelMaxXp: extended.levelMaxXp,
    progress: extended.progress,
  };
};

// 🏅 COMPREHENSIVE BADGE SYSTEM (30+ badges)
export const ALL_BADGES: Badge[] = [
  // 🏋️ WORKOUT BADGES
  { id: 'first_workout', name: 'First Workout', description: 'Completed your first workout. The journey begins!', category: 'Workout', icon: '🎉' },
  { id: 'workout_warrior_10', name: 'Workout Warrior', description: 'Completed 10 workouts.', category: 'Workout', icon: '💪' },
  { id: 'workout_veteran_25', name: 'Workout Veteran', description: 'Completed 25 workouts.', category: 'Workout', icon: '🏋️' },
  { id: 'workout_master_50', name: 'Workout Master', description: 'Completed 50 workouts.', category: 'Workout', icon: '⚡' },
  { id: 'workout_legend_100', name: 'Workout Legend', description: 'Completed 100 workouts!', category: 'Workout', icon: '👑' },
  { id: 'early_bird', name: 'Early Bird', description: 'Completed a workout before 7 AM.', category: 'Workout', icon: '🌅' },
  { id: 'night_owl', name: 'Night Owl', description: 'Completed a workout after 9 PM.', category: 'Workout', icon: '🌙' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Completed workouts on both Saturday and Sunday.', category: 'Workout', icon: '🎯' },
  
  // 🥗 NUTRITION BADGES
  { id: 'log_first_meal', name: 'Mindful Eater', description: 'Logged your first meal.', category: 'Nutrition', icon: '🥗' },
  { id: 'meal_tracker_50', name: 'Meal Tracker', description: 'Logged 50 meals.', category: 'Nutrition', icon: '📝' },
  { id: 'meal_master_100', name: 'Meal Master', description: 'Logged 100 meals.', category: 'Nutrition', icon: '🍽️' },
  { id: 'protein_pro_1', name: 'Protein Pro', description: 'Hit your protein goal for the first time.', category: 'Nutrition', icon: '🍗' },
  { id: 'protein_champion_7', name: 'Protein Champion', description: 'Hit protein goal 7 days in a row.', category: 'Nutrition', icon: '🥩' },
  { id: 'macro_perfectionist', name: 'Macro Perfectionist', description: 'Hit all macro goals in a single day.', category: 'Nutrition', icon: '🎯' },
  { id: 'calorie_control_7', name: 'Calorie Control', description: 'Stayed within calorie goal for 7 days.', category: 'Nutrition', icon: '⚖️' },
  { id: 'clean_eater', name: 'Clean Eater', description: 'Logged 5 days of whole food meals.', category: 'Nutrition', icon: '🥦' },
  
  // 💧 HYDRATION BADGES
  { id: 'hydration_hero_1', name: 'Hydration Hero', description: 'Hit your water goal for the first time.', category: 'Nutrition', icon: '💧' },
  { id: 'water_warrior_7', name: 'Water Warrior', description: 'Hit water goal for 7 days straight.', category: 'Nutrition', icon: '💦' },
  { id: 'hydration_master_30', name: 'Hydration Master', description: 'Hit water goal for 30 days straight.', category: 'Nutrition', icon: '🌊' },
  
  // 🔥 STREAK & CONSISTENCY BADGES
  { id: 'consistency_3_day', name: 'Getting Started', description: 'Maintained a 3-day streak in any category.', category: 'Consistency', icon: '🔥' },
  { id: 'consistency_7_day', name: 'On a Roll', description: 'Maintained a 7-day streak in any category.', category: 'Consistency', icon: '🚀' },
  { id: 'consistency_14_day', name: 'Two Weeks Strong', description: 'Maintained a 14-day streak.', category: 'Consistency', icon: '💎' },
  { id: 'consistency_30_day', name: 'Monthly Grind', description: 'Maintained a 30-day streak.', category: 'Consistency', icon: '🏆' },
  { id: 'consistency_60_day', name: 'Unstoppable', description: 'Maintained a 60-day streak.', category: 'Consistency', icon: '⚡' },
  { id: 'consistency_100_day', name: 'Centurion', description: 'Maintained a 100-day streak!', category: 'Consistency', icon: '👑' },
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Restarted your streak after breaking it.', category: 'Consistency', icon: '💫' },
  
  // 📸 PROGRESS TRACKING BADGES
  { id: 'photogenic', name: 'Photogenic', description: 'Uploaded your first set of progress photos.', category: 'Progress', icon: '📸' },
  { id: 'progress_tracker_5', name: 'Progress Tracker', description: 'Uploaded 5 sets of progress photos.', category: 'Progress', icon: '📷' },
  { id: 'weight_logger', name: 'Weight Logger', description: 'Logged your weight 10 times.', category: 'Progress', icon: '⚖️' },
  { id: 'transformation_artist', name: 'Transformation Artist', description: 'Uploaded 10 sets of progress photos.', category: 'Progress', icon: '🎨' },
  
  // 🤖 AI USAGE BADGES
  { id: 'ai_explorer', name: 'AI Explorer', description: 'Generated your first AI workout plan.', category: 'AI', icon: '🤖' },
  { id: 'ai_meal_planner', name: 'AI Meal Planner', description: 'Generated your first AI meal plan.', category: 'AI', icon: '🍱' },
  { id: 'ai_enthusiast', name: 'AI Enthusiast', description: 'Used AI tools 10 times.', category: 'AI', icon: '🧠' },
  { id: 'ai_master', name: 'AI Master', description: 'Used AI tools 25 times.', category: 'AI', icon: '✨' },
  
  // 🎯 CHALLENGE BADGES
  { id: 'challenge_complete_1', name: 'Challenger', description: 'Completed your first weekly challenge.', category: 'Challenges', icon: '🌟' },
  { id: 'challenge_veteran_5', name: 'Challenge Veteran', description: 'Completed 5 challenges.', category: 'Challenges', icon: '🎖️' },
  { id: 'challenge_master_10', name: 'Challenge Master', description: 'Completed 10 challenges.', category: 'Challenges', icon: '🏅' },
  { id: 'challenge_legend_25', name: 'Challenge Legend', description: 'Completed 25 challenges.', category: 'Challenges', icon: '👑' },
  
  // 🌟 SPECIAL / MILESTONE BADGES
  { id: 'level_10', name: 'Rookie Graduate', description: 'Reached level 10 - completed Newbie rank!', category: 'Milestones', icon: '🎓' },
  { id: 'level_25', name: 'Rising Star', description: 'Reached level 25 - completed Rookie rank!', category: 'Milestones', icon: '⭐' },
  { id: 'level_40', name: 'Unit Complete', description: 'Reached level 40 - completed Unit rank!', category: 'Milestones', icon: '💪' },
  { id: 'level_60', name: 'Gym Rat Elite', description: 'Reached level 60 - completed Gym Rat rank!', category: 'Milestones', icon: '🐀' },
  { id: 'level_80', name: 'Addiction Mastered', description: 'Reached level 80 - completed Gym Addict rank!', category: 'Milestones', icon: '🔥' },
  { id: 'level_100', name: 'BODYBUILDER', description: 'Reached MAX LEVEL 100 - Ultimate Achievement!', category: 'Milestones', icon: '👑' },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Maintained 100% macro accuracy for 5 days.', category: 'Special', icon: '💯' },
  { id: 'early_adopter', name: 'Early Adopter', description: 'Joined the fitness journey!', category: 'Special', icon: '🎁' },
];

// 🎯 ENHANCED CHALLENGE SYSTEM
export const getInitialChallenges = (): Challenge[] => {
  return [
    { id: 'weekly_workout_4', title: 'Workout Week', description: 'Log 4 workouts this week.', goal: 4, progress: 0, xpReward: 100, isCompleted: false, type: 'logXWorkouts', period: 'weekly' },
    { id: 'weekly_protein_5', title: 'Protein Power', description: 'Hit your protein goal 5 days this week.', goal: 5, progress: 0, xpReward: 75, isCompleted: false, type: 'hitProteinXDays', period: 'weekly' },
    { id: 'weekly_water_7', title: 'Hydration Challenge', description: 'Drink your goal amount of water for 7 straight days.', goal: 7, progress: 0, xpReward: 100, badgeId: 'hydration_hero_1', isCompleted: false, type: 'drinkXWaterXDays', period: 'weekly' },
  ];
};

// Generate weekly challenges dynamically
export const generateWeeklyChallenges = (): Challenge[] => {
  const challenges: Challenge[] = [
    { id: 'weekly_workout_4', title: 'Workout Week', description: 'Complete 4 workouts this week.', goal: 4, progress: 0, xpReward: 100, isCompleted: false, type: 'logXWorkouts', period: 'weekly' },
    { id: 'weekly_meal_log_5', title: 'Meal Mastery', description: 'Log meals for 5 days this week.', goal: 5, progress: 0, xpReward: 80, isCompleted: false, type: 'logXMeals', period: 'weekly' },
    { id: 'weekly_protein_5', title: 'Protein Power', description: 'Hit your protein goal 5 days this week.', goal: 5, progress: 0, xpReward: 75, isCompleted: false, type: 'hitProteinXDays', period: 'weekly' },
    { id: 'weekly_water_7', title: 'Hydration Challenge', description: 'Drink your water goal every day this week.', goal: 7, progress: 0, xpReward: 100, isCompleted: false, type: 'drinkXWaterXDays', period: 'weekly' },
    { id: 'weekly_macro_perfect_3', title: 'Macro Mastery', description: 'Hit all macro goals 3 days this week.', goal: 3, progress: 0, xpReward: 120, isCompleted: false, type: 'hitAllMacrosXDays', period: 'weekly' },
    { id: 'weekly_streak_maintain', title: 'Keep It Going', description: 'Maintain any 7-day streak this week.', goal: 7, progress: 0, xpReward: 150, badgeId: 'consistency_7_day', isCompleted: false, type: 'maintainStreak', period: 'weekly' },
  ];
  
  // Randomly select 3 challenges for the week
  const shuffled = challenges.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

// Generate monthly challenges
export const generateMonthlyChallenges = (): Challenge[] => {
  return [
    { id: 'monthly_workout_16', title: 'Workout Month', description: 'Complete 16 workouts this month.', goal: 16, progress: 0, xpReward: 500, isCompleted: false, type: 'logXWorkouts', period: 'monthly' },
    { id: 'monthly_weight_log_4', title: 'Track Progress', description: 'Log your weight 4 times this month.', goal: 4, progress: 0, xpReward: 200, isCompleted: false, type: 'logWeightXTimes', period: 'monthly' },
    { id: 'monthly_perfect_week', title: 'Perfect Week', description: 'Complete 7 consecutive perfect days (all goals hit).', goal: 7, progress: 0, xpReward: 750, badgeId: 'perfectionist', isCompleted: false, type: 'perfectDaysInRow', period: 'monthly' },
  ];
};

// Recovery challenge when streak breaks
export const getRecoveryChallenge = (brokenStreakType: 'workout' | 'meal' | 'water'): Challenge => {
  const typeLabels = {
    workout: 'Workout',
    meal: 'Meal Logging',
    water: 'Hydration',
  };
  
  return {
    id: `recovery_${brokenStreakType}_${Date.now()}`,
    title: `🔥 Reignite Your ${typeLabels[brokenStreakType]} Streak`,
    description: `Get back on track! Complete ${typeLabels[brokenStreakType].toLowerCase()} for 3 days to restart your streak with a bonus.`,
    goal: 3,
    progress: 0,
    xpReward: 150, // Bonus XP for recovery
    isCompleted: false,
    type: 'recovery',
    period: 'special',
  };
};

// 🎁 LOOT SYSTEM TYPES
export interface LootItem {
  id: string;
  name: string;
  description: string;
  type: 'tip' | 'exercise' | 'theme' | 'xp_boost' | 'mystery';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  value?: any; // XP amount for boosts, theme name, etc.
}

export interface MysteryChest {
  id: string;
  name: string;
  requiredLevel?: number;
  possibleLoot: LootItem[];
}

// Loot pool
export const LOOT_ITEMS: LootItem[] = [
  // Common loot
  { id: 'tip_protein', name: 'Protein Tip', description: 'Eat protein within 30 minutes post-workout for best muscle recovery.', type: 'tip', rarity: 'common', icon: '💡' },
  { id: 'tip_hydration', name: 'Hydration Tip', description: 'Drink water before, during, and after workouts to maintain performance.', type: 'tip', rarity: 'common', icon: '💧' },
  { id: 'tip_sleep', name: 'Sleep Tip', description: 'Aim for 7-9 hours of sleep for optimal muscle growth and recovery.', type: 'tip', rarity: 'common', icon: '😴' },
  { id: 'xp_50', name: '50 XP Boost', description: 'Instant XP bonus!', type: 'xp_boost', rarity: 'common', icon: '⚡', value: 50 },
  
  // Rare loot
  { id: 'exercise_plank_variation', name: 'Plank Variation', description: 'Unlock side plank and plank reaches.', type: 'exercise', rarity: 'rare', icon: '🏋️', value: ['Side Plank', 'Plank Reaches'] },
  { id: 'exercise_hiit', name: 'HIIT Workout', description: 'Unlock high-intensity interval training routines.', type: 'exercise', rarity: 'rare', icon: '🔥', value: ['Burpees', 'Mountain Climbers', 'Jump Squats'] },
  { id: 'xp_100', name: '100 XP Boost', description: 'Bigger XP bonus!', type: 'xp_boost', rarity: 'rare', icon: '💥', value: 100 },
  { id: 'theme_blue', name: 'Ocean Theme', description: 'Unlock the calming blue ocean theme.', type: 'theme', rarity: 'rare', icon: '🌊', value: 'ocean' },
  
  // Epic loot
  { id: 'exercise_advanced', name: 'Advanced Exercises', description: 'Unlock muscle-ups, pistol squats, and handstand push-ups.', type: 'exercise', rarity: 'epic', icon: '⚡', value: ['Muscle-Ups', 'Pistol Squats', 'Handstand Push-ups'] },
  { id: 'xp_250', name: '250 XP Boost', description: 'Massive XP boost!', type: 'xp_boost', rarity: 'epic', icon: '🌟', value: 250 },
  { id: 'theme_sunset', name: 'Sunset Theme', description: 'Unlock the vibrant sunset theme.', type: 'theme', rarity: 'epic', icon: '🌅', value: 'sunset' },
  
  // Legendary loot
  { id: 'exercise_beast_mode', name: 'Beast Mode Routine', description: 'Unlock the ultimate beast mode workout plan.', type: 'exercise', rarity: 'legendary', icon: '👑', value: ['Beast Mode Full Body', 'Strength Massacre', 'Endurance Inferno'] },
  { id: 'xp_500', name: '500 XP Boost', description: 'LEGENDARY XP BOOST!', type: 'xp_boost', rarity: 'legendary', icon: '💎', value: 500 },
  { id: 'theme_gold', name: 'Gold Champion Theme', description: 'The prestigious gold champion theme.', type: 'theme', rarity: 'legendary', icon: '👑', value: 'gold' },
  { id: 'mystery_legendary', name: 'Mystery Legendary', description: 'Something incredible awaits...', type: 'mystery', rarity: 'legendary', icon: '🎁' },
];

// Get random loot from chest based on rarity weights
export const getRandomLoot = (chest: MysteryChest): LootItem => {
  const weights = {
    common: 50,
    rare: 30,
    epic: 15,
    legendary: 5,
  };
  
  // Calculate total weight
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const random = Math.random() * totalWeight;
  
  let cumulativeWeight = 0;
  let selectedRarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
  
  for (const [rarity, weight] of Object.entries(weights)) {
    cumulativeWeight += weight;
    if (random <= cumulativeWeight) {
      selectedRarity = rarity as any;
      break;
    }
  }
  
  // Filter chest loot by rarity
  const availableLoot = chest.possibleLoot.filter(item => item.rarity === selectedRarity);
  if (availableLoot.length === 0) {
    // Fallback to any loot if no items of selected rarity
    return chest.possibleLoot[Math.floor(Math.random() * chest.possibleLoot.length)];
  }
  
  return availableLoot[Math.floor(Math.random() * availableLoot.length)];
};

// Mystery chests awarded at milestones
export const MYSTERY_CHESTS: Record<string, MysteryChest> = {
  beginner_chest: {
    id: 'beginner_chest',
    name: 'Beginner Mystery Chest',
    requiredLevel: 5,
    possibleLoot: LOOT_ITEMS.filter(item => ['common', 'rare'].includes(item.rarity)),
  },
  intermediate_chest: {
    id: 'intermediate_chest',
    name: 'Intermediate Mystery Chest',
    requiredLevel: 25,
    possibleLoot: LOOT_ITEMS.filter(item => ['rare', 'epic'].includes(item.rarity)),
  },
  advanced_chest: {
    id: 'advanced_chest',
    name: 'Advanced Mystery Chest',
    requiredLevel: 50,
    possibleLoot: LOOT_ITEMS.filter(item => ['epic', 'legendary'].includes(item.rarity)),
  },
  master_chest: {
    id: 'master_chest',
    name: 'Master Mystery Chest',
    requiredLevel: 75,
    possibleLoot: LOOT_ITEMS.filter(item => item.rarity === 'legendary'),
  },
  ultimate_chest: {
    id: 'ultimate_chest',
    name: 'Ultimate Champion Chest',
    requiredLevel: 100,
    possibleLoot: LOOT_ITEMS.filter(item => item.rarity === 'legendary'),
  },
};

// Check if player earned a chest
export const checkForChestUnlock = (oldLevel: number, newLevel: number): MysteryChest | null => {
  const chestLevels = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
  
  for (const level of chestLevels) {
    if (oldLevel < level && newLevel >= level) {
      // Determine which chest based on level
      if (level <= 20) return MYSTERY_CHESTS.beginner_chest;
      if (level <= 40) return MYSTERY_CHESTS.intermediate_chest;
      if (level <= 70) return MYSTERY_CHESTS.advanced_chest;
      if (level < 100) return MYSTERY_CHESTS.master_chest;
      return MYSTERY_CHESTS.ultimate_chest;
    }
  }
  
  return null;
};
