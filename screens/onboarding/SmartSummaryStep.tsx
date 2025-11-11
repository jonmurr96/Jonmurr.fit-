import React, { useState } from 'react';
import { OnboardingFormData } from '../../types/onboarding';

interface SmartSummaryStepProps {
  formData: OnboardingFormData;
  onConfirm: () => void;
  onBack: () => void;
}

export default function SmartSummaryStep({ formData, onConfirm, onBack }: SmartSummaryStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleConfirm = async () => {
    setIsGenerating(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error confirming onboarding:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-3xl font-bold text-white mb-2">Your Personalized Plan is Ready!</h2>
        <p className="text-gray-400">Here's what we've calculated based on your inputs</p>
      </div>

      {/* Calorie & Macro Card */}
      <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          Daily Nutrition Targets
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{formData.dailyCalories}</div>
            <div className="text-sm text-gray-400">Calories/day</div>
          </div>
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{formData.waterIntakeOz}</div>
            <div className="text-sm text-gray-400">oz Water/day</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between bg-black/30 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-white font-medium">Protein</span>
            </div>
            <span className="text-white font-bold">{formData.proteinG}g</span>
          </div>
          
          <div className="flex items-center justify-between bg-black/30 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-white font-medium">Carbs</span>
            </div>
            <span className="text-white font-bold">{formData.carbsG}g</span>
          </div>
          
          <div className="flex items-center justify-between bg-black/30 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-white font-medium">Fats</span>
            </div>
            <span className="text-white font-bold">{formData.fatsG}g</span>
          </div>
        </div>
      </div>

      {/* Metabolism Info */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h4 className="font-semibold text-white mb-3">📊 Your Metabolism</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Basal Metabolic Rate (BMR)</span>
            <span className="text-white font-medium">{formData.bmr} cal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Daily Energy Expenditure (TDEE)</span>
            <span className="text-white font-medium">{formData.tdee} cal</span>
          </div>
        </div>
      </div>

      {/* Workout Plan Preview */}
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-2xl">💪</span>
          Your Workout Plan
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-black/30 rounded-xl p-3">
            <span className="text-gray-300">Workout Days</span>
            <span className="text-white font-bold">{formData.activeDaysPerWeek}x per week</span>
          </div>
          
          <div className="flex items-center justify-between bg-black/30 rounded-xl p-3">
            <span className="text-gray-300">Session Duration</span>
            <span className="text-white font-bold">{formData.workoutDuration} min</span>
          </div>
          
          <div className="flex items-center justify-between bg-black/30 rounded-xl p-3">
            <span className="text-gray-300">Equipment</span>
            <span className="text-white font-bold capitalize">{formData.equipmentAccess?.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
          <p className="text-xs text-yellow-200 flex items-start gap-2">
            <span>⚡</span>
            <span>We'll generate a personalized 4-week workout plan tailored to your goals and equipment!</span>
          </p>
        </div>
      </div>

      {/* Goal Summary */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h4 className="font-semibold text-white mb-3">🎯 Your Goal</h4>
        <p className="text-gray-300 capitalize">
          {formData.mainGoal?.replace('_', ' ')} 
          {formData.targetWeightLbs && (
            <span className="text-green-400 font-medium"> → Target: {formData.targetWeightLbs} lbs</span>
          )}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Timeline: {formData.timelineMonths} months
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <button
          onClick={handleConfirm}
          disabled={isGenerating}
          className={`
            w-full py-4 rounded-xl font-bold text-lg
            transition-all duration-300
            ${isGenerating
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105'
            }
          `}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating Your Plan...
            </span>
          ) : (
            '🚀 Launch My Fitness Journey'
          )}
        </button>
        
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="w-full py-3 rounded-xl font-semibold
            bg-gray-700 text-white hover:bg-gray-600
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Make Changes
        </button>
      </div>

      {/* Tips */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h4 className="font-semibold text-blue-300 mb-2">💡 What's Next?</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>We'll create your personalized 4-week workout program</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Your macro targets will be set automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Start tracking your meals, workouts, and progress</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Earn XP and unlock achievements as you progress</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
