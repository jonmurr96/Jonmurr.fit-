import React from 'react';
import { OnboardingFormData } from '../../types/onboarding';

interface BodyTypeStepProps {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: any) => void;
}

const SOMATOTYPES = [
  {
    value: 'ectomorph',
    label: 'Ectomorph',
    description: 'Lean, difficulty gaining weight/muscle',
    icon: '🥖'
  },
  {
    value: 'mesomorph',
    label: 'Mesomorph',
    description: 'Athletic, builds muscle easily',
    icon: '💪'
  },
  {
    value: 'endomorph',
    label: 'Endomorph',
    description: 'Stockier build, gains weight easily',
    icon: '🏋️'
  },
];

export default function BodyTypeStep({ formData, onChange }: BodyTypeStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">What's your body type?</h2>
        <p className="text-gray-400">This helps us optimize your nutrition and training</p>
      </div>

      <div className="space-y-3">
        {SOMATOTYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange('somatotype', type.value)}
            className={`
              w-full p-4 rounded-xl transition-all duration-200 text-left
              ${formData.somatotype === type.value
                ? 'bg-green-500 text-white ring-2 ring-green-400 scale-[1.02]'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{type.icon}</div>
              <div className="flex-1">
                <div className="font-bold text-lg">{type.label}</div>
                <div className={`text-sm ${formData.somatotype === type.value ? 'text-white/80' : 'text-gray-400'}`}>
                  {type.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Fat Distribution Pattern (Optional)
        </label>
        <p className="text-xs text-gray-400 mb-3">
          Where do you tend to store fat? (e.g., "Upper body", "Lower body", "Evenly distributed")
        </p>
        <input
          type="text"
          placeholder="e.g., Upper body (android) or Lower body (gynoid)"
          value={formData.fatDistribution || ''}
          onChange={(e) => onChange('fatDistribution', e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700
            focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        />
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mt-6">
        <h3 className="font-semibold text-white mb-2">💡 Not sure?</h3>
        <p className="text-sm text-gray-400">
          Don't worry! These are just guidelines. You can skip this step and we'll still create a personalized plan based on your other inputs.
        </p>
      </div>
    </div>
  );
}
