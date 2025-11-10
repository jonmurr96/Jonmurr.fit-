import { supabase } from '../supabaseClient';

export interface DailyActivitySummary {
    id: string;
    user_id: string;
    date: string;
    workout_logged: boolean;
    meals_logged: number;
    water_intake_oz: number;
    goal_water_oz: number;
    hit_macros: boolean;
    hit_protein_goal: boolean;
    is_rest_day: boolean;
    created_at: string;
    updated_at: string;
}

export type ActivityLevel = 'none' | 'low' | 'moderate' | 'complete' | 'perfect' | 'rest';

export interface HeatMapDay {
    date: string;
    level: ActivityLevel;
    workout_logged: boolean;
    meals_logged: number;
    water_intake_oz: number;
    water_goal_met: boolean;
    hit_macros: boolean;
    hit_protein_goal: boolean;
    is_rest_day: boolean;
}

class HeatMapService {
    /**
     * Calculate activity level based on daily summary
     * Returns: none (gray), low (red), moderate (orange), complete (green), perfect (diamond), rest (blue)
     */
    calculateActivityLevel(summary: Partial<DailyActivitySummary>): ActivityLevel {
        if (summary.is_rest_day) {
            return 'rest';
        }

        const hasWorkout = summary.workout_logged === true;
        const hasMeals = (summary.meals_logged || 0) >= 2;
        const hasWater = (summary.water_intake_oz || 0) >= (summary.goal_water_oz || 0) && (summary.goal_water_oz || 0) > 0;

        const activitiesCompleted = [hasWorkout, hasMeals, hasWater].filter(Boolean).length;

        // Perfect day: all 3 activities + hit macros
        if (activitiesCompleted === 3 && summary.hit_macros) {
            return 'perfect';
        }

        // Complete day: all 3 activities
        if (activitiesCompleted === 3) {
            return 'complete';
        }

        // Moderate: 2 activities
        if (activitiesCompleted === 2) {
            return 'moderate';
        }

        // Low: 1 activity
        if (activitiesCompleted === 1) {
            return 'low';
        }

        // None: no activities
        return 'none';
    }

    /**
     * Upsert daily activity summary for a user
     */
    async upsertDailyActivity(
        userId: string,
        date: string,
        data: Partial<Omit<DailyActivitySummary, 'id' | 'user_id' | 'date' | 'created_at' | 'updated_at'>>
    ): Promise<DailyActivitySummary | null> {
        try {
            const { data: result, error } = await supabase.rpc('upsert_daily_activity', {
                p_user_id: userId,
                p_date: date,
                p_workout_logged: data.workout_logged,
                p_meals_logged: data.meals_logged,
                p_water_intake_oz: data.water_intake_oz,
                p_goal_water_oz: data.goal_water_oz,
                p_hit_macros: data.hit_macros,
                p_hit_protein_goal: data.hit_protein_goal,
                p_is_rest_day: data.is_rest_day,
            });

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error upserting daily activity:', error);
            return null;
        }
    }

    /**
     * Get heat map data for a date range
     */
    async getHeatMapData(userId: string, startDate: string, endDate: string): Promise<HeatMapDay[]> {
        try {
            const { data, error } = await supabase
                .from('daily_activity_summary')
                .select('*')
                .eq('user_id', userId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true });

            if (error) throw error;

            // Fill in missing dates with 'none' level
            const heatMapDays: HeatMapDay[] = [];
            const currentDate = new Date(startDate);
            const end = new Date(endDate);

            while (currentDate <= end) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const summary = data?.find(d => d.date === dateStr);

                if (summary) {
                    heatMapDays.push({
                        date: dateStr,
                        level: this.calculateActivityLevel(summary),
                        workout_logged: summary.workout_logged,
                        meals_logged: summary.meals_logged,
                        water_intake_oz: summary.water_intake_oz,
                        water_goal_met: summary.water_intake_oz >= summary.goal_water_oz && summary.goal_water_oz > 0,
                        hit_macros: summary.hit_macros,
                        hit_protein_goal: summary.hit_protein_goal,
                        is_rest_day: summary.is_rest_day,
                    });
                } else {
                    heatMapDays.push({
                        date: dateStr,
                        level: 'none',
                        workout_logged: false,
                        meals_logged: 0,
                        water_intake_oz: 0,
                        water_goal_met: false,
                        hit_macros: false,
                        hit_protein_goal: false,
                        is_rest_day: false,
                    });
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            return heatMapDays;
        } catch (error) {
            console.error('Error fetching heat map data:', error);
            return [];
        }
    }

    /**
     * Get heat map summary stats for a date range
     */
    async getHeatMapStats(userId: string, startDate: string, endDate: string): Promise<{
        totalDays: number;
        activeDays: number;
        completeDays: number;
        perfectDays: number;
        restDays: number;
        currentStreak: number;
        longestStreak: number;
    }> {
        const heatMapData = await this.getHeatMapData(userId, startDate, endDate);

        const activeDays = heatMapData.filter(d => d.level !== 'none').length;
        const completeDays = heatMapData.filter(d => d.level === 'complete' || d.level === 'perfect').length;
        const perfectDays = heatMapData.filter(d => d.level === 'perfect').length;
        const restDays = heatMapData.filter(d => d.level === 'rest').length;

        // Calculate current streak (complete or perfect days from most recent backwards)
        let currentStreak = 0;
        for (let i = heatMapData.length - 1; i >= 0; i--) {
            if (heatMapData[i].level === 'complete' || heatMapData[i].level === 'perfect') {
                currentStreak++;
            } else if (heatMapData[i].level !== 'rest') {
                // Stop counting if we hit a non-rest, non-complete day
                break;
            }
        }

        // Calculate longest streak
        let longestStreak = 0;
        let tempStreak = 0;
        for (const day of heatMapData) {
            if (day.level === 'complete' || day.level === 'perfect') {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else if (day.level !== 'rest') {
                tempStreak = 0;
            }
        }

        return {
            totalDays: heatMapData.length,
            activeDays,
            completeDays,
            perfectDays,
            restDays,
            currentStreak,
            longestStreak,
        };
    }

    /**
     * Mark a day as a rest day
     */
    async markRestDay(userId: string, date: string): Promise<void> {
        await this.upsertDailyActivity(userId, date, { is_rest_day: true });
    }

    /**
     * Unmark a rest day
     */
    async unmarkRestDay(userId: string, date: string): Promise<void> {
        await this.upsertDailyActivity(userId, date, { is_rest_day: false });
    }

    /**
     * Get month boundaries for navigation
     */
    getMonthBoundaries(year: number, month: number): { startDate: string; endDate: string } {
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        return { startDate, endDate };
    }

    /**
     * Get last N days boundaries
     */
    getLastNDaysBoundaries(days: number): { startDate: string; endDate: string } {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return { startDate, endDate };
    }
}

export const heatMapService = new HeatMapService();
