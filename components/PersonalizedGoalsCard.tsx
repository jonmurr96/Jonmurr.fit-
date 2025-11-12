import React from 'react';
import { useOnboardingData } from '../hooks/useOnboardingData';

export default function PersonalizedGoalsCard() {
  const { data, loading, error } = useOnboardingData();

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null; // Don't show the card if there's no data
  }

  return (
    <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎯</span>
        <h3 className="text-lg font-bold text-white">Your Personalized Goals</h3>
      </div>

      <div className="space-y-4">
        {/* Daily Calories */}
        {data.dailyCalories && (
          <div className="flex items-center justify-between bg-black/20 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="text-white font-medium">Daily Calories</span>
            </div>
            <span className="text-green-400 font-bold">{data.dailyCalories} cal</span>
          </div>
        )}

        {/* Macros */}
        {data.macros && (
          <div className="bg-black/20 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-gray-300 text-sm">Protein</span>
              </div>
              <span className="text-white font-semibold">{data.macros.protein}g</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-gray-300 text-sm">Carbs</span>
              </div>
              <span className="text-white font-semibold">{data.macros.carbs}g</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-gray-300 text-sm">Fats</span>
              </div>
              <span className="text-white font-semibold">{data.macros.fats}g</span>
            </div>
          </div>
        )}

        {/* Water Goal */}
        {data.waterGoal && (
          <div className="flex items-center justify-between bg-black/20 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">💧</span>
              <span className="text-white font-medium">Daily Water</span>
            </div>
            <span className="text-blue-400 font-bold">{data.waterGoal} oz</span>
          </div>
        )}

        {/* Goal */}
        {data.mainGoal && (
          <div className="flex items-center justify-between bg-black/20 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <span className="text-white font-medium">Main Goal</span>
            </div>
            <span className="text-green-400 font-bold capitalize">
              {data.mainGoal.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* Weight Progress */}
        {data.currentWeight && data.targetWeight && (
          <div className="flex items-center justify-between bg-black/20 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <span className="text-white font-medium">Weight Goal</span>
            </div>
            <span className="text-white font-semibold">
              {data.currentWeight} → {data.targetWeight} lbs
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        Based on your onboarding questionnaire
      </div>
    </div>
  );
}
