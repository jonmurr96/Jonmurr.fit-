import { useState, useCallback, useEffect } from 'react';
import { gamificationService } from '../services/database';
import { GamificationState, ExtendedLevelInfo, UnlockedLoot, EarnedBadge } from '../types';
import { calculateExtendedLevelInfo } from '../utils/gamification';

interface LevelUpEvent {
  oldLevel: number;
  newLevel: number;
  newRank: string;
  perksUnlocked: string[];
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
      // Capture OLD level before transaction
      const currentLevelInfo = await gamificationService.getLevelInfo();
      const oldLevel = currentLevelInfo.numericLevel;

      const result = await gamificationService.addXPWithTransaction(amount, reason, source);

      // ALWAYS update level info after XP transaction (for progress bars, even without level-up)
      const newLevelInfo = await gamificationService.getLevelInfo();
      setLevelInfo(newLevelInfo);

      // Update local XP state
      setGamificationData(prev => ({ ...prev, xp: result.newXP }));
      
      // If level up occurred, queue feedback and update loot
      if (result.leveledUp && result.newLevel) {
        // Level-up event goes to queue FIRST (higher priority)
        setFeedbackQueue(prev => [...prev, {
          levelUp: {
            oldLevel,
            newLevel: result.newLevel!,
            newRank: newLevelInfo.rankTitle,
            perksUnlocked: newLevelInfo.perksUnlocked,
            chest: result.chestUnlocked,
          }
        }]);

        if (result.chestUnlocked) {
          setLootInventory(prev => [...prev, result.chestUnlocked!]);
        }
      } else {
        // Only show XP toast if NO level-up (level-up modal shows XP gain)
        setFeedbackQueue(prev => [...prev, {
          xpToast: { amount, reason }
        }]);
      }

      // Check for new badges if context provided
      if (badgeContext) {
        // Fetch fresh streaks to avoid stale closure data
        const freshState = await gamificationService.getGamificationState();
        
        const newBadges = await gamificationService.checkAndAwardBadges({
          ...badgeContext,
          streaks: freshState.streaks,
          currentLevel: result.leveledUp ? result.newLevel : currentLevelInfo.numericLevel,
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
  }, []);

  // Update streak with XP bonus
  const updateStreak = useCallback(async (type: 'workout' | 'meal' | 'water'): Promise<void> => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Fetch fresh streak data to avoid stale closures
    const freshState = await gamificationService.getGamificationState();
    const streak = freshState.streaks[type];
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
  }, [awardXpWithContext]);

  // Log AI usage with XP reward
  const logAIUsage = useCallback(async (type: 'workout_plan' | 'meal_plan' | 'coaching', aiUsageCount: number): Promise<void> => {
    const xpReward = 75;
    await gamificationService.logAIUsage(type, xpReward);
    await awardXpWithContext(xpReward, `Generated ${type.replace('_', ' ')}`, 'ai_usage', { aiUsageCount });
  }, [awardXpWithContext]);

  // Get next feedback item
  const getNextFeedback = useCallback((): GamificationFeedback | undefined => {
    return feedbackQueue[0];
  }, [feedbackQueue]);

  // Dismiss current feedback (advances queue by 1)
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
    getNextFeedback,
    dismissFeedback,
  };
};
