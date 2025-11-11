import React from 'react';
import { OnboardingFormData, FOCUS_AREAS, MEDICAL_CONDITIONS } from '../../types/onboarding';

interface FitnessGoalsStepProps {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: any) => void;
}

const GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Lose Weight', icon: '📉' },
  { value: 'gain_weight', label: 'Gain Weight', icon: '📈' },
  { value: 'build_muscle', label: 'Build Muscle', icon: '💪' },
  { value: 'build_endurance', label: 'Build Endurance', icon: '🏃' },
  { value: 'maintain_weight', label: 'Maintain Weight', icon: '⚖️' },
  { value: 'general_fitness', label: 'General Fitness', icon: '✨' },
];

export default function FitnessGoalsStep({ formData, onChange }: FitnessGoalsStepProps) {
  const toggleFocusArea = (area: string) => {
    const current = formData.focusAreas || [];
    if (current.includes(area)) {
      onChange('focusAreas', current.filter(a => a !== area));
    } else {
      onChange('focusAreas', [...current, area]);
    }
  };

  const toggleMedicalCondition = (condition: string) => {
    const current = formData.medicalConditions || [];
    if (current.includes(condition)) {
      onChange('medicalConditions', current.filter(c => c !== condition));
    } else {
      if (condition === 'None') {
        onChange('medicalConditions', ['None']);
      } else {
        onChange('medicalConditions', [...current.filter(c => c !== 'None'), condition]);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">What's your main goal?</h2>
        <p className="text-gray-400">We'll create a personalized plan to help you achieve it</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GOAL_OPTIONS.map((goal) => (
          <button
            key={goal.value}
            type="button"
            onClick={() => onChange('mainGoal', goal.value)}
            className={`
              p-4 rounded-xl transition-all duration-200 text-left
              ${formData.mainGoal === goal.value
                ? 'bg-green-500 text-white ring-2 ring-green-400 scale-105'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            <div className="text-2xl mb-1">{goal.icon}</div>
            <div className="font-semibold text-sm">{goal.label}</div>
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Target Weight (lbs) - Optional
        </label>
        <input
          type="number"
          placeholder="Your goal weight"
          step="0.1"
          value={formData.targetWeightLbs || ''}
          onChange={(e) => onChange('targetWeightLbs', parseFloat(e.target.value) || undefined)}
          className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700
            focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          How many days per week can you work out?
        </label>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => onChange('activeDaysPerWeek', days)}
              className={`
                py-3 rounded-xl font-bold transition-all duration-200
                ${formData.activeDaysPerWeek === days
                  ? 'bg-green-500 text-white scale-110'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              {days}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Focus Areas (select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => toggleFocusArea(area)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${(formData.focusAreas || []).includes(area)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Timeline: How many months to reach your goal?
        </label>
        <input
          type="range"
          min="1"
          max="24"
          value={formData.timelineMonths || 6}
          onChange={(e) => onChange('timelineMonths', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
        <div className="flex justify-between text-sm text-gray-400 mt-1">
          <span>1 month</span>
          <span className="text-green-400 font-semibold">{formData.timelineMonths || 6} months</span>
          <span>24 months</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Do you have any injuries?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange('hasInjuries', false)}
            className={`
              px-4 py-3 rounded-xl font-semibold transition-all duration-200
              ${!formData.hasInjuries
                ? 'bg-green-500 text-white ring-2 ring-green-400'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => onChange('hasInjuries', true)}
            className={`
              px-4 py-3 rounded-xl font-semibold transition-all duration-200
              ${formData.hasInjuries
                ? 'bg-green-500 text-white ring-2 ring-green-400'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            Yes
          </button>
        </div>
        {formData.hasInjuries && (
          <textarea
            placeholder="Please describe your injuries..."
            value={formData.injuryDetails || ''}
            onChange={(e) => onChange('injuryDetails', e.target.value)}
            rows={3}
            className="w-full mt-3 px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700
              focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Medical Conditions (select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {MEDICAL_CONDITIONS.map((condition) => (
            <button
              key={condition}
              type="button"
              onClick={() => toggleMedicalCondition(condition)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${(formData.medicalConditions || []).includes(condition)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              {condition}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
