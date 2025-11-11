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

export interface HeatMapStats {
    totalDays: number;
    activeDays: number;
    completeDays: number;
    perfectDays: number;
    restDays: number;
    currentStreak: number;
    longestStreak: number;
}

export interface HeatMapService {
    upsertDailyActivity(date: string, data: Partial<Omit<DailyActivitySummary, 'id' | 'user_id' | 'date' | 'created_at' | 'updated_at'>>): Promise<DailyActivitySummary | null>;
    getHeatMapData(startDate: string, endDate: string): Promise<HeatMapDay[]>;
    getHeatMapStats(startDate: string, endDate: string): Promise<HeatMapStats>;
    markRestDay(date: string): Promise<void>;
    unmarkRestDay(date: string): Promise<void>;
}

export const calculateActivityLevel = (summary: Partial<DailyActivitySummary>): ActivityLevel => {
    if (summary.is_rest_day) {
        return 'rest';
    }

    const hasWorkout = summary.workout_logged === true;
    const hasMeals = (summary.meals_logged || 0) >= 2;
    const hasWater = (summary.water_intake_oz || 0) >= (summary.goal_water_oz || 0) && (summary.goal_water_oz || 0) > 0;

    const activitiesCompleted = [hasWorkout, hasMeals, hasWater].filter(Boolean).length;

    if (activitiesCompleted === 3 && summary.hit_macros) {
        return 'perfect';
    }

    if (activitiesCompleted === 3) {
        return 'complete';
    }

    if (activitiesCompleted === 2) {
        return 'moderate';
    }

    if (activitiesCompleted === 1) {
        return 'low';
    }

    return 'none';
};

export const getMonthBoundaries = (year: number, month: number): { startDate: string; endDate: string } => {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    return { startDate, endDate };
};

export const getLastNDaysBoundaries = (days: number): { startDate: string; endDate: string } => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate, endDate };
};

export const createHeatMapService = (userId: string): HeatMapService => {
    const upsertDailyActivity = async (
        date: string,
        data: Partial<Omit<DailyActivitySummary, 'id' | 'user_id' | 'date' | 'created_at' | 'updated_at'>>
    ): Promise<DailyActivitySummary | null> => {
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
    };

    const getHeatMapData = async (startDate: string, endDate: string): Promise<HeatMapDay[]> => {
        try {
            const { data, error } = await supabase
                .from('daily_activity_summary')
                .select('*')
                .eq('user_id', userId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true });

            if (error) throw error;

            const heatMapDays: HeatMapDay[] = [];
            const currentDate = new Date(startDate);
            const end = new Date(endDate);

            while (currentDate <= end) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const summary = data?.find(d => d.date === dateStr);

                if (summary) {
                    heatMapDays.push({
                        date: dateStr,
                        level: calculateActivityLevel(summary),
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
    };

    const getHeatMapStats = async (startDate: string, endDate: string): Promise<HeatMapStats> => {
        const heatMapData = await getHeatMapData(startDate, endDate);

        const activeDays = heatMapData.filter(d => d.level !== 'none').length;
        const completeDays = heatMapData.filter(d => d.level === 'complete' || d.level === 'perfect').length;
        const perfectDays = heatMapData.filter(d => d.level === 'perfect').length;
        const restDays = heatMapData.filter(d => d.level === 'rest').length;

        let currentStreak = 0;
        for (let i = heatMapData.length - 1; i >= 0; i--) {
            if (heatMapData[i].level === 'complete' || heatMapData[i].level === 'perfect') {
                currentStreak++;
            } else if (heatMapData[i].level !== 'rest') {
                break;
            }
        }

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
    };

    const markRestDay = async (date: string): Promise<void> => {
        await upsertDailyActivity(date, { is_rest_day: true });
    };

    const unmarkRestDay = async (date: string): Promise<void> => {
        await upsertDailyActivity(date, { is_rest_day: false });
    };

    return {
        upsertDailyActivity,
        getHeatMapData,
        getHeatMapStats,
        markRestDay,
        unmarkRestDay,
    };
};

export const heatMapService = createHeatMapService('default_user');
