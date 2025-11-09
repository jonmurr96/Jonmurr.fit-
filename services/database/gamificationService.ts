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
      }, {
        onConflict: 'user_id'
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
      }, {
        onConflict: 'user_id,streak_type'
      });

    if (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  },

  async getEarnedBadges(): Promise<EarnedBadge[]> {
    const { data, error } = await supabase
      .from('badge_progress')
      .select('*')
      .eq('user_id', USER_ID)
      .order('earned_on', { ascending: false });

    if (error) {
      console.error('Error fetching badge progress:', error);
      return [];
    }

    // Enrich database badge progress with tier definitions from ALL_BADGES
    const { ALL_BADGES } = await import('../../utils/gamification');
    
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
  },

  async earnBadge(badge: EarnedBadge): Promise<void> {
    const { error } = await supabase
      .from('badge_progress')
      .insert({
        user_id: USER_ID,
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
  },
  
  async updateBadgeProgress(badgeId: string, currentTier: string, progressValue: number, tierProgressPct: number): Promise<void> {
    const { error } = await supabase
      .from('badge_progress')
      .update({
        current_tier: currentTier,
        progress_value: progressValue,
        tier_progress_pct: tierProgressPct,
        last_tier_awarded_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', USER_ID)
      .eq('badge_id', badgeId);

    if (error) {
      console.error('Error updating badge progress:', error);
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
      }, {
        onConflict: 'user_id,challenge_id'
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
      .upsert(records, {
        onConflict: 'user_id,challenge_id'
      });

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
      }, {
        onConflict: 'user_id'
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

  // Helper: Get metric value for a badge based on its ID and context
  getMetricValue(badgeId: string, context: any): number {
    switch (badgeId) {
      // Workout badges
      case 'training_beast':
      case 'first_workout':
        return context.workoutCount || 0;
      
      // Nutrition - meal logging
      case 'mindful_eater':
        return context.mealCount || 0;
      
      // Nutrition - protein tracking  
      case 'protein_pro':
        return context.proteinHit ? (context.proteinStreak || 1) : 0;
      
      // Nutrition - macro tracking
      case 'macro_perfectionist':
        return context.macrosHit ? 1 : 0;
      
      // Nutrition - calorie control
      case 'calorie_control':
        return context.caloriesHit ? (context.calorieStreak || 1) : 0;
      
      // Hydration
      case 'hydration_hero':
        return context.waterDays || 0;
      
      // Consistency (streak)
      case 'consistency_champion':
        return context.streaks ? Math.max(
          context.streaks.workout.current,
          context.streaks.meal.current,
          context.streaks.water.current
        ) : 0;
      
      // Progress tracking
      case 'progress_tracker':
      case 'weight_logger':
        return context.weightLogs || 0;
      
      // AI usage
      case 'ai_master':
        return context.aiUsageCount || 0;
      
      // Challenges
      case 'challenge_legend':
        return context.challengesCompleted || 0;
      
      // Milestones (level-based, boolean)
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
      
      // Special badges (boolean - require explicit context flags)
      case 'early_adopter':
        return context.earlyAdopter === true ? 1 : 0;
      case 'first_workout':
        return context.firstWorkout === true ? 1 : 0;
      case 'early_bird':
        return context.earlyBird === true ? 1 : 0;
      case 'night_owl':
        return context.nightOwl === true ? 1 : 0;
      case 'comeback_kid':
        return context.comebackKid === true ? 1 : 0;
      
      default:
        return 0;
    }
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
    macrosHit?: boolean;
    proteinHit?: boolean;
    caloriesHit?: boolean;
    proteinStreak?: number;
    calorieStreak?: number;
    // Boolean badge triggers (must be explicitly set to true)
    earlyAdopter?: boolean;
    firstWorkout?: boolean;
    earlyBird?: boolean;
    nightOwl?: boolean;
    comebackKid?: boolean;
  }): Promise<EarnedBadge[]> {
    const existingBadges = await this.getEarnedBadges();
    const badgeMap = new Map(existingBadges.map(b => [b.id, b]));
    const newAndUpgradedBadges: EarnedBadge[] = [];

    for (const badgeDef of ALL_BADGES) {
      const metricValue = this.getMetricValue(badgeDef.id, context);
      const existingBadge = badgeMap.get(badgeDef.id) as EarnedBadge | undefined;
      
      // Skip if no progress on this metric
      if (metricValue === 0 && !existingBadge) continue;

      // Find highest tier achieved
      let highestTierAchieved = null;
      for (let i = badgeDef.tiers.length - 1; i >= 0; i--) {
        if (metricValue >= badgeDef.tiers[i].threshold) {
          highestTierAchieved = badgeDef.tiers[i];
          break;
        }
      }

      if (!highestTierAchieved) continue; // Haven't hit Bronze yet

      // NEW BADGE: User hasn't earned this badge yet
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
        
        await this.earnBadge(newBadge);
        newAndUpgradedBadges.push(newBadge);
      }
      // TIER UPGRADE: User has this badge, check if they upgraded tier
      else if (existingBadge) {
        const currentTierIndex = badgeDef.tiers.findIndex(t => t.tier === existingBadge.currentTier);
        const highestTierIndex = badgeDef.tiers.indexOf(highestTierAchieved);
        
        // User upgraded to a higher tier!
        if (highestTierIndex > currentTierIndex) {
          const nextTier = highestTierIndex < badgeDef.tiers.length - 1 ? badgeDef.tiers[highestTierIndex + 1] : null;
          const progressPct = nextTier 
            ? Math.min(100, ((metricValue - highestTierAchieved.threshold) / (nextTier.threshold - highestTierAchieved.threshold)) * 100)
            : 100;

          await this.updateBadgeProgress(badgeDef.id, highestTierAchieved.tier, metricValue, progressPct);
          
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
        }
        // No tier upgrade, but update progress value
        else if (metricValue !== existingBadge.progressValue) {
          const nextTier = currentTierIndex < badgeDef.tiers.length - 1 ? badgeDef.tiers[currentTierIndex + 1] : null;
          const progressPct = nextTier 
            ? Math.min(100, ((metricValue - badgeDef.tiers[currentTierIndex].threshold) / (nextTier.threshold - badgeDef.tiers[currentTierIndex].threshold)) * 100)
            : 100;

          await this.updateBadgeProgress(badgeDef.id, existingBadge.currentTier, metricValue, progressPct);
        }
      }
    }

    return newAndUpgradedBadges;
  },
};
