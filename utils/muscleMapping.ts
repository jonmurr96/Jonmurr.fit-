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
