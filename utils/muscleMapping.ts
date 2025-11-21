import { MuscleGroup } from '../types';

const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup[]> = {
    // CHEST
    'bench press': ['chest', 'shoulders', 'triceps'],
    'incline press': ['chest', 'shoulders', 'triceps'],
    'decline press': ['chest', 'triceps'],
    'push-up': ['chest', 'shoulders', 'triceps'],
    'push up': ['chest', 'shoulders', 'triceps'],
    'cable crossover': ['chest'],
    'dumbbell fly': ['chest', 'shoulders'],
    'chest press': ['chest', 'shoulders', 'triceps'],

    // BACK
    'pull-up': ['lats', 'biceps', 'traps'],
    'pull up': ['lats', 'biceps', 'traps'],
    'chin-up': ['lats', 'biceps'],
    'chin up': ['lats', 'biceps'],
    'lat pulldown': ['lats', 'biceps'],
    'bent over row': ['lats', 'traps', 'lower_back', 'biceps'],
    't-bar row': ['lats', 'traps', 'lower_back'],
    'deadlift': ['lower_back', 'glutes', 'hamstrings', 'traps', 'quads'],
    'romanian deadlift': ['hamstrings', 'glutes', 'lower_back'],
    'rdl': ['hamstrings', 'glutes', 'lower_back'],
    'good morning': ['hamstrings', 'glutes', 'lower_back'],
    'face pull': ['shoulders', 'traps'],

    // SHOULDERS
    'overhead press': ['shoulders', 'triceps'],
    'military press': ['shoulders', 'triceps'],
    'arnold press': ['shoulders'],
    'lateral raise': ['shoulders'],
    'front raise': ['shoulders'],

    // LEGS
    'squat': ['quads', 'glutes', 'hamstrings', 'lower_back'],
    'front squat': ['quads', 'glutes', 'abs'],
    'leg press': ['quads', 'glutes', 'hamstrings'],
    'lunge': ['quads', 'glutes', 'hamstrings'],
    'leg extension': ['quads'],
    'leg curl': ['hamstrings'],
    'calf raise': ['calves'],
    'hip thrust': ['glutes', 'hamstrings'],

    // ARMS
    'bicep curl': ['biceps'],
    'hammer curl': ['biceps'],
    'skull crusher': ['triceps'],
    'tricep pushdown': ['triceps'],
    'tricep extension': ['triceps'],

    // CORE
    'plank': ['abs', 'obliques'],
    'crunch': ['abs'],
    'leg raise': ['abs', 'obliques'],
};

export const getMusclesForExercise = (exerciseName: string): MuscleGroup[] => {
    const lowerCaseName = exerciseName.toLowerCase();
    // Prioritize longer keys for more specific matches (e.g., 'incline press' over 'press')
    const sortedKeys = Object.keys(EXERCISE_MUSCLE_MAP).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        if (lowerCaseName.includes(key)) {
            return EXERCISE_MUSCLE_MAP[key];
        }
    }
    return [];
};

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = ['shoulders', 'chest', 'biceps', 'triceps', 'abs', 'obliques', 'traps', 'lats', 'lower_back', 'glutes', 'quads', 'hamstrings', 'calves'];

export type RecoveryStatus = 'fresh' | 'recovering' | 'trained' | 'stale';

export interface MuscleGroupConfig {
  name: MuscleGroup;
  displayName: string;
  svgFilenameFront?: string;
  svgFilenameBack?: string;
  recoveryHours: number; // Hours needed for recovery
}

export const muscleGroupConfigs: Record<MuscleGroup, MuscleGroupConfig> = {
  chest: {
    name: 'chest',
    displayName: 'Chest',
    svgFilenameFront: 'Pectoralis Major.svg',
    recoveryHours: 48,
  },
  lats: {
    name: 'lats',
    displayName: 'Lats',
    svgFilenameBack: 'Lattisimus dorsi.svg',
    recoveryHours: 48,
  },
  shoulders: {
    name: 'shoulders',
    displayName: 'Shoulders',
    svgFilenameFront: 'Deltoids.svg',
    svgFilenameBack: 'Deltoids.svg',
    recoveryHours: 48,
  },
  biceps: {
    name: 'biceps',
    displayName: 'Biceps',
    svgFilenameFront: 'Biceps brachii.svg',
    recoveryHours: 48,
  },
  triceps: {
    name: 'triceps',
    displayName: 'Triceps',
    svgFilenameBack: 'Triceps Brachii ( long head, lateral head ).svg',
    svgFilenameFront: 'Triceps brachii, long head.svg',
    recoveryHours: 48,
  },
  abs: {
    name: 'abs',
    displayName: 'Abs',
    svgFilenameFront: 'Rectus Abdominus.svg',
    recoveryHours: 36,
  },
  obliques: {
    name: 'obliques',
    displayName: 'Obliques',
    svgFilenameFront: 'External obliques.svg',
    svgFilenameBack: 'External obliques.svg',
    recoveryHours: 36,
  },
  quads: {
    name: 'quads',
    displayName: 'Quadriceps',
    svgFilenameFront: 'Vastus Lateralis.svg',
    recoveryHours: 72,
  },
  hamstrings: {
    name: 'hamstrings',
    displayName: 'Hamstrings',
    svgFilenameBack: 'Biceps fermoris.svg',
    recoveryHours: 72,
  },
  glutes: {
    name: 'glutes',
    displayName: 'Glutes',
    svgFilenameBack: 'Gluteus maximus.svg',
    recoveryHours: 72,
  },
  calves: {
    name: 'calves',
    displayName: 'Calves',
    svgFilenameFront: 'Gastrocnemius (calf).svg',
    svgFilenameBack: 'Gastrocnemius, medial head.svg',
    recoveryHours: 48,
  },
  traps: {
    name: 'traps',
    displayName: 'Trapezius',
    svgFilenameBack: 'Lower Trapezius.svg',
    recoveryHours: 48,
  },
  lower_back: {
    name: 'lower_back',
    displayName: 'Lower Back',
    svgFilenameBack: 'Lower Trapezius.svg',
    recoveryHours: 72,
  },
};

export const getRecoveryStatus = (hoursSinceLastWorkout: number, recoveryHours: number): RecoveryStatus => {
  if (hoursSinceLastWorkout >= recoveryHours + 168) { // 7+ days
    return 'stale';
  } else if (hoursSinceLastWorkout >= recoveryHours) {
    return 'fresh';
  } else if (hoursSinceLastWorkout >= recoveryHours / 2) {
    return 'recovering';
  } else {
    return 'trained';
  }
};

export const getRecoveryColor = (status: RecoveryStatus): string => {
  switch (status) {
    case 'fresh':
      return '#10b981'; // green
    case 'recovering':
      return '#f59e0b'; // yellow/orange
    case 'trained':
      return '#ef4444'; // red
    case 'stale':
      return '#6b7280'; // gray
  }
};

export const getRecoveryLabel = (status: RecoveryStatus): string => {
  switch (status) {
    case 'fresh':
      return 'Ready to train';
    case 'recovering':
      return 'Recovering';
    case 'trained':
      return 'Recently trained';
    case 'stale':
      return 'Needs attention';
  }
};
