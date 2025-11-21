import { supabase } from './supabaseClient';

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_id: string | null;
  workout_name: string;
  workout_date: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSet {
  id: string;
  user_id: string;
  session_id: string;
  exercise_name: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rest_seconds: number | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PreviousSetData {
  set_number: number;
  weight_kg: number;
  reps: number;
  workout_date: string;
}

export const createWorkoutSessionService = (userId: string) => {
  /**
   * Start a new workout session
   */
  const startSession = async (
    workoutName: string,
    workoutId: string | null = null,
    workoutDate: string = new Date().toISOString().split('T')[0]
  ): Promise<WorkoutSession> => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: userId,
          workout_id: workoutId,
          workout_name: workoutName,
          workout_date: workoutDate,
          start_time: new Date().toISOString(),
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starting workout session:', error);
      throw error;
    }
  };

  /**
   * Get active (incomplete) session for today
   */
  const getActiveSession = async (): Promise<WorkoutSession | null> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_date', today)
        .eq('is_completed', false)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting active session:', error);
      throw error;
    }
  };

  /**
   * Add or update a set
   */
  const upsertSet = async (
    sessionId: string,
    exerciseName: string,
    setNumber: number,
    weightKg: number | null = null,
    reps: number | null = null,
    isCompleted: boolean = false
  ): Promise<WorkoutSet> => {
    try {
      const setData: any = {
        user_id: userId,
        session_id: sessionId,
        exercise_name: exerciseName,
        set_number: setNumber,
        weight_kg: weightKg,
        reps: reps,
        is_completed: isCompleted,
      };

      if (isCompleted) {
        setData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('workout_sets')
        .upsert(setData, {
          onConflict: 'session_id,exercise_name,set_number',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting set:', error);
      throw error;
    }
  };

  /**
   * Mark a set as completed
   */
  const completeSet = async (
    sessionId: string,
    exerciseName: string,
    setNumber: number,
    weightKg: number,
    reps: number,
    restSeconds: number | null = null
  ): Promise<WorkoutSet> => {
    return upsertSet(sessionId, exerciseName, setNumber, weightKg, reps, true);
  };

  /**
   * Get all sets for a session
   */
  const getSessionSets = async (sessionId: string): Promise<WorkoutSet[]> => {
    try {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .order('exercise_name')
        .order('set_number');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting session sets:', error);
      throw error;
    }
  };

  /**
   * Get previous workout data for an exercise
   */
  const getPreviousWorkoutSets = async (
    exerciseName: string,
    currentSessionId: string | null = null
  ): Promise<PreviousSetData[]> => {
    try {
      const { data, error} = await supabase.rpc('get_previous_workout_sets', {
        p_user_id: userId,
        p_exercise_name: exerciseName,
        p_current_session_id: currentSessionId,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting previous workout sets:', error);
      return [];
    }
  };

  /**
   * Complete a workout session
   */
  const completeSession = async (sessionId: string): Promise<WorkoutSession> => {
    try {
      const { data, error } = await supabase.rpc('complete_workout_session', {
        p_user_id: userId,
        p_session_id: sessionId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  };

  /**
   * Delete a workout session (and all its sets due to CASCADE)
   */
  const deleteSession = async (sessionId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };

  /**
   * Get workout history for a date range
   */
  const getWorkoutHistory = async (
    startDate: string,
    endDate: string
  ): Promise<WorkoutSession[]> => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .gte('workout_date', startDate)
        .lte('workout_date', endDate)
        .order('workout_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting workout history:', error);
      throw error;
    }
  };

  return {
    startSession,
    getActiveSession,
    upsertSet,
    completeSet,
    getSessionSets,
    getPreviousWorkoutSets,
    completeSession,
    deleteSession,
    getWorkoutHistory,
  };
};
