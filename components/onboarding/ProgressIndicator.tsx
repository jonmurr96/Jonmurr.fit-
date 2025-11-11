import React from 'react';
import { OnboardingStep } from '../../types/onboarding';

interface ProgressIndicatorProps {
  currentStep: OnboardingStep;
}

const STEPS: { id: OnboardingStep; label: string; number: number }[] = [
  { id: 'personal_info', label: 'Personal Info', number: 1 },
  { id: 'fitness_goals', label: 'Fitness Goals', number: 2 },
  { id: 'body_type', label: 'Body Type', number: 3 },
  { id: 'workout_preferences', label: 'Workout Prefs', number: 4 },
  { id: 'diet_lifestyle', label: 'Diet & Lifestyle', number: 5 },
];

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentIndex = STEPS.findIndex(step => step.id === currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        {STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                transition-all duration-300
                ${isActive ? 'bg-green-500 text-white scale-110' : ''}
                ${isCompleted ? 'bg-green-500 text-white' : ''}
                ${!isActive && !isCompleted ? 'bg-gray-700 text-gray-400' : ''}
              `}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span className={`
                text-xs mt-2 text-center hidden sm:block
                ${isActive ? 'text-green-400 font-semibold' : 'text-gray-400'}
              `}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-green-500 to-green-400 h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-center text-sm text-gray-400 mt-2">
        Step {currentIndex + 1} of {STEPS.length}
      </p>
    </div>
  );
}
