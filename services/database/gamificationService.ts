import { supabase } from '../supabaseClient';
import { GamificationState, EarnedBadge, Challenge, ExtendedLevelInfo, LootItem, UnlockedLoot } from '../../types';
import { 
  calculateExtendedLevelInfo, 
  checkForChestUnlock, 
  getRandomLoot,
  ALL_BADGES,
  generateWeeklyChallenges,
  generateMonthlyChallenges
} from '../../utils/gamification';

export interface GamificationService {
  getGamificationState(): Promise<GamificationState>;
  getXP(): Promise<number>;
  addXP(amount: number): Promise<number>;
  getStreaks(): Promise<GamificationState['streaks']>;
  updateStreak(type: 'workout' | 'meal' | 'water', current: number, longest: number, lastLogDate: string): Promise<void>;
  getEarnedBadges(): Promise<EarnedBadge[]>;
  earnBadge(badge: EarnedBadge): Promise<void>;
  updateBadgeProgress(badgeId: string, currentTier: string, progressValue: number, tierProgressPct: number): Promise<void>;
  getChallenges(): Promise<Challenge[]>;
  updateChallenge(challenge: Challenge): Promise<void>;
  saveChallenges(challenges: Challenge[]): Promise<void>;
  getLevelInfo(): Promise<ExtendedLevelInfo & { xpMultiplier: number }>;
  addXPWithTransaction(amount: number, reason: string, source?: string): Promise<{ newXP: number; leveledUp: boolean; newLevel?: number; chestUnlocked?: UnlockedLoot }>;
  getLootInventory(): Promise<UnlockedLoot[]>;
  unlockLoot(loot: LootItem): Promise<void>;
  logAIUsage(usageType: 'workout_plan' | 'meal_plan' | 'coaching', xpEarned: number): Promise<void>;
  getAIUsageCount(usageType: 'workout_plan' | 'meal_plan' | 'coaching'): Promise<number>;
  getXPTransactions(limit?: number): Promise<any[]>;
  refreshWeeklyChallenges(): Promise<Challenge[]>;
  refreshMonthlyChallenges(): Promise<Challenge[]>;
  checkAndAwardBadges(context: {
    workoutCount?: number;
    mealCount?: number;
    waterDays?: number;
    streaks?: GamificationState['streaks'];
    weightLogs?: number;
    challengesCompleted?: number;
    aiUsageCount?: number;
    currentLevel?: number;
    totalXP?: number;
    macrosHit?: boolean;
    proteinHit?: boolean;
    caloriesHit?: boolean;
    proteinStreak?: number;
    calorieStreak?: number;
    earlyAdopter?: boolean;
    firstWorkout?: boolean;
    earlyBird?: boolean;
    nightOwl?: boolean;
    comebackKid?: boolean;
  }): Promise<EarnedBadge[]>;
}

export const createGamificationService = (userId: string): GamificationService => {
  const getXP = async (): Promise<number> => {
    const { data, error } = await supabase
      .from('gamification_state')
      .select('xp')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.xp;
  };

  const addXP = async (amount: number): Promise<number> => {
    const currentXP = await getXP();
    const newXP = currentXP + amount;

    const { error } = await supabase
      .from('gamification_state')
      .upsert({
        user_id: userId,
        xp: newXP,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error adding XP:', error);
      throw error;
    }

    return newXP;
  };

  const getStreaks = async (): Promise<GamificationState['streaks']> => {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching streaks:', error);
      return {
        workout: { current: 0, longest: 0, lastLogDate: '' },
        meal: { current: 0, longest: 0, lastLogDate: '' },
        water: { current: 0, longest: 0, lastLogDate: '' },
      };
    }

    const streaks: any = {
      workout: { current: 0, longest: 0, lastLogDate: '' },
      meal: { current: 0, longest: 0, lastLogDate: '' },
      water: { current: 0, longest: 0, lastLogDate: '' },
    };

    for (const streak of data || []) {
      streaks[streak.streak_type] = {
        current: streak.current_streak,
        longest: streak.longest_streak,
        lastLogDate: streak.last_log_date || '',
      };
    }

    return streaks;
  };

  const updateStreak = async (
    type: 'workout' | 'meal' | 'water',
    current: number,
    longest: number,
    lastLogDate: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('streaks')
      .upsert({
        user_id: userId,
        streak_type: type,
        current_streak: current,
        longest_streak: longest,
        last_log_date: lastLogDate,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,streak_type'
      });

    if (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  };

  const getEarnedBadges = async (): Promise<EarnedBadge[]> => {
    const { data, error } = await supabase
      .from('badge_progress')
      .select('*')
      .eq('user_id', userId)
      .order('earned_on', { ascending: false });

    if (error) {
      console.error('Error fetching badge progress:', error);
      return [];
    }

    return (data || []).map((badge: any) => {
      const badgeDefinition = ALL_BADGES.find(b => b.id === badge.badge_id);
      return {
        id: badge.badge_id,
        name: badge.name,
        description: badge.description,
        category: badge.category,
        icon: badge.icon,
        earnedOn: badge.earned_on,
        currentTier: badge.current_tier || 'bronze',
        progressValue: badge.progress_value || 0,
        tierProgressPct: badge.tier_progress_pct || 0,
        lastTierAwardedAt: badge.last_tier_awarded_at || badge.earned_on,
        tiers: badgeDefinition?.tiers || [],
        metricType: badgeDefinition?.metricType || 'count',
      };
    });
  };

  const earnBadge = async (badge: EarnedBadge): Promise<void> => {
    const { error } = await supabase
      .from('badge_progress')
      .insert({
        user_id: userId,
        badge_id: badge.id,
        name: badge.name,
        description: badge.description,
        category: badge.category,
        icon: badge.icon,
        earned_on: badge.earnedOn,
        current_tier: badge.currentTier || 'bronze',
        progress_value: badge.progressValue || 1,
        tier_progress_pct: badge.tierProgressPct || 0,
        last_tier_awarded_at: badge.lastTierAwardedAt || badge.earnedOn,
      });

    if (error) {
      console.error('Error earning badge:', error);
      throw error;
    }
  };

  const updateBadgeProgress = async (badgeId: string, currentTier: string, progressValue: number, tierProgressPct: number): Promise<void> => {
    const { error } = await supabase
      .from('badge_progress')
      .update({
        current_tier: currentTier,
        progress_value: progressValue,
        tier_progress_pct: tierProgressPct,
        last_tier_awarded_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('badge_id', badgeId);

    if (error) {
      console.error('Error updating badge progress:', error);
      throw error;
    }
  };

  const getChallenges = async (): Promise<Challenge[]> => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching challenges:', error);
      return [];
    }

    return (data || []).map((challenge: any) => ({
      id: challenge.challenge_id,
      title: challenge.title,
      description: challenge.description,
      goal: challenge.goal,
      progress: challenge.progress,
      xpReward: challenge.xp_reward,
      badgeId: challenge.badge_id,
      isCompleted: challenge.is_completed,
      type: challenge.type,
      period: challenge.period,
    }));
  };

  const updateChallenge = async (challenge: Challenge): Promise<void> => {
    const { error } = await supabase
      .from('challenges')
      .upsert({
        user_id: userId,
        challenge_id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        goal: challenge.goal,
        progress: challenge.progress,
        xp_reward: challenge.xpReward,
        badge_id: challenge.badgeId,
        is_completed: challenge.isCompleted,
        type: challenge.type,
        period: challenge.period,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,challenge_id'
      });

    if (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  };

  const saveChallenges = async (challenges: Challenge[]): Promise<void> => {
    const records = challenges.map(challenge => ({
      user_id: userId,
      challenge_id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      goal: challenge.goal,
      progress: challenge.progress,
      xp_reward: challenge.xpReward,
      badge_id: challenge.badgeId,
      is_completed: challenge.isCompleted,
      type: challenge.type,
      period: challenge.period,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('challenges')
      .upsert(records, {
        onConflict: 'user_id,challenge_id'
      });

    if (error) {
      console.error('Error saving challenges:', error);
      throw error;
    }
  };

  const getLevelInfo = async (): Promise<ExtendedLevelInfo & { xpMultiplier: number }> => {
    const { data, error } = await supabase
      .from('user_gamification_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    const xp = data?.total_xp ?? await getXP();
    const levelInfo = calculateExtendedLevelInfo(xp);

    return {
      ...levelInfo,
      xpMultiplier: data?.xp_multiplier ?? 1.0,
    };
  };

  const unlockLoot = async (loot: LootItem): Promise<void> => {
    const { error } = await supabase
      .from('loot_inventory')
      .insert({
        user_id: userId,
        loot_id: loot.id,
        name: loot.name,
        description: loot.description,
        type: loot.type,
        rarity: loot.rarity,
        icon: loot.icon,
        value: loot.value,
        unlocked_on: new Date().toISOString().split('T')[0],
        used: false,
      });

    if (error) {
      console.error('Error unlocking loot:', error);
      throw error;
    }
  };

  const addXPWithTransaction = async (amount: number, reason: string, source?: string): Promise<{ newXP: number; leveledUp: boolean; newLevel?: number; chestUnlocked?: UnlockedLoot }> => {
    const oldLevelInfo = await getLevelInfo();
    const multipliedAmount = Math.floor(amount * oldLevelInfo.xpMultiplier);
    const newXP = await addXP(multipliedAmount);

    await supabase.from('xp_transactions').insert({
      user_id: userId,
      amount: multipliedAmount,
      reason,
      source,
      multiplier: oldLevelInfo.xpMultiplier,
    });

    const newLevelInfo = calculateExtendedLevelInfo(newXP);
    const leveledUp = newLevelInfo.numericLevel > oldLevelInfo.numericLevel;

    await supabase
      .from('user_gamification_profile')
      .upsert({
        user_id: userId,
        numeric_level: newLevelInfo.numericLevel,
        rank_title: newLevelInfo.rankTitle,
        total_xp: newXP,
        xp_multiplier: oldLevelInfo.xpMultiplier,
        perks_unlocked: newLevelInfo.perksUnlocked,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (leveledUp) {
      const { data: currentState } = await supabase
        .from('gamification_state')
        .select('level_up_count')
        .eq('user_id', userId)
        .single();

      await supabase
        .from('gamification_state')
        .update({
          level_up_count: (currentState?.level_up_count ?? 0) + 1,
          last_level_up: new Date().toISOString(),
        })
        .eq('user_id', userId);

      const chest = checkForChestUnlock(oldLevelInfo.numericLevel, newLevelInfo.numericLevel);
      if (chest) {
        const loot = getRandomLoot(chest);
        const unlockedLoot: UnlockedLoot = {
          ...loot,
          unlockedOn: new Date().toISOString().split('T')[0],
          used: false,
        };
        await unlockLoot(loot);
        return { newXP, leveledUp: true, newLevel: newLevelInfo.numericLevel, chestUnlocked: unlockedLoot };
      }

      return { newXP, leveledUp: true, newLevel: newLevelInfo.numericLevel };
    }

    return { newXP, leveledUp: false };
  };

  const getLootInventory = async (): Promise<UnlockedLoot[]> => {
    const { data, error } = await supabase
      .from('loot_inventory')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_on', { ascending: false });

    if (error) {
      console.error('Error fetching loot inventory:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.loot_id,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      icon: item.icon,
      value: item.value,
      unlockedOn: item.unlocked_on,
      used: item.used,
    }));
  };

  const logAIUsage = async (usageType: 'workout_plan' | 'meal_plan' | 'coaching', xpEarned: number): Promise<void> => {
    const { error } = await supabase
      .from('ai_usage_log')
      .insert({
        user_id: userId,
        usage_type: usageType,
        xp_earned: xpEarned,
      });

    if (error) {
      console.error('Error logging AI usage:', error);
      throw error;
    }
  };

  const getAIUsageCount = async (usageType: 'workout_plan' | 'meal_plan' | 'coaching'): Promise<number> => {
    const { data, error } = await supabase
      .from('ai_usage_log')
      .select('id', { count: 'exact', head: false })
      .eq('user_id', userId)
      .eq('usage_type', usageType);

    if (error) {
      console.error('Error fetching AI usage count:', error);
      return 0;
    }

    return data?.length || 0;
  };

  const getXPTransactions = async (limit: number = 50): Promise<any[]> => {
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching XP transactions:', error);
      return [];
    }

    return data || [];
  };

  const refreshWeeklyChallenges = async (): Promise<Challenge[]> => {
    const newChallenges = generateWeeklyChallenges();
    await saveChallenges(newChallenges);
    return newChallenges;
  };

  const refreshMonthlyChallenges = async (): Promise<Challenge[]> => {
    const newChallenges = generateMonthlyChallenges();
    await saveChallenges(newChallenges);
    return newChallenges;
  };

  const getMetricValue = (badgeId: string, context: any): number => {
    switch (badgeId) {
      case 'training_beast':
      case 'first_workout':
        return context.workoutCount || 0;
      case 'mindful_eater':
        return context.mealCount || 0;
      case 'protein_pro':
        return context.proteinHit ? (context.proteinStreak || 1) : 0;
      case 'macro_perfectionist':
        return context.macrosHit ? 1 : 0;
      case 'calorie_control':
        return context.caloriesHit ? (context.calorieStreak || 1) : 0;
      case 'hydration_hero':
        return context.waterDays || 0;
      case 'consistency_champion':
        return context.streaks ? Math.max(
          context.streaks.workout.current,
          context.streaks.meal.current,
          context.streaks.water.current
        ) : 0;
      case 'progress_tracker':
      case 'weight_logger':
        return context.weightLogs || 0;
      case 'ai_master':
        return context.aiUsageCount || 0;
      case 'challenge_legend':
        return context.challengesCompleted || 0;
      case 'level_10':
        return (context.currentLevel || 0) >= 10 ? 1 : 0;
      case 'level_25':
        return (context.currentLevel || 0) >= 25 ? 1 : 0;
      case 'level_40':
        return (context.currentLevel || 0) >= 40 ? 1 : 0;
      case 'level_60':
        return (context.currentLevel || 0) >= 60 ? 1 : 0;
      case 'level_80':
        return (context.currentLevel || 0) >= 80 ? 1 : 0;
      case 'level_100':
        return (context.currentLevel || 0) >= 100 ? 1 : 0;
      case 'early_adopter':
        return context.earlyAdopter === true ? 1 : 0;
      case 'early_bird':
        return context.earlyBird === true ? 1 : 0;
      case 'night_owl':
        return context.nightOwl === true ? 1 : 0;
      case 'comeback_kid':
        return context.comebackKid === true ? 1 : 0;
      default:
        return 0;
    }
  };

  const checkAndAwardBadges = async (context: {
    workoutCount?: number;
    mealCount?: number;
    waterDays?: number;
    streaks?: GamificationState['streaks'];
    weightLogs?: number;
    challengesCompleted?: number;
    aiUsageCount?: number;
    currentLevel?: number;
    totalXP?: number;
    macrosHit?: boolean;
    proteinHit?: boolean;
    caloriesHit?: boolean;
    proteinStreak?: number;
    calorieStreak?: number;
    earlyAdopter?: boolean;
    firstWorkout?: boolean;
    earlyBird?: boolean;
    nightOwl?: boolean;
    comebackKid?: boolean;
  }): Promise<EarnedBadge[]> => {
    const existingBadges = await getEarnedBadges();
    const badgeMap = new Map(existingBadges.map(b => [b.id, b]));
    const newAndUpgradedBadges: EarnedBadge[] = [];

    for (const badgeDef of ALL_BADGES) {
      const metricValue = getMetricValue(badgeDef.id, context);
      const existingBadge = badgeMap.get(badgeDef.id) as EarnedBadge | undefined;
      
      if (metricValue === 0 && !existingBadge) continue;

      let highestTierAchieved = null;
      for (let i = badgeDef.tiers.length - 1; i >= 0; i--) {
        if (metricValue >= badgeDef.tiers[i].threshold) {
          highestTierAchieved = badgeDef.tiers[i];
          break;
        }
      }

      if (!highestTierAchieved) continue;

      if (!existingBadge) {
        const tierIndex = badgeDef.tiers.indexOf(highestTierAchieved);
        const nextTier = tierIndex < badgeDef.tiers.length - 1 ? badgeDef.tiers[tierIndex + 1] : null;
        const progressPct = nextTier 
          ? Math.min(100, ((metricValue - highestTierAchieved.threshold) / (nextTier.threshold - highestTierAchieved.threshold)) * 100)
          : 100;

        const newBadge: EarnedBadge = {
          id: badgeDef.id,
          name: badgeDef.name,
          description: badgeDef.description,
          category: badgeDef.category,
          icon: badgeDef.icon,
          tiers: badgeDef.tiers,
          metricType: badgeDef.metricType,
          earnedOn: new Date().toISOString().split('T')[0],
          currentTier: highestTierAchieved.tier,
          progressValue: metricValue,
          tierProgressPct: progressPct,
          lastTierAwardedAt: new Date().toISOString().split('T')[0],
        };
        
        await earnBadge(newBadge);
        newAndUpgradedBadges.push(newBadge);
      } else if (existingBadge) {
        const currentTierIndex = badgeDef.tiers.findIndex(t => t.tier === existingBadge.currentTier);
        const highestTierIndex = badgeDef.tiers.indexOf(highestTierAchieved);
        
        if (highestTierIndex > currentTierIndex) {
          const nextTier = highestTierIndex < badgeDef.tiers.length - 1 ? badgeDef.tiers[highestTierIndex + 1] : null;
          const progressPct = nextTier 
            ? Math.min(100, ((metricValue - highestTierAchieved.threshold) / (nextTier.threshold - highestTierAchieved.threshold)) * 100)
            : 100;

          await updateBadgeProgress(badgeDef.id, highestTierAchieved.tier, metricValue, progressPct);
          
          const upgradedBadge: EarnedBadge = {
            id: existingBadge.id,
            name: existingBadge.name,
            description: existingBadge.description,
            category: existingBadge.category,
            icon: existingBadge.icon,
            tiers: existingBadge.tiers,
            metricType: existingBadge.metricType,
            earnedOn: existingBadge.earnedOn,
            currentTier: highestTierAchieved.tier,
            progressValue: metricValue,
            tierProgressPct: progressPct,
            lastTierAwardedAt: new Date().toISOString().split('T')[0],
          };
          
          newAndUpgradedBadges.push(upgradedBadge);
        } else if (metricValue !== existingBadge.progressValue) {
          const nextTier = currentTierIndex < badgeDef.tiers.length - 1 ? badgeDef.tiers[currentTierIndex + 1] : null;
          const progressPct = nextTier 
            ? Math.min(100, ((metricValue - badgeDef.tiers[currentTierIndex].threshold) / (nextTier.threshold - badgeDef.tiers[currentTierIndex].threshold)) * 100)
            : 100;

          await updateBadgeProgress(badgeDef.id, existingBadge.currentTier, metricValue, progressPct);
        }
      }
    }

    return newAndUpgradedBadges;
  };

  const getGamificationState = async (): Promise<GamificationState> => {
    const [xpData, streaksData, badgesData, challengesData] = await Promise.all([
      getXP(),
      getStreaks(),
      getEarnedBadges(),
      getChallenges(),
    ]);

    return {
      xp: xpData,
      streaks: streaksData,
      earnedBadges: badgesData,
      challenges: challengesData,
    };
  };

  return {
    getGamificationState,
    getXP,
    addXP,
    getStreaks,
    updateStreak,
    getEarnedBadges,
    earnBadge,
    updateBadgeProgress,
    getChallenges,
    updateChallenge,
    saveChallenges,
    getLevelInfo,
    addXPWithTransaction,
    getLootInventory,
    unlockLoot,
    logAIUsage,
    getAIUsageCount,
    getXPTransactions,
    refreshWeeklyChallenges,
    refreshMonthlyChallenges,
    checkAndAwardBadges,
  };
};

export const gamificationService = createGamificationService('default_user');
