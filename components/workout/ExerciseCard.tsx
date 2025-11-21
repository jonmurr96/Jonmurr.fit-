import React, { useState, useEffect } from 'react';
import { PreviousSetData, WorkoutSet } from '../../services/workoutSessionService';
import { RestTimer } from './RestTimer';

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
  weightUnit: 'kg' | 'lbs';
  onWeightUnitToggle: () => void;
  onSetComplete: (setNumber: number, weightKg: number, reps: number) => Promise<void>;
  onSetUpdate: (setNumber: number, weightKg: number | null, reps: number | null) => void;
  defaultRestSeconds?: number;
}

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

const convertWeight = (weightKg: number | null, toUnit: 'kg' | 'lbs'): number | null => {
  if (weightKg === null) return null;
  if (toUnit === 'lbs') {
    return Math.round(weightKg * KG_TO_LBS * 10) / 10; // Round to 1 decimal
  }
  return Math.round(weightKg * 100) / 100; // Round kg to 2 decimals
};

const convertToKg = (weight: number, fromUnit: 'kg' | 'lbs'): number => {
  if (fromUnit === 'lbs') {
    return Math.round(weight * LBS_TO_KG * 100) / 100; // Round to 2 decimals
  }
  return weight;
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exerciseName,
  targetSets,
  currentSets,
  previousSets,
  weightUnit,
  onWeightUnitToggle,
  onSetComplete,
  onSetUpdate,
  defaultRestSeconds = 120,
}) => {
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [editingSet, setEditingSet] = useState<number | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(defaultRestSeconds);
  const [restTimerKey, setRestTimerKey] = useState(0);

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

  useEffect(() => {
    const savedRest = localStorage.getItem(`restTimer_${exerciseName}`);
    if (savedRest) {
      setRestDuration(parseInt(savedRest, 10));
    } else {
      setRestDuration(defaultRestSeconds);
    }
  }, [exerciseName, defaultRestSeconds]);

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
      // Weight is already in kg (stored internally), pass directly
      await onSetComplete(setNumber, set.weightKg, set.reps);
      
      // Update local state
      setSets(prev =>
        prev.map(s =>
          s.setNumber === setNumber ? { ...s, isCompleted: true } : s
        )
      );

      // Auto-start rest timer
      setShowRestTimer(true);
      setRestTimerKey(prev => prev + 1);
    } catch (error) {
      console.error('Error completing set:', error);
      alert('Failed to save set');
    }
  };

  const handleRestDurationChange = (seconds: number) => {
    setRestDuration(seconds);
    localStorage.setItem(`restTimer_${exerciseName}`, seconds.toString());
  };

  const handleRestComplete = () => {
    // Optional: Add sound/notification here
    console.log('Rest period complete!');
  };

  const handleWeightChange = (setNumber: number, value: string) => {
    if (value === '') {
      setSets(prev => {
        const updatedSets = prev.map(s =>
          s.setNumber === setNumber ? { ...s, weightKg: null } : s
        );
        const currentReps = updatedSets.find(s => s.setNumber === setNumber)?.reps ?? null;
        onSetUpdate(setNumber, null, currentReps);
        return updatedSets;
      });
      return;
    }

    const weightInDisplayUnit = parseFloat(value);
    const weightKg = convertToKg(weightInDisplayUnit, weightUnit);
    
    setSets(prev => {
      const updatedSets = prev.map(s =>
        s.setNumber === setNumber ? { ...s, weightKg } : s
      );
      // Get fresh reps value from updated state
      const currentReps = updatedSets.find(s => s.setNumber === setNumber)?.reps ?? null;
      onSetUpdate(setNumber, weightKg, currentReps);
      return updatedSets;
    });
  };

  const handleRepsChange = (setNumber: number, value: string) => {
    const reps = value === '' ? null : parseInt(value, 10);
    setSets(prev => {
      const updatedSets = prev.map(s =>
        s.setNumber === setNumber ? { ...s, reps } : s
      );
      // Get fresh weight value from updated state
      const currentWeight = updatedSets.find(s => s.setNumber === setNumber)?.weightKg ?? null;
      onSetUpdate(setNumber, currentWeight, reps);
      return updatedSets;
    });
  };

  return (
    <div className="bg-zinc-900 rounded-xl p-3 mb-3">
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
        <div className="grid grid-cols-[40px_70px_1fr_70px_44px] gap-1 text-xs font-semibold text-zinc-500 px-2 items-center">
          <div>Set</div>
          <div className="text-center">Prev</div>
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={onWeightUnitToggle}
              className="flex items-center gap-0.5 px-1 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
              title="Toggle weight unit"
            >
              <span className={`text-[9px] font-bold transition-colors ${weightUnit === 'kg' ? 'text-green-500' : 'text-zinc-600'}`}>
                kg
              </span>
              <div className="w-4 h-2.5 bg-zinc-700 rounded-full p-[2px] relative">
                <div
                  className={`w-1.5 h-1.5 bg-green-500 rounded-full transition-transform ${
                    weightUnit === 'lbs' ? 'translate-x-1.5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className={`text-[9px] font-bold transition-colors ${weightUnit === 'lbs' ? 'text-green-500' : 'text-zinc-600'}`}>
                lb
              </span>
            </button>
          </div>
          <div className="text-center">Reps</div>
          <div></div>
        </div>

        {/* Set Rows */}
        {sets.map((set) => {
          const previous = getPreviousSet(set.setNumber);
          const isEditing = editingSet === set.setNumber;
          const displayWeight = convertWeight(set.weightKg, weightUnit);
          const previousDisplayWeight = previous ? convertWeight(previous.weight_kg, weightUnit) : null;

          return (
            <div
              key={set.setNumber}
              className={`
                grid grid-cols-[40px_70px_1fr_70px_44px] gap-1 items-center
                p-2 rounded-lg transition-colors
                ${set.isCompleted ? 'bg-green-500/10' : 'bg-zinc-800'}
              `}
            >
              {/* Set Number */}
              <div className="text-center font-bold text-white">
                {set.setNumber}
              </div>

              {/* Previous */}
              <div className="text-center text-xs text-zinc-400">
                {previousDisplayWeight !== null ? (
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-white">{previousDisplayWeight}</span>
                    <span className="text-[10px]">×{previous!.reps}</span>
                  </div>
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </div>

              {/* Weight Input */}
              <div>
                <input
                  type="number"
                  inputMode="decimal"
                  step={weightUnit === 'lbs' ? '5' : '2.5'}
                  value={displayWeight ?? ''}
                  onChange={(e) => handleWeightChange(set.setNumber, e.target.value)}
                  onFocus={() => setEditingSet(set.setNumber)}
                  onBlur={() => setEditingSet(null)}
                  disabled={set.isCompleted}
                  placeholder="0"
                  className={`
                    w-full px-2 py-2.5 rounded-lg text-center font-semibold text-sm
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
                    w-full px-2 py-2.5 rounded-lg text-center font-semibold text-sm
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

      {/* Rest Timer */}
      {showRestTimer && (
        <div className="mt-3">
          <RestTimer
            key={restTimerKey}
            defaultDuration={restDuration}
            onComplete={handleRestComplete}
            autoStart={true}
            onDurationChange={handleRestDurationChange}
          />
        </div>
      )}

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
