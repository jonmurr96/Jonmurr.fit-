import React from 'react';
import { MealPlanItem } from '../../types';

interface MealSlot {
  name: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack 1' | 'Snack 2';
  items: MealPlanItem[];
}

interface PlanPreviewProps {
  meals: MealSlot[];
  onRemoveFood: (mealIndex: number, foodIndex: number) => void;
}

export const PlanPreview: React.FC<PlanPreviewProps> = ({
  meals,
  onRemoveFood,
}) => {
  const totalItems = meals.reduce((sum, meal) => sum + meal.items.length, 0);

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Your Plan is Empty</h3>
        <p className="text-sm text-zinc-400 text-center max-w-xs">
          Browse foods and tap "Add" to start building your custom meal plan
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {meals.map((meal, mealIndex) => {
        if (meal.items.length === 0) return null;
        
        const mealTotals = meal.items.reduce((acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        return (
          <div key={mealIndex} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{meal.name}</h3>
              <div className="text-sm text-zinc-400">
                {Math.round(mealTotals.calories)} kcal
              </div>
            </div>

            <div className="space-y-2">
              {meal.items.map((item, foodIndex) => (
                <div
                  key={foodIndex}
                  className="bg-zinc-800 rounded-lg p-3 border border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm mb-1 break-words">
                        {item.food}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {item.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveFood(mealIndex, foodIndex)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                      title="Remove"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-zinc-900 rounded px-2 py-1 text-center">
                      <p className="text-white font-semibold">{Math.round(item.calories)}</p>
                      <p className="text-zinc-500">kcal</p>
                    </div>
                    <div className="bg-red-600/20 rounded px-2 py-1 text-center">
                      <p className="text-red-400 font-semibold">{Math.round(item.protein)}g</p>
                      <p className="text-zinc-500">P</p>
                    </div>
                    <div className="bg-blue-600/20 rounded px-2 py-1 text-center">
                      <p className="text-blue-400 font-semibold">{Math.round(item.carbs)}g</p>
                      <p className="text-zinc-500">C</p>
                    </div>
                    <div className="bg-yellow-600/20 rounded px-2 py-1 text-center">
                      <p className="text-yellow-400 font-semibold">{Math.round(item.fat)}g</p>
                      <p className="text-zinc-500">F</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
