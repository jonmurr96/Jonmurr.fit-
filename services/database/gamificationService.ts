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

const USER_ID = 'default_user';

export const gamificationService = {
  async getGamificationState(): Promise<GamificationState> {
    const [xpData, streaksData, badgesData, challengesData] = await Promise.all([
      this.getXP(),
      this.getStreaks(),
      this.getEarnedBadges(),
      this.getChallenges(),
    ]);

    return {
      xp: xpData,
      streaks: streaksData,
      earnedBadges: badgesData,
      challenges: challengesData,
    };
  },

  async getXP(): Promise<number> {
    const { data, error } = await supabase
      .from('gamification_state')
      .select('xp')
      .eq('user_id', USER_ID)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.xp;
  },

  async addXP(amount: number): Promise<number> {
    const currentXP = await this.getXP();
    const newXP = currentXP + amount;

    const { error } = await supabase
      .from('gamification_state')
      .upsert({
        user_id: USER_ID,
        xp: newXP,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error adding XP:', error);
      throw error;
    }

    return newXP;
  },

  async getStreaks(): Promise<GamificationState['streaks']> {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', USER_ID);

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
  },

  async updateStreak(
    type: 'workout' | 'meal' | 'water',
    current: number,
    longest: number,
    lastLogDate: string
  ): Promise<void> {
    const { error } = await supabase
      .from('streaks')
      .upsert({
        user_id: USER_ID,
        streak_type: type,
        current_streak: current,
        longest_streak: longest,
        last_log_date: lastLogDate,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  },

  async getEarnedBadges(): Promise<EarnedBadge[]> {
    const { data, error } = await supabase
      .from('earned_badges')
      .select('*')
      .eq('user_id', USER_ID)
      .order('earned_on', { ascending: false });

    if (error) {
      console.error('Error fetching earned badges:', error);
      return [];
    }

    return (data || []).map((badge: any) => ({
      id: badge.badge_id,
      name: badge.name,
      description: badge.description,
      category: badge.category,
      icon: badge.icon,
      earnedOn: badge.earned_on,
    }));
  },

  async earnBadge(badge: EarnedBadge): Promise<void> {
    const { error } = await supabase
      .from('earned_badges')
      .insert({
        user_id: USER_ID,
        badge_id: badge.id,
        name: badge.name,
        description: badge.description,
        category: badge.category,
        icon: badge.icon,
        earned_on: badge.earnedOn,
      });

    if (error) {
      console.error('Error earning badge:', error);
      throw error;
    }
  },

  async getChallenges(): Promise<Challenge[]> {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', USER_ID);

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
  },

  async updateChallenge(challenge: Challenge): Promise<void> {
    const { error } = await supabase
      .from('challenges')
      .upsert({
        user_id: USER_ID,
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
      });

    if (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  },

  async saveChallenges(challenges: Challenge[]): Promise<void> {
    const records = challenges.map(challenge => ({
      user_id: USER_ID,
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
      .upsert(records);

    if (error) {
      console.error('Error saving challenges:', error);
      throw error;
    }
  },

  // ========== GAMIFICATION V2 FUNCTIONS ==========

  async getLevelInfo(): Promise<ExtendedLevelInfo & { xpMultiplier: number }> {
    const { data, error } = await supabase
      .from('user_gamification_profile')
      .select('*')
      .eq('user_id', USER_ID)
      .single();

    const xp = data?.total_xp ?? await this.getXP();
    const levelInfo = calculateExtendedLevelInfo(xp);

    return {
      ...levelInfo,
      xpMultiplier: data?.xp_multiplier ?? 1.0,
    };
  },

  async addXPWithTransaction(amount: number, reason: string, source?: string): Promise<{ newXP: number; leveledUp: boolean; newLevel?: number; chestUnlocked?: UnlockedLoot }> {
    const oldLevelInfo = await this.getLevelInfo();
    const multipliedAmount = Math.floor(amount * oldLevelInfo.xpMultiplier);
    const newXP = await this.addXP(multipliedAmount);

    await supabase.from('xp_transactions').insert({
      user_id: USER_ID,
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
        user_id: USER_ID,
        numeric_level: newLevelInfo.numericLevel,
        rank_title: newLevelInfo.rankTitle,
        total_xp: newXP,
        xp_multiplier: oldLevelInfo.xpMultiplier,
        perks_unlocked: newLevelInfo.perksUnlocked,
        updated_at: new Date().toISOString(),
      });

    if (leveledUp) {
      const { data: currentState } = await supabase
        .from('gamification_state')
        .select('level_up_count')
        .eq('user_id', USER_ID)
        .single();

      await supabase
        .from('gamification_state')
        .update({
          level_up_count: (currentState?.level_up_count ?? 0) + 1,
          last_level_up: new Date().toISOString(),
        })
        .eq('user_id', USER_ID);

      const chest = checkForChestUnlock(oldLevelInfo.numericLevel, newLevelInfo.numericLevel);
      if (chest) {
        const loot = getRandomLoot(chest);
        const unlockedLoot: UnlockedLoot = {
          ...loot,
          unlockedOn: new Date().toISOString().split('T')[0],
          used: false,
        };
        await this.unlockLoot(loot);
        return { newXP, leveledUp: true, newLevel: newLevelInfo.numericLevel, chestUnlocked: unlockedLoot };
      }

      return { newXP, leveledUp: true, newLevel: newLevelInfo.numericLevel };
    }

    return { newXP, leveledUp: false };
  },

  async getLootInventory(): Promise<UnlockedLoot[]> {
    const { data, error } = await supabase
      .from('loot_inventory')
      .select('*')
      .eq('user_id', USER_ID)
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
  },

  async unlockLoot(loot: LootItem): Promise<void> {
    const { error } = await supabase
      .from('loot_inventory')
      .insert({
        user_id: USER_ID,
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
  },

  async logAIUsage(usageType: 'workout_plan' | 'meal_plan' | 'coaching', xpEarned: number): Promise<void> {
    const { error } = await supabase
      .from('ai_usage_log')
      .insert({
        user_id: USER_ID,
        usage_type: usageType,
        xp_earned: xpEarned,
      });

    if (error) {
      console.error('Error logging AI usage:', error);
      throw error;
    }
  },

  async getAIUsageCount(usageType: 'workout_plan' | 'meal_plan' | 'coaching'): Promise<number> {
    const { data, error } = await supabase
      .from('ai_usage_log')
      .select('id', { count: 'exact', head: false })
      .eq('user_id', USER_ID)
      .eq('usage_type', usageType);

    if (error) {
      console.error('Error fetching AI usage count:', error);
      return 0;
    }

    return data?.length || 0;
  },

  async getXPTransactions(limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', USER_ID)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching XP transactions:', error);
      return [];
    }

    return data || [];
  },

  async refreshWeeklyChallenges(): Promise<Challenge[]> {
    const newChallenges = generateWeeklyChallenges();
    await this.saveChallenges(newChallenges);
    return newChallenges;
  },

  async refreshMonthlyChallenges(): Promise<Challenge[]> {
    const newChallenges = generateMonthlyChallenges();
    await this.saveChallenges(newChallenges);
    return newChallenges;
  },

  async checkAndAwardBadges(context: {
    workoutCount?: number;
    mealCount?: number;
    waterDays?: number;
    streaks?: GamificationState['streaks'];
    weightLogs?: number;
    challengesCompleted?: number;
    aiUsageCount?: number;
    currentLevel?: number;
    totalXP?: number;
  }): Promise<EarnedBadge[]> {
    const earnedBadges = await this.getEarnedBadges();
    const earnedBadgeIds = new Set(earnedBadges.map(b => b.id));
    const newBadges: EarnedBadge[] = [];

    for (const badge of ALL_BADGES) {
      if (!earnedBadgeIds.has(badge.id)) {
        let shouldEarn = false;
        const badgeWithThreshold = badge as any;

        switch (badge.category) {
          case 'Workout':
            if (context.workoutCount !== undefined && context.workoutCount >= badgeWithThreshold.threshold) {
              shouldEarn = true;
            }
            break;

          case 'Nutrition':
            if (badge.id.includes('hydration_') || badge.id.includes('water_')) {
              if (context.waterDays !== undefined && context.waterDays >= badgeWithThreshold.threshold) {
                shouldEarn = true;
              }
            } else {
              if (context.mealCount !== undefined && context.mealCount >= badgeWithThreshold.threshold) {
                shouldEarn = true;
              }
            }
            break;

          case 'Consistency':
            if (context.streaks) {
              if (badge.id.includes('workout_streak') && context.streaks.workout.current >= badgeWithThreshold.threshold) {
                shouldEarn = true;
              } else if (badge.id.includes('meal_streak') && context.streaks.meal.current >= badgeWithThreshold.threshold) {
                shouldEarn = true;
              } else if (badge.id.includes('water_streak') && context.streaks.water.current >= badgeWithThreshold.threshold) {
                shouldEarn = true;
              } else {
                const maxStreak = Math.max(context.streaks.workout.current, context.streaks.meal.current, context.streaks.water.current);
                if (maxStreak >= badgeWithThreshold.threshold) shouldEarn = true;
              }
            }
            break;

          case 'Progress':
            if (context.weightLogs !== undefined && context.weightLogs >= badgeWithThreshold.threshold) {
              shouldEarn = true;
            }
            break;

          case 'AI':
            if (context.aiUsageCount !== undefined && context.aiUsageCount >= badgeWithThreshold.threshold) {
              shouldEarn = true;
            }
            break;

          case 'Challenges':
            if (context.challengesCompleted !== undefined && context.challengesCompleted >= badgeWithThreshold.threshold) {
              shouldEarn = true;
            }
            break;

          case 'Milestones':
            if (context.currentLevel !== undefined && context.currentLevel >= badgeWithThreshold.levelRequired) {
              shouldEarn = true;
            } else if (context.totalXP !== undefined && context.totalXP >= badgeWithThreshold.xpRequired) {
              shouldEarn = true;
            }
            break;

          case 'Special':
            // Special badges require specific triggers or manual granting
            // These are typically awarded through special events or one-time actions
            if (badge.id === 'early_adopter') {
              shouldEarn = true;
            }
            // Other special badges (like 'perfectionist') require custom tracking
            // and will be handled by specialized event triggers
            break;
        }

        if (shouldEarn) {
          const earnedBadge: EarnedBadge = {
            id: badge.id,
            name: badge.name,
            description: badge.description,
            category: badge.category,
            icon: badge.icon,
            earnedOn: new Date().toISOString().split('T')[0],
          };
          await this.earnBadge(earnedBadge);
          newBadges.push(earnedBadge);
        }
      }
    }

    return newBadges;
  },
};
