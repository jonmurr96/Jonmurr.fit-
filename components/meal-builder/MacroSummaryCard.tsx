import React from 'react';

interface MacroSummaryCardProps {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export const MacroSummaryCard: React.FC<MacroSummaryCardProps> = ({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
}) => {
  return (
    <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-800 rounded-lg p-3">
          <p className="text-xs text-zinc-400 mb-1">Calories</p>
          <p className="text-2xl font-bold text-white">{Math.round(totalCalories)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-700/30 rounded-lg p-3">
          <p className="text-xs text-red-400 mb-1">Protein</p>
          <p className="text-2xl font-bold text-red-300">{Math.round(totalProtein)}g</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-700/30 rounded-lg p-3">
          <p className="text-xs text-blue-400 mb-1">Carbs</p>
          <p className="text-2xl font-bold text-blue-300">{Math.round(totalCarbs)}g</p>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-700/30 rounded-lg p-3">
          <p className="text-xs text-yellow-400 mb-1">Fat</p>
          <p className="text-2xl font-bold text-yellow-300">{Math.round(totalFat)}g</p>
        </div>
      </div>
    </div>
  );
};
