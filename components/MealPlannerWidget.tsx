
import React from 'react';
import { CarrotIcon } from './Icons';

interface MealPlannerWidgetProps {
  onClick: () => void;
}

const MealPlannerWidget: React.FC<MealPlannerWidgetProps> = ({ onClick }) => {
  return (
    <div className="bg-zinc-900 text-white p-4 mt-6 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-4">
        <div className="bg-zinc-800 p-3 rounded-lg">
          <CarrotIcon className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">AI Meal Planner</h2>
          <p className="text-sm text-zinc-400">
            Let AI build a custom meal plan based on your goals.
          </p>
        </div>
      </div>
      <button 
        onClick={onClick}
        className="mt-4 w-full bg-green-500 hover:bg-green-600 transition-all px-4 py-2 rounded-md text-sm font-bold text-black"
      >
        Create My Meal Plan
      </button>
    </div>
  );
};

export default MealPlannerWidget;
