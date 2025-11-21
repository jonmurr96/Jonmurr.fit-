import { supabase } from './supabaseClient';
import { MuscleGroup } from '../types';
import { getMusclesForExercise } from '../utils/muscleMapping';

export interface MuscleEngagement {
  id: string;
  user_id: string;
  workout_id: string | null;
  workout_name: string | null;
  workout_date: string;
  muscle_group: MuscleGroup;
  intensity: number;
  created_at: string;
  updated_at: string;
}

export interface MuscleRecoveryStatus {
  muscle_group: MuscleGroup;
  last_trained_date: string | null;
  days_since_trained: number;
  total_workouts: number;
  avg_intensity: number;
}

export const createMuscleTrackingService = (userId: string) => {
  /**
   * Track muscle engagement for a workout
   */
  const trackMuscleEngagement = async (
    workoutId: string | null,
    workoutName: string,
    workoutDate: string,
    muscleGroups: MuscleGroup[],
    intensities?: number[]
  ): Promise<MuscleEngagement[]> => {
    try {
      const { data, error } = await supabase.rpc('track_muscle_engagement', {
        p_user_id: userId,
        p_workout_id: workoutId,
        p_workout_name: workoutName,
        p_workout_date: workoutDate,
        p_muscle_groups: muscleGroups,
        p_intensities: intensities || null,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error tracking muscle engagement:', error);
      throw error;
    }
  };

  /**
   * Auto-detect and track muscles from workout exercises
   */
  const trackMusclesFromExercises = async (
    workoutId: string | null,
    workoutName: string,
    workoutDate: string,
    exercises: Array<{ name: string; sets?: number }>
  ): Promise<MuscleEngagement[]> => {
    try {
      // Extract unique muscle groups from exercises
      const muscleGroupsSet = new Set<MuscleGroup>();
      const intensityMap = new Map<MuscleGroup, number[]>();

      exercises.forEach(exercise => {
        const muscles = getMusclesForExercise(exercise.name);
        muscles.forEach(muscle => {
          muscleGroupsSet.add(muscle);
          
          // Estimate intensity based on number of sets (more sets = more volume)
          const intensity = exercise.sets ? Math.min(exercise.sets * 2, 10) : 5;
          
          if (!intensityMap.has(muscle)) {
            intensityMap.set(muscle, []);
          }
          intensityMap.get(muscle)!.push(intensity);
        });
      });

      const muscleGroups = Array.from(muscleGroupsSet);
      
      // Average intensities for muscles hit by multiple exercises
      const intensities = muscleGroups.map(muscle => {
        const values = intensityMap.get(muscle) || [5];
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      });

      return await trackMuscleEngagement(
        workoutId,
        workoutName,
        workoutDate,
        muscleGroups,
        intensities
      );
    } catch (error) {
      console.error('Error tracking muscles from exercises:', error);
      throw error;
    }
  };

  /**
   * Get recovery status for all muscle groups
   */
  const getMuscleRecoveryStatus = async (
    daysBack: number = 30
  ): Promise<MuscleRecoveryStatus[]> => {
    try {
      const { data, error } = await supabase.rpc('get_muscle_recovery_status', {
        p_user_id: userId,
        p_days_back: daysBack,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting muscle recovery status:', error);
      throw error;
    }
  };

  /**
   * Get fresh muscles ready to train
   */
  const getFreshMuscles = async (
    recoveryHours: number = 48
  ): Promise<Array<{ muscle_group: MuscleGroup; last_trained_date: string; hours_since_trained: number }>> => {
    try {
      const { data, error } = await supabase.rpc('get_fresh_muscles', {
        p_user_id: userId,
        p_recovery_hours: recoveryHours,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting fresh muscles:', error);
      throw error;
    }
  };

  /**
   * Get muscle engagement history for a specific muscle group
   */
  const getMuscleHistory = async (
    muscleGroup: MuscleGroup,
    limit: number = 30
  ): Promise<MuscleEngagement[]> => {
    try {
      const { data, error } = await supabase
        .from('workout_muscle_engagement')
        .select('*')
        .eq('user_id', userId)
        .eq('muscle_group', muscleGroup)
        .order('workout_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting muscle history:', error);
      throw error;
    }
  };

  /**
   * Get all muscle engagements for a specific workout
   */
  const getWorkoutMuscles = async (
    workoutId: string
  ): Promise<MuscleEngagement[]> => {
    try {
      const { data, error } = await supabase
        .from('workout_muscle_engagement')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_id', workoutId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting workout muscles:', error);
      throw error;
    }
  };

  /**
   * Get muscle engagement summary for date range
   */
  const getMuscleEngagementSummary = async (
    startDate: string,
    endDate: string
  ): Promise<Record<MuscleGroup, { count: number; avgIntensity: number }>> => {
    try {
      const { data, error } = await supabase
        .from('workout_muscle_engagement')
        .select('*')
        .eq('user_id', userId)
        .gte('workout_date', startDate)
        .lte('workout_date', endDate);

      if (error) throw error;

      const summary: Record<string, { count: number; totalIntensity: number }> = {};
      
      (data || []).forEach((engagement: MuscleEngagement) => {
        if (!summary[engagement.muscle_group]) {
          summary[engagement.muscle_group] = { count: 0, totalIntensity: 0 };
        }
        summary[engagement.muscle_group].count++;
        summary[engagement.muscle_group].totalIntensity += engagement.intensity;
      });

      const result: Record<string, { count: number; avgIntensity: number }> = {};
      Object.entries(summary).forEach(([muscle, stats]) => {
        result[muscle] = {
          count: stats.count,
          avgIntensity: Math.round(stats.totalIntensity / stats.count * 10) / 10,
        };
      });

      return result as Record<MuscleGroup, { count: number; avgIntensity: number }>;
    } catch (error) {
      console.error('Error getting muscle engagement summary:', error);
      throw error;
    }
  };

  return {
    trackMuscleEngagement,
    trackMusclesFromExercises,
    getMuscleRecoveryStatus,
    getFreshMuscles,
    getMuscleHistory,
    getWorkoutMuscles,
    getMuscleEngagementSummary,
  };
};
