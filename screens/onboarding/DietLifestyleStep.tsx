import React from 'react';
import { OnboardingFormData, DIETARY_RESTRICTIONS } from '../../types/onboarding';

interface DietLifestyleStepProps {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: any) => void;
}

const EATING_STYLES = [
  { value: 'emotional', label: 'Emotional Eating', description: 'Eat based on feelings', icon: '😢' },
  { value: 'bored', label: 'Boredom Eating', description: 'Eat when bored', icon: '😑' },
  { value: 'unconscious', label: 'Unconscious Eating', description: 'Mindless snacking', icon: '😶' },
  { value: 'habitual', label: 'Habitual Eating', description: 'Fixed eating schedule', icon: '⏰' },
  { value: 'energy_driven', label: 'Energy-Driven', description: 'Eat when hungry', icon: '⚡' },
];

export default function DietLifestyleStep({ formData, onChange }: DietLifestyleStepProps) {
  const toggleDietaryRestriction = (restriction: string) => {
    const current = formData.dietaryRestrictions || [];
    if (current.includes(restriction)) {
      onChange('dietaryRestrictions', current.filter(r => r !== restriction));
    } else {
      if (restriction === 'None') {
        onChange('dietaryRestrictions', ['None']);
      } else {
        onChange('dietaryRestrictions', [...current.filter(r => r !== 'None'), restriction]);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Diet & Lifestyle</h2>
        <p className="text-gray-400">Help us personalize your nutrition plan</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          How would you rate your current diet quality?
        </label>
        <div className="space-y-3">
          <input
            type="range"
            min="1"
            max="5"
            value={formData.dietQuality || 3}
            onChange={(e) => onChange('dietQuality', parseInt(e.target.value))}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
          <div className="flex justify-between text-xs">
            <span className={formData.dietQuality === 1 ? 'text-red-400 font-semibold' : 'text-gray-400'}>
              1 - Very Unhealthy
            </span>
            <span className={formData.dietQuality === 2 ? 'text-orange-400 font-semibold' : 'text-gray-400'}>
              2 - Unhealthy
            </span>
            <span className={formData.dietQuality === 3 ? 'text-yellow-400 font-semibold' : 'text-gray-400'}>
              3 - Average
            </span>
            <span className={formData.dietQuality === 4 ? 'text-lime-400 font-semibold' : 'text-gray-400'}>
              4 - Healthy
            </span>
            <span className={formData.dietQuality === 5 ? 'text-green-400 font-semibold' : 'text-gray-400'}>
              5 - Very Healthy
            </span>
          </div>
          <div className="text-center mt-2">
            <span className="inline-block px-4 py-2 bg-gray-800 rounded-full text-white font-semibold">
              {formData.dietQuality === 1 && '😕 Very Unhealthy'}
              {formData.dietQuality === 2 && '😐 Unhealthy'}
              {formData.dietQuality === 3 && '😊 Average'}
              {formData.dietQuality === 4 && '😄 Healthy'}
              {formData.dietQuality === 5 && '🌟 Very Healthy'}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Dietary Restrictions (select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_RESTRICTIONS.map((restriction) => (
            <button
              key={restriction}
              type="button"
              onClick={() => toggleDietaryRestriction(restriction)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${(formData.dietaryRestrictions || []).includes(restriction)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              {restriction}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          What's your eating style?
        </label>
        <div className="space-y-2">
          {EATING_STYLES.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => onChange('eatingStyle', style.value)}
              className={`
                w-full p-3 rounded-xl transition-all duration-200 text-left
                ${formData.eatingStyle === style.value
                  ? 'bg-green-500 text-white ring-2 ring-green-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{style.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold">{style.label}</div>
                  <div className={`text-sm ${formData.eatingStyle === style.value ? 'text-white/80' : 'text-gray-400'}`}>
                    {style.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Average hours of sleep per night
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 4, label: 'Under 5h', icon: '😴' },
            { value: 5.5, label: '5-6h', icon: '😪' },
            { value: 6.5, label: '6-7h', icon: '😌' },
            { value: 7.5, label: '7-8h', icon: '😊' },
            { value: 8.5, label: 'Over 8h', icon: '😴' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('averageSleepHours', option.value)}
              className={`
                p-4 rounded-xl transition-all duration-200
                ${formData.averageSleepHours === option.value
                  ? 'bg-green-500 text-white ring-2 ring-green-400 scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <div className="text-2xl mb-1">{option.icon}</div>
              <div className="font-semibold text-sm">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-4 mt-6">
        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
          🎉 Almost done!
        </h3>
        <p className="text-sm text-gray-300">
          You're one step away from your personalized fitness plan. Click Next to see your results!
        </p>
      </div>
    </div>
  );
}
