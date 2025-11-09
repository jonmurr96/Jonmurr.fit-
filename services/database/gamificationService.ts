import { supabase } from '../supabaseClient';
import { GamificationState, EarnedBadge, Challenge } from '../../types';

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
};
