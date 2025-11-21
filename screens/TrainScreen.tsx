import React, { useState, useEffect } from 'react';
import { TrainingProgram, Workout, WorkoutHistory } from '../types';
import { ArrowLeftIcon } from '../components/Icons';
import { WeekCalendar } from '../components/workout/WeekCalendar';
import { ExerciseCard } from '../components/workout/ExerciseCard';
import { RestTimer } from '../components/workout/RestTimer';
import { createWorkoutSessionService, WorkoutSession, WorkoutSet as DBWorkoutSet, PreviousSetData } from '../services/workoutSessionService';
import { createMuscleTrackingService } from '../services/muscleTrackingService';
import { useAuth } from '../contexts/AuthContext';

interface TrainScreenProps {
  program: TrainingProgram | null;
  setProgram: React.Dispatch<React.SetStateAction<TrainingProgram | null>>;
  completeWorkout: (workout: Workout) => void;
  workoutHistory: WorkoutHistory;
}

export const TrainScreen: React.FC<TrainScreenProps> = ({
  program,
  setProgram,
  completeWorkout,
  workoutHistory,
}) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [sessionSets, setSessionSets] = useState<DBWorkoutSet[]>([]);
  const [previousSetsMap, setPreviousSetsMap] = useState<Record<string, PreviousSetData[]>>({});
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [restDuration, setRestDuration] = useState(45);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(() => {
    const saved = localStorage.getItem('weightUnit');
    return (saved === 'lbs' ? 'lbs' : 'kg') as 'kg' | 'lbs';
  });

  const workoutSessionService = user ? createWorkoutSessionService(user.id) : null;
  const muscleTrackingService = user ? createMuscleTrackingService(user.id) : null;

  useEffect(() => {
    if (!user || !workoutSessionService) return;

    const initializeWorkout = async () => {
      try {
        setIsLoading(true);

        const existingSession = await workoutSessionService.getActiveSession();

        if (existingSession) {
          setActiveSession(existingSession);
          const sets = await workoutSessionService.getSessionSets(existingSession.id);
          setSessionSets(sets);

          const exerciseNames = [...new Set(sets.map(s => s.exercise_name))];
          await loadPreviousSetsForExercises(exerciseNames, existingSession.id);
        } else if (program) {
          const todayWorkout = getTodaysWorkout();
          if (todayWorkout) {
            const newSession = await workoutSessionService.startSession(
              todayWorkout.focus,
              todayWorkout.id,
              selectedDate.toISOString().split('T')[0]
            );
            setActiveSession(newSession);
            setCurrentWorkout(todayWorkout);

            const exerciseNames = todayWorkout.exercises.map(e => e.name);
            await loadPreviousSetsForExercises(exerciseNames, newSession.id);
          }
        }
      } catch (error) {
        console.error('Error initializing workout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeWorkout();
  }, [user]);

  const loadPreviousSetsForExercises = async (exerciseNames: string[], currentSessionId: string) => {
    if (!workoutSessionService) return;

    const previousData: Record<string, PreviousSetData[]> = {};
    
    await Promise.all(
      exerciseNames.map(async (exerciseName) => {
        const previous = await workoutSessionService.getPreviousWorkoutSets(exerciseName, currentSessionId);
        previousData[exerciseName] = previous;
      })
    );

    setPreviousSetsMap(previousData);
  };

  const getTodaysWorkout = (): Workout | null => {
    if (!program) return null;

    const dayOfWeek = selectedDate.getDay();
    const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

    const workout = program.workouts.find(w => w.day === dayNumber);
    return workout || null;
  };

  const toggleWeightUnit = () => {
    const newUnit = weightUnit === 'kg' ? 'lbs' : 'kg';
    setWeightUnit(newUnit);
    localStorage.setItem('weightUnit', newUnit);
  };

  const handleSetComplete = async (exerciseName: string, setNumber: number, weightKg: number, reps: number) => {
    if (!activeSession || !workoutSessionService) return;

    try {
      const completedSet = await workoutSessionService.completeSet(
        activeSession.id,
        exerciseName,
        setNumber,
        weightKg,
        reps
      );

      setSessionSets(prev => {
        const filtered = prev.filter(
          s => !(s.exercise_name === exerciseName && s.set_number === setNumber)
        );
        return [...filtered, completedSet];
      });
    } catch (error) {
      console.error('Error completing set:', error);
      throw error;
    }
  };

  const handleSetUpdate = async (exerciseName: string, setNumber: number, weightKg: number | null, reps: number | null) => {
    if (!activeSession || !workoutSessionService) return;

    try {
      await workoutSessionService.upsertSet(
        activeSession.id,
        exerciseName,
        setNumber,
        weightKg,
        reps,
        false
      );
    } catch (error) {
      console.error('Error updating set:', error);
    }
  };

  const handleStartRestTimer = (duration: number) => {
    setRestDuration(duration);
    setIsRestTimerOpen(true);
  };

  const handleFinishWorkout = async () => {
    if (!activeSession || !workoutSessionService || !muscleTrackingService) return;

    const confirmFinish = window.confirm('Are you sure you want to finish this workout?');
    if (!confirmFinish) return;

    try {
      const completedSession = await workoutSessionService.completeSession(activeSession.id);

      if (currentWorkout) {
        const exercises = currentWorkout.exercises.map(e => ({
          name: e.name,
          sets: e.sets.length,
        }));
        await muscleTrackingService.trackMusclesFromExercises(
          activeSession.workout_id,
          activeSession.workout_name,
          activeSession.workout_date,
          exercises
        );

        completeWorkout(currentWorkout);
      }

      setActiveSession(null);
      setSessionSets([]);
      setCurrentWorkout(null);

      alert('Workout completed! Great job! 💪');
    } catch (error) {
      console.error('Error finishing workout:', error);
      alert('Failed to complete workout. Please try again.');
    }
  };

  const handleBack = () => {
    if (activeSession) {
      const confirmExit = window.confirm('You have an active workout. Are you sure you want to leave?');
      if (!confirmExit) return;
    }
    setProgram(null);
  };

  const workout = currentWorkout || getTodaysWorkout();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="bg-zinc-900 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold mb-2">No Workout Today</h2>
            <p className="text-zinc-400">
              You don't have a workout scheduled for this day. Try selecting a different day or creating a new program.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getExerciseSets = (exerciseName: string): DBWorkoutSet[] => {
    return sessionSets.filter(s => s.exercise_name === exerciseName);
  };

  const getPreviousSets = (exerciseName: string): PreviousSetData[] => {
    return previousSetsMap[exerciseName] || [];
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>

          <div className="flex-1 text-center px-4">
            <h1 className="text-xl font-bold truncate">{workout.focus}</h1>
            {activeSession && (
              <p className="text-sm text-zinc-400">
                {new Date(activeSession.start_time).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          <button
            onClick={handleFinishWorkout}
            disabled={!activeSession}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg font-semibold transition-colors"
          >
            Finish
          </button>
        </div>

        {/* Week Calendar */}
        <div className="mb-6">
          <WeekCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            workoutDates={program?.workouts.map(w => {
              const date = new Date();
              const dayOffset = w.day - date.getDay();
              date.setDate(date.getDate() + dayOffset);
              return date.toISOString().split('T')[0];
            }) || []}
          />
        </div>

        {/* Workout Info */}
        <div className="bg-zinc-900 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">Exercises</p>
              <p className="text-xl font-bold">{workout.exercises.length}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Total Sets</p>
              <p className="text-xl font-bold">
                {workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Completed</p>
              <p className="text-xl font-bold text-green-500">
                {sessionSets.filter(s => s.is_completed).length}
              </p>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          {workout.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exerciseName={exercise.name}
              targetSets={exercise.sets.length}
              currentSets={getExerciseSets(exercise.name)}
              previousSets={getPreviousSets(exercise.name)}
              weightUnit={weightUnit}
              onWeightUnitToggle={toggleWeightUnit}
              onSetComplete={(setNumber, weightKg, reps) =>
                handleSetComplete(exercise.name, setNumber, weightKg, reps)
              }
              onSetUpdate={(setNumber, weightKg, reps) =>
                handleSetUpdate(exercise.name, setNumber, weightKg, reps)
              }
              onStartRestTimer={handleStartRestTimer}
            />
          ))}
        </div>

        {/* Empty State */}
        {workout.exercises.length === 0 && (
          <div className="bg-zinc-900 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🏋️</div>
            <h3 className="text-xl font-bold mb-2">No Exercises</h3>
            <p className="text-zinc-400">
              This workout doesn't have any exercises yet.
            </p>
          </div>
        )}
      </div>

      {/* Rest Timer Modal */}
      <RestTimer
        isOpen={isRestTimerOpen}
        onClose={() => setIsRestTimerOpen(false)}
        initialDuration={restDuration}
        onComplete={() => {
          setIsRestTimerOpen(false);
        }}
      />
    </div>
  );
};

export default TrainScreen;
