import { useState, useCallback, useEffect } from 'react';
import { gamificationService } from '../services/database';
import { GamificationState, ExtendedLevelInfo, UnlockedLoot, EarnedBadge } from '../types';
import { calculateExtendedLevelInfo } from '../utils/gamification';

interface LevelUpEvent {
  oldLevel: number;
  newLevel: number;
  newRank: string;
  chest?: UnlockedLoot;
}

interface BadgeUnlockEvent {
  badges: EarnedBadge[];
}

interface XPToastEvent {
  amount: number;
  reason: string;
}

export interface GamificationFeedback {
  levelUp?: LevelUpEvent;
  badgeUnlock?: BadgeUnlockEvent;
  xpToast?: XPToastEvent;
}

export const useGamification = () => {
  const [gamificationData, setGamificationData] = useState<GamificationState>({
    xp: 0,
    streaks: {
      workout: { current: 0, longest: 0, lastLogDate: '' },
      meal: { current: 0, longest: 0, lastLogDate: '' },
      water: { current: 0, longest: 0, lastLogDate: '' },
    },
    earnedBadges: [],
    challenges: [],
  });

  const [levelInfo, setLevelInfo] = useState<ExtendedLevelInfo & { xpMultiplier: number }>({
    ...calculateExtendedLevelInfo(0),
    xpMultiplier: 1.0,
  });

  const [lootInventory, setLootInventory] = useState<UnlockedLoot[]>([]);
  const [feedbackQueue, setFeedbackQueue] = useState<GamificationFeedback[]>([]);

  // Initialize gamification data
  useEffect(() => {
    const init = async () => {
      try {
        const [state, level, loot] = await Promise.all([
          gamificationService.getGamificationState(),
          gamificationService.getLevelInfo(),
          gamificationService.getLootInventory(),
        ]);
        setGamificationData(state);
        setLevelInfo(level);
        setLootInventory(loot);
      } catch (error) {
        console.error('Error initializing gamification:', error);
      }
    };
    init();
  }, []);

  // Award XP with full context and badge checking
  const awardXpWithContext = useCallback(async (
    amount: number,
    reason: string,
    source?: string,
    badgeContext?: {
      workoutCount?: number;
      mealCount?: number;
      waterDays?: number;
      weightLogs?: number;
      challengesCompleted?: number;
      aiUsageCount?: number;
    }
  ): Promise<void> => {
    try {
      const result = await gamificationService.addXPWithTransaction(amount, reason, source);

      // Update local state
      setGamificationData(prev => ({ ...prev, xp: result.newXP }));
      
      // If level up occurred, update level info and queue feedback
      if (result.leveledUp && result.newLevel) {
        const newLevelInfo = await gamificationService.getLevelInfo();
        setLevelInfo(newLevelInfo);

        setFeedbackQueue(prev => [...prev, {
          levelUp: {
            oldLevel: levelInfo.numericLevel,
            newLevel: result.newLevel!,
            newRank: newLevelInfo.rankTitle,
            chest: result.chestUnlocked,
          }
        }]);

        if (result.chestUnlocked) {
          setLootInventory(prev => [...prev, result.chestUnlocked!]);
        }
      }

      // Queue XP toast notification
      setFeedbackQueue(prev => [...prev, {
        xpToast: { amount, reason }
      }]);

      // Check for new badges if context provided
      if (badgeContext) {
        const newBadges = await gamificationService.checkAndAwardBadges({
          ...badgeContext,
          streaks: gamificationData.streaks,
          currentLevel: result.leveledUp ? result.newLevel : levelInfo.numericLevel,
          totalXP: result.newXP,
        });

        if (newBadges.length > 0) {
          setGamificationData(prev => ({
            ...prev,
            earnedBadges: [...prev.earnedBadges, ...newBadges]
          }));

          setFeedbackQueue(prev => [...prev, {
            badgeUnlock: { badges: newBadges }
          }]);
        }
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }, [levelInfo.numericLevel, gamificationData.streaks]);

  // Update streak with XP bonus
  const updateStreak = useCallback(async (type: 'workout' | 'meal' | 'water'): Promise<void> => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const streak = gamificationData.streaks[type];
    let newStreak = { ...streak };
    let xpFromStreak = 0;

    if (streak.lastLogDate !== todayStr) {
      if (streak.lastLogDate === yesterdayStr) {
        newStreak.current += 1;
      } else {
        newStreak.current = 1;
      }
      newStreak.lastLogDate = todayStr;
      if (newStreak.current > newStreak.longest) newStreak.longest = newStreak.current;

      // Award bonus XP for streaks
      if (newStreak.current >= 3) xpFromStreak += 50;
      if (newStreak.current >= 7) xpFromStreak += 100;
      if (newStreak.current >= 30) xpFromStreak += 500;

      try {
        await gamificationService.updateStreak(type, newStreak.current, newStreak.longest, newStreak.lastLogDate);
        
        setGamificationData(prev => ({
          ...prev,
          streaks: { ...prev.streaks, [type]: newStreak }
        }));

        if (xpFromStreak > 0) {
          await awardXpWithContext(xpFromStreak, `${type} streak bonus (${newStreak.current} days)`, 'streak_bonus');
        }
      } catch (error) {
        console.error('Error updating streak:', error);
      }
    }
  }, [gamificationData.streaks, awardXpWithContext]);

  // Log AI usage with XP reward
  const logAIUsage = useCallback(async (type: 'workout_plan' | 'meal_plan' | 'coaching', aiUsageCount: number): Promise<void> => {
    const xpReward = 75;
    await gamificationService.logAIUsage(type, xpReward);
    await awardXpWithContext(xpReward, `Generated ${type.replace('_', ' ')}`, 'ai_usage', { aiUsageCount });
  }, [awardXpWithContext]);

  // Clear feedback (call after showing UI)
  const clearFeedback = useCallback(() => {
    setFeedbackQueue([]);
  }, []);

  // Get next feedback item
  const getNextFeedback = useCallback((): GamificationFeedback | undefined => {
    return feedbackQueue[0];
  }, [feedbackQueue]);

  // Dismiss current feedback
  const dismissFeedback = useCallback(() => {
    setFeedbackQueue(prev => prev.slice(1));
  }, []);

  return {
    gamificationData,
    levelInfo,
    lootInventory,
    feedbackQueue,
    awardXpWithContext,
    updateStreak,
    logAIUsage,
    clearFeedback,
    getNextFeedback,
    dismissFeedback,
  };
};
