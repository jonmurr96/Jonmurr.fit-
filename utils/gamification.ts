
import { Level, LevelInfo, Badge, Challenge, ChallengeType, GamificationState, EarnedBadge } from '../types';

export const LEVELS: Record<Level, { minXp: number; maxXp: number }> = {
  'Beginner': { minXp: 0, maxXp: 499 },
  'Intermediate': { minXp: 500, maxXp: 1499 },
  'Advanced': { minXp: 1500, maxXp: 3499 },
  'Elite': { minXp: 3500, maxXp: Infinity },
};

export const calculateLevelInfo = (xp: number): LevelInfo => {
  let currentLevel: Level = 'Beginner';
  for (const level in LEVELS) {
    if (xp >= LEVELS[level as Level].minXp) {
      currentLevel = level as Level;
    } else {
        break;
    }
  }

  const levelMinXp = LEVELS[currentLevel].minXp;
  const levelMaxXp = LEVELS[currentLevel].maxXp;

  if (levelMaxXp === Infinity) {
    return {
      level: currentLevel,
      xpForNext: Infinity,
      levelMinXp,
      levelMaxXp,
      progress: 100,
    };
  }

  const xpInLevel = xp - levelMinXp;
  const xpNeededForLevel = levelMaxXp - levelMinXp + 1;
  const progress = Math.min((xpInLevel / xpNeededForLevel) * 100, 100);

  return {
    level: currentLevel,
    xpForNext: levelMaxXp + 1,
    levelMinXp,
    levelMaxXp,
    progress,
  };
};

export const ALL_BADGES: Badge[] = [
    { id: 'first_workout', name: 'First Workout', description: 'Completed your first workout. The journey begins!', category: 'Workout', icon: '🎉' },
    { id: 'workout_warrior_10', name: 'Workout Warrior', description: 'Completed 10 workouts.', category: 'Workout', icon: '💪' },
    { id: 'log_first_meal', name: 'Mindful Eater', description: 'Logged your first meal.', category: 'Nutrition', icon: '🥗' },
    { id: 'protein_pro_1', name: 'Protein Pro', description: 'Hit your protein goal for the first time.', category: 'Nutrition', icon: '🍗' },
    { id: 'hydration_hero_1', name: 'Hydration Hero', description: 'Hit your water goal for the first time.', category: 'Nutrition', icon: '💧' },
    { id: 'consistency_3_day', name: 'Getting Started', description: 'Maintained a 3-day streak in any category.', category: 'Consistency', icon: '🔥' },
    { id: 'consistency_7_day', name: 'On a Roll', description: 'Maintained a 7-day streak in any category.', category: 'Consistency', icon: '🚀' },
    { id: 'photogenic', name: 'Photogenic', description: 'Uploaded your first set of progress photos.', category: 'Consistency', icon: '📸' },
    { id: 'challenge_complete_1', name: 'Challenger', description: 'Completed your first weekly challenge.', category: 'Special', icon: '🌟' },
];

export const getInitialChallenges = (): Challenge[] => {
    // This could be more dynamic in a real app (e.g., based on week number)
    return [
        { id: 'weekly_workout_4', title: 'Workout Week', description: 'Log 4 workouts this week.', goal: 4, progress: 0, xpReward: 100, isCompleted: false, type: 'logXWorkouts', period: 'weekly' },
        { id: 'weekly_protein_5', title: 'Protein Power', description: 'Hit your protein goal 5 days this week.', goal: 5, progress: 0, xpReward: 75, isCompleted: false, type: 'hitProteinXDays', period: 'weekly' },
        { id: 'weekly_water_7', title: 'Hydration Challenge', description: 'Drink your goal amount of water for 7 straight days.', goal: 7, progress: 0, xpReward: 100, badgeId: 'hydration_hero_1', isCompleted: false, type: 'drinkXWaterXDays', period: 'weekly' },
    ];
}
