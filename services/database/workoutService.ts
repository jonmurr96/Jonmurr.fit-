import { supabase } from '../supabaseClient';
import { TrainingProgram, Workout, SavedWorkout, WorkoutHistory, CompletedWorkout } from '../../types';

const USER_ID = 'default_user';

export const workoutService = {
  async getActiveProgram(): Promise<TrainingProgram | null> {
    const { data, error } = await supabase
      .from('training_programs')
      .select(`
        *,
        workouts (
          *,
          exercises (
            *,
            workout_sets (*)
          )
        )
      `)
      .eq('user_id', USER_ID)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Error fetching active program:', error);
      return null;
    }

    return this.mapProgramFromDb(data);
  },

  async saveProgram(program: TrainingProgram, isActive: boolean = false): Promise<void> {
    const { data: programData, error: programError } = await supabase
      .from('training_programs')
      .insert({
        user_id: USER_ID,
        program_name: program.programName,
        duration_weeks: program.durationWeeks,
        description: program.description,
        split_type: program.splitType,
        preferences: program.preferences,
        is_active: isActive,
      })
      .select()
      .single();

    if (programError || !programData) {
      console.error('Error saving program:', programError);
      throw programError;
    }

    for (const workout of program.workouts) {
      await this.saveWorkoutToProgram(programData.id, workout);
    }
  },

  async saveWorkoutToProgram(programId: string, workout: Workout): Promise<void> {
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        program_id: programId,
        day: workout.day,
        focus: workout.focus,
        completed: workout.completed,
        optional_blocks: workout.optionalBlocks,
      })
      .select()
      .single();

    if (workoutError || !workoutData) {
      console.error('Error saving workout:', workoutError);
      throw workoutError;
    }

    for (let i = 0; i < workout.exercises.length; i++) {
      const exercise = workout.exercises[i];
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .insert({
          workout_id: workoutData.id,
          name: exercise.name,
          category: exercise.category,
          is_favorite: exercise.isFavorite,
          exercise_order: i,
        })
        .select()
        .single();

      if (exerciseError || !exerciseData) {
        console.error('Error saving exercise:', exerciseError);
        throw exerciseError;
      }

      const sets = exercise.sets.map((set, index) => ({
        exercise_id: exerciseData.id,
        set_number: index + 1,
        target_reps: set.targetReps,
        target_weight: set.targetWeight,
        actual_reps: set.actualReps,
        actual_weight: set.actualWeight,
        rpe: set.rpe,
        rest_minutes: set.restMinutes,
        completed: set.completed,
      }));

      const { error: setsError } = await supabase
        .from('workout_sets')
        .insert(sets);

      if (setsError) {
        console.error('Error saving sets:', setsError);
        throw setsError;
      }
    }
  },

  async updateWorkoutCompletion(programId: string, workoutDay: number, completed: boolean): Promise<void> {
    const { error } = await supabase
      .from('workouts')
      .update({ completed })
      .eq('program_id', programId)
      .eq('day', workoutDay);

    if (error) {
      console.error('Error updating workout completion:', error);
      throw error;
    }
  },

  async logCompletedWorkout(workout: CompletedWorkout): Promise<void> {
    const { error } = await supabase
      .from('workout_history')
      .insert({
        user_id: USER_ID,
        workout_data: workout,
        date_completed: workout.dateCompleted,
      });

    if (error) {
      console.error('Error logging completed workout:', error);
      throw error;
    }
  },

  async getWorkoutHistory(): Promise<WorkoutHistory> {
    const { data, error } = await supabase
      .from('workout_history')
      .select('*')
      .eq('user_id', USER_ID)
      .order('date_completed', { ascending: false });

    if (error) {
      console.error('Error fetching workout history:', error);
      return [];
    }

    return (data || []).map((record: any) => record.workout_data as CompletedWorkout);
  },

  async getSavedWorkouts(): Promise<SavedWorkout[]> {
    const { data, error } = await supabase
      .from('saved_workouts')
      .select('*')
      .eq('user_id', USER_ID)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved workouts:', error);
      return [];
    }

    return (data || []).map((record: any) => ({
      id: record.id,
      programName: record.program_name,
      durationWeeks: record.duration_weeks,
      description: record.description,
      splitType: record.split_type,
      preferences: record.preferences,
      workouts: [],
      tags: record.tags || [],
      lastPerformed: record.last_performed,
      isPinned: record.is_pinned,
    }));
  },

  mapProgramFromDb(data: any): TrainingProgram {
    const workouts = (data.workouts || []).map((workout: any) => ({
      id: workout.id,
      day: workout.day,
      focus: workout.focus,
      completed: workout.completed,
      optionalBlocks: workout.optional_blocks,
      exercises: (workout.exercises || [])
        .sort((a: any, b: any) => a.exercise_order - b.exercise_order)
        .map((exercise: any) => ({
          id: exercise.id,
          name: exercise.name,
          category: exercise.category,
          isFavorite: exercise.is_favorite,
          sets: (exercise.workout_sets || [])
            .sort((a: any, b: any) => a.set_number - b.set_number)
            .map((set: any) => ({
              id: set.id,
              targetReps: set.target_reps,
              targetWeight: set.target_weight,
              actualReps: set.actual_reps,
              actualWeight: set.actual_weight,
              rpe: set.rpe,
              restMinutes: set.rest_minutes,
              completed: set.completed,
            })),
        })),
    }));

    return {
      programName: data.program_name,
      durationWeeks: data.duration_weeks,
      description: data.description,
      splitType: data.split_type,
      preferences: data.preferences,
      workouts,
    };
  },
};
