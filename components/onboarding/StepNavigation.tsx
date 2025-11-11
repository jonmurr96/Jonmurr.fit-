import React from 'react';

interface StepNavigationProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  showBack?: boolean;
}

export default function StepNavigation({ 
  onBack, 
  onNext, 
  nextLabel = 'Next',
  isNextDisabled = false,
  showBack = true 
}: StepNavigationProps) {
  return (
    <div className="flex gap-3 mt-8">
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 rounded-xl font-semibold
            bg-gray-700 text-white hover:bg-gray-600
            transition-all duration-200"
        >
          Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled}
        className={`
          flex-1 px-6 py-3 rounded-xl font-semibold
          transition-all duration-200
          ${isNextDisabled 
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:shadow-green-500/50 hover:scale-105'
          }
        `}
      >
        {nextLabel}
      </button>
    </div>
  );
}
