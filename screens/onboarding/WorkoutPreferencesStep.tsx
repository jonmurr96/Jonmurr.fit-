import React from 'react';
import { OnboardingFormData } from '../../types/onboarding';

interface WorkoutPreferencesStepProps {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: any) => void;
}

const EQUIPMENT_OPTIONS = [
  { value: 'bodyweight', label: 'Bodyweight Only', icon: '🤸', description: 'No equipment needed' },
  { value: 'dumbbells', label: 'Dumbbells', icon: '🏋️', description: 'Basic home equipment' },
  { value: 'full_gym', label: 'Full Gym Access', icon: '🏃', description: 'All equipment available' },
];

const DURATION_OPTIONS = [
  { value: '20-30', label: '20-30 min', icon: '⚡' },
  { value: '30-60', label: '30-60 min', icon: '🔥' },
  { value: '60-90', label: '60-90 min', icon: '💪' },
  { value: '90+', label: '90+ min', icon: '🦾' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'hard_to_gain', label: 'Hard to Gain Weight', description: 'Fast metabolism, struggle to build mass' },
  { value: 'hard_to_lose', label: 'Hard to Lose Weight', description: 'Want to focus on fat loss' },
  { value: 'build_muscle_effectively', label: 'Build Muscle Effectively', description: 'Want optimal muscle growth' },
];

const ROUTINE_TYPES = [
  { value: 'fun_based', label: 'Fun-Based', description: 'Enjoyable, varied workouts', icon: '😄' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of fun and progress', icon: '⚖️' },
  { value: 'progressive_overload', label: 'Progressive Overload', description: 'Maximum results (recommended)', icon: '📈' },
];

export default function WorkoutPreferencesStep({ formData, onChange }: WorkoutPreferencesStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Workout Preferences</h2>
        <p className="text-gray-400">Let's design the perfect workout routine for you</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          What equipment do you have access to?
        </label>
        <div className="space-y-3">
          {EQUIPMENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('equipmentAccess', option.value)}
              className={`
                w-full p-4 rounded-xl transition-all duration-200 text-left
                ${formData.equipmentAccess === option.value
                  ? 'bg-green-500 text-white ring-2 ring-green-400 scale-[1.02]'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{option.icon}</div>
                <div className="flex-1">
                  <div className="font-bold">{option.label}</div>
                  <div className={`text-sm ${formData.equipmentAccess === option.value ? 'text-white/80' : 'text-gray-400'}`}>
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          How long can you work out per session?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('workoutDuration', option.value)}
              className={`
                p-4 rounded-xl transition-all duration-200
                ${formData.workoutDuration === option.value
                  ? 'bg-green-500 text-white ring-2 ring-green-400 scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <div className="text-2xl mb-1">{option.icon}</div>
              <div className="font-semibold">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          What's your biggest challenge with weight/muscle?
        </label>
        <div className="space-y-2">
          {DIFFICULTY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('weightChangeDifficulty', option.value)}
              className={`
                w-full p-3 rounded-xl transition-all duration-200 text-left
                ${formData.weightChangeDifficulty === option.value
                  ? 'bg-green-500 text-white ring-2 ring-green-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <div className="font-semibold">{option.label}</div>
              <div className={`text-sm ${formData.weightChangeDifficulty === option.value ? 'text-white/80' : 'text-gray-400'}`}>
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          What type of routine do you prefer?
        </label>
        <div className="space-y-3">
          {ROUTINE_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('routineType', option.value)}
              className={`
                w-full p-4 rounded-xl transition-all duration-200 text-left
                ${formData.routineType === option.value
                  ? 'bg-green-500 text-white ring-2 ring-green-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{option.icon}</div>
                <div className="flex-1">
                  <div className="font-bold">{option.label}</div>
                  <div className={`text-sm ${formData.routineType === option.value ? 'text-white/80' : 'text-gray-400'}`}>
                    {option.description}
                  </div>
                </div>
                {option.value === 'progressive_overload' && (
                  <span className="px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
                    BEST
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
