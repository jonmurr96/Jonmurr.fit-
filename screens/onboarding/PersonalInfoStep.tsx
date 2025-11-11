import React from 'react';
import { OnboardingFormData } from '../../types/onboarding';

interface PersonalInfoStepProps {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: any) => void;
}

export default function PersonalInfoStep({ formData, onChange }: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Let's start with the basics</h2>
        <p className="text-gray-400">This helps us calculate your personalized nutrition plan</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Date of Birth
        </label>
        <input
          type="date"
          value={formData.dateOfBirth || ''}
          onChange={(e) => onChange('dateOfBirth', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700
            focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Gender
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['male', 'female', 'other'].map((gender) => (
            <button
              key={gender}
              type="button"
              onClick={() => onChange('gender', gender)}
              className={`
                px-4 py-3 rounded-xl font-semibold capitalize transition-all duration-200
                ${formData.gender === gender
                  ? 'bg-green-500 text-white ring-2 ring-green-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              {gender}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Height
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              placeholder="Feet"
              min="3"
              max="8"
              value={formData.heightFt || ''}
              onChange={(e) => onChange('heightFt', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700
                focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <span className="text-xs text-gray-400 mt-1 block">Feet</span>
          </div>
          <div>
            <input
              type="number"
              placeholder="Inches"
              min="0"
              max="11"
              value={formData.heightIn || ''}
              onChange={(e) => onChange('heightIn', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700
                focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <span className="text-xs text-gray-400 mt-1 block">Inches</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Current Weight (lbs)
        </label>
        <input
          type="number"
          placeholder="150"
          step="0.1"
          min="50"
          max="500"
          value={formData.weightLbs || ''}
          onChange={(e) => onChange('weightLbs', parseFloat(e.target.value) || 0)}
          className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700
            focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        />
      </div>
    </div>
  );
}
