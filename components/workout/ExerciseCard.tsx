import React, { useState, useEffect } from 'react';
import { PreviousSetData, WorkoutSet } from '../../services/workoutSessionService';

interface ExerciseSet {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  isCompleted: boolean;
}

interface ExerciseCardProps {
  exerciseName: string;
  targetSets: number;
  currentSets: WorkoutSet[];
  previousSets: PreviousSetData[];
  onSetComplete: (setNumber: number, weightKg: number, reps: number) => Promise<void>;
  onSetUpdate: (setNumber: number, weightKg: number | null, reps: number | null) => void;
  onStartRestTimer: (duration: number) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exerciseName,
  targetSets,
  currentSets,
  previousSets,
  onSetComplete,
  onSetUpdate,
  onStartRestTimer,
}) => {
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [editingSet, setEditingSet] = useState<number | null>(null);

  useEffect(() => {
    // Initialize sets based on targetSets
    const initialSets: ExerciseSet[] = [];
    for (let i = 1; i <= targetSets; i++) {
      const existingSet = currentSets.find(s => s.set_number === i);
      initialSets.push({
        setNumber: i,
        weightKg: existingSet?.weight_kg ?? null,
        reps: existingSet?.reps ?? null,
        isCompleted: existingSet?.is_completed ?? false,
      });
    }
    setSets(initialSets);
  }, [targetSets, currentSets]);

  const getPreviousSet = (setNumber: number): PreviousSetData | null => {
    return previousSets.find(s => s.set_number === setNumber) || null;
  };

  const handleCheckSet = async (setNumber: number) => {
    const set = sets.find(s => s.setNumber === setNumber);
    if (!set || set.isCompleted) return;

    // Validation
    if (set.weightKg === null || set.reps === null || set.weightKg <= 0 || set.reps <= 0) {
      alert('Please enter valid weight and reps');
      return;
    }

    try {
      await onSetComplete(setNumber, set.weightKg, set.reps);
      
      // Update local state
      setSets(prev =>
        prev.map(s =>
          s.setNumber === setNumber ? { ...s, isCompleted: true } : s
        )
      );

      // Auto-start rest timer (45 seconds default)
      onStartRestTimer(45);
    } catch (error) {
      console.error('Error completing set:', error);
      alert('Failed to save set');
    }
  };

  const handleWeightChange = (setNumber: number, value: string) => {
    const weightKg = value === '' ? null : parseFloat(value);
    setSets(prev =>
      prev.map(s =>
        s.setNumber === setNumber ? { ...s, weightKg } : s
      )
    );
    onSetUpdate(setNumber, weightKg, sets.find(s => s.setNumber === setNumber)?.reps ?? null);
  };

  const handleRepsChange = (setNumber: number, value: string) => {
    const reps = value === '' ? null : parseInt(value, 10);
    setSets(prev =>
      prev.map(s =>
        s.setNumber === setNumber ? { ...s, reps } : s
      )
    );
    onSetUpdate(setNumber, sets.find(s => s.setNumber === setNumber)?.weightKg ?? null, reps);
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 mb-4">
      {/* Exercise Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{exerciseName}</h3>
          <p className="text-sm text-zinc-400">
            {sets.filter(s => s.isCompleted).length} / {targetSets} sets completed
          </p>
        </div>
      </div>

      {/* Sets Table */}
      <div className="space-y-2">
        {/* Table Header */}
        <div className="grid grid-cols-[50px_90px_90px_90px_50px] gap-2 text-xs font-semibold text-zinc-500 px-2">
          <div>Set</div>
          <div>Previous</div>
          <div>Weight (kg)</div>
          <div>Reps</div>
          <div></div>
        </div>

        {/* Set Rows */}
        {sets.map((set) => {
          const previous = getPreviousSet(set.setNumber);
          const isEditing = editingSet === set.setNumber;

          return (
            <div
              key={set.setNumber}
              className={`
                grid grid-cols-[50px_90px_90px_90px_50px] gap-2 items-center
                p-2 rounded-lg transition-colors
                ${set.isCompleted ? 'bg-green-500/10' : 'bg-zinc-800'}
              `}
            >
              {/* Set Number */}
              <div className="text-center font-bold text-white">
                {set.setNumber}
              </div>

              {/* Previous */}
              <div className="text-center text-sm text-zinc-400">
                {previous ? (
                  <span>{previous.weight_kg} × {previous.reps}</span>
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </div>

              {/* Weight Input */}
              <div>
                <input
                  type="number"
                  inputMode="decimal"
                  value={set.weightKg ?? ''}
                  onChange={(e) => handleWeightChange(set.setNumber, e.target.value)}
                  onFocus={() => setEditingSet(set.setNumber)}
                  onBlur={() => setEditingSet(null)}
                  disabled={set.isCompleted}
                  placeholder="0"
                  className={`
                    w-full px-3 py-2 rounded-lg text-center font-semibold
                    border-2 transition-all
                    ${set.isCompleted
                      ? 'bg-green-500/20 border-green-500/30 text-green-400 cursor-not-allowed'
                      : 'bg-zinc-700 border-zinc-600 text-white focus:border-green-500 focus:bg-zinc-600'
                    }
                  `}
                />
              </div>

              {/* Reps Input */}
              <div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={set.reps ?? ''}
                  onChange={(e) => handleRepsChange(set.setNumber, e.target.value)}
                  onFocus={() => setEditingSet(set.setNumber)}
                  onBlur={() => setEditingSet(null)}
                  disabled={set.isCompleted}
                  placeholder="0"
                  className={`
                    w-full px-3 py-2 rounded-lg text-center font-semibold
                    border-2 transition-all
                    ${set.isCompleted
                      ? 'bg-green-500/20 border-green-500/30 text-green-400 cursor-not-allowed'
                      : 'bg-zinc-700 border-zinc-600 text-white focus:border-green-500 focus:bg-zinc-600'
                    }
                  `}
                />
              </div>

              {/* Check Button */}
              <div>
                <button
                  onClick={() => handleCheckSet(set.setNumber)}
                  disabled={set.isCompleted}
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    transition-all
                    ${set.isCompleted
                      ? 'bg-green-500 text-white cursor-not-allowed'
                      : 'bg-zinc-700 text-zinc-400 hover:bg-green-500 hover:text-white active:scale-95'
                    }
                  `}
                >
                  {set.isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="w-5 h-5 rounded border-2 border-current"></div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Set Button */}
      <button
        onClick={() => {
          // Add logic to increase targetSets if needed
        }}
        className="w-full mt-3 py-2 text-green-400 font-semibold text-sm hover:bg-zinc-800 rounded-lg transition-colors"
      >
        + Add Set
      </button>
    </div>
  );
};
