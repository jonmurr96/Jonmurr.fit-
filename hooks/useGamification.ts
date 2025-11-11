import { useState, useCallback, useEffect } from 'react';
import { useUserServices } from './useUserServices';
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

interface BadgeUpgradeEvent {
  badge: EarnedBadge;
  fromTier: 'bronze' | 'silver' | 'gold' | 'diamond';
  toTier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

interface XPToastEvent {
  amount: number;
  reason: string;
}

export interface GamificationFeedback {
  levelUp?: LevelUpEvent;
  badgeUnlock?: BadgeUnlockEvent;
  badgeUpgrade?: BadgeUpgradeEvent;
  xpToast?: XPToastEvent;
}

export const useGamification = () => {
  const { gamificationService } = useUserServices();

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
  }, [gamificationService]);

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

      // Check for new badges and upgrades if context provided
      if (badgeContext) {
        // Fetch fresh streaks and existing badges to avoid stale closure data
        const freshState = await gamificationService.getGamificationState();
        const existingBadgeMap = new Map(freshState.earnedBadges.map(b => [b.id, b]));
        
        const badgeResults = await gamificationService.checkAndAwardBadges({
          ...badgeContext,
          streaks: freshState.streaks,
          currentLevel: result.leveledUp ? result.newLevel : currentLevelInfo.numericLevel,
          totalXP: result.newXP,
        });

        if (badgeResults.length > 0) {
          // Separate new badges from tier upgrades
          const newBadges: EarnedBadge[] = [];
          const upgradedBadges: { badge: EarnedBadge; fromTier: any; toTier: any; }[] = [];
          
          badgeResults.forEach(badge => {
            const existing = existingBadgeMap.get(badge.id);
            if (!existing) {
              // Brand new badge
              newBadges.push(badge);
            } else if (existing.currentTier !== badge.currentTier) {
              // Tier upgrade
              upgradedBadges.push({
                badge,
                fromTier: existing.currentTier,
                toTier: badge.currentTier,
              });
            }
          });

          // Update state with all badges
          setGamificationData(prev => ({
            ...prev,
            earnedBadges: [...prev.earnedBadges.filter(b => !badgeResults.find(nb => nb.id === b.id)), ...badgeResults]
          }));

          // Queue feedback for new badges
          if (newBadges.length > 0) {
            setFeedbackQueue(prev => [...prev, {
              badgeUnlock: { badges: newBadges }
            }]);
          }

          // Queue feedback for tier upgrades
          upgradedBadges.forEach(({ badge, fromTier, toTier }) => {
            setFeedbackQueue(prev => [...prev, {
              badgeUpgrade: { badge, fromTier, toTier }
            }]);
          });
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

  // Log AI usage with XP reward (fetches count internally)
  const logAIUsage = useCallback(async (type: 'workout_plan' | 'meal_plan' | 'coaching'): Promise<void> => {
    const xpReward = 75;
    // Fetch current usage count before logging
    const currentCount = await gamificationService.getAIUsageCount(type);
    await gamificationService.logAIUsage(type, xpReward);
    // Award XP with updated count for badge checking
    await awardXpWithContext(xpReward, `Generated ${type.replace('_', ' ')}`, 'ai_usage', { aiUsageCount: currentCount + 1 });
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
