import { WorkoutHistory, Exercise } from '../types';

interface PerformanceLog {
    date: string;
    sets: {
        weight?: number;
        reps?: number;
        rpe?: number;
    }[];
}

export const getExerciseHistory = (history: WorkoutHistory, exerciseName: string): PerformanceLog[] => {
    const logs: PerformanceLog[] = [];

    // Iterate through history in reverse chronological order
    for (const completedWorkout of [...history].reverse()) {
        const exercise = completedWorkout.exercises.find(ex => ex.name.toLowerCase() === exerciseName.toLowerCase());

        if (exercise) {
            const completedSets = exercise.sets
                .filter(set => set.completed && set.actualReps && set.actualWeight)
                .map(set => ({
                    weight: set.actualWeight,
                    reps: set.actualReps,
                    rpe: set.rpe,
                }));
            
            if (completedSets.length > 0) {
                logs.push({
                    date: completedWorkout.dateCompleted,
                    sets: completedSets,
                });
            }
        }
    }

    // Return the last 3-4 sessions for this exercise to keep the context relevant
    return logs.slice(0, 4);
};

export const formatHistoryForPrompt = (exercise: Exercise, history: PerformanceLog[], weightUnit: 'kg' | 'lbs'): string => {
    if (history.length === 0) {
        return "No previous history for this exercise.";
    }

    let prompt = `Today's planned work: ${exercise.sets.length} sets of ${exercise.sets[0]?.targetReps || 'N/A'}.\n\nRecent Performance History:\n`;

    history.forEach(log => {
        prompt += `- ${log.date}: `;
        const setsSummary = log.sets.map(s => {
            const weight = s.weight ? `${s.weight}${weightUnit}` : 'Bodyweight';
            const reps = s.reps || 'N/A';
            const rpe = s.rpe ? ` (RPE ${s.rpe})` : '';
            return `${weight} x ${reps} reps${rpe}`;
        }).join(', ');
        prompt += `${setsSummary}\n`;
    });

    return prompt;
};
