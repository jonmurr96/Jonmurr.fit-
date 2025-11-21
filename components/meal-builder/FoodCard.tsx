import React, { useState } from 'react';
import { FoodItem as CatalogFoodItem } from '../../services/database/foodCatalogService';
import { SimplifiedFood } from '../../services/usdaFoodService';
import { ServingSizeSelector } from './ServingSizeSelector';
import { ServingSize, calculateMacrosForServing, getRecommendedUnits } from '../../utils/unitConversion';

interface FoodCardProps {
  food: CatalogFoodItem | SimplifiedFood;
  isFavorite: boolean;
  isBlacklisted: boolean;
  isUSDA: boolean;
  onAdd: (food: CatalogFoodItem | SimplifiedFood, servingSize: ServingSize) => void;
  onToggleFavorite?: (foodId: number) => void;
  onToggleHide?: (foodId: number, isCurrentlyHidden: boolean) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  food,
  isFavorite,
  isBlacklisted,
  isUSDA,
  onAdd,
  onToggleFavorite,
  onToggleHide,
}) => {
  // Base macros (per 100g from database)
  const baseProtein = ('protein_g' in food) ? food.protein_g : food.protein;
  const baseCarbs = ('carbs_g' in food) ? food.carbs_g : food.carbs;
  const baseFat = ('fat_g' in food) ? food.fat_g : food.fat;
  const baseCalories = food.calories;
  
  // Get recommended unit based on food type
  const recommendedUnits = getRecommendedUnits(food.name);
  
  // Serving size state (default to recommended unit with 100 amount)
  const [servingSize, setServingSize] = useState<ServingSize>({
    amount: 100,
    unit: recommendedUnits.primary,
  });
  
  const [showServingSelector, setShowServingSelector] = useState(false);
  
  // Calculate macros for current serving size
  const displayMacros = calculateMacrosForServing(
    { calories: baseCalories, protein: baseProtein, carbs: baseCarbs, fat: baseFat },
    servingSize,
    food.name
  );
  
  const handleAddFood = () => {
    onAdd(food, servingSize);
    setShowServingSelector(false); // Close selector after adding
  };

  return (
    <div className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-750 transition-all border border-zinc-700 hover:border-zinc-600">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-bold text-white text-sm break-words">{food.name}</h4>
            {isFavorite && <span className="text-yellow-400 text-sm flex-shrink-0">⭐</span>}
            {isUSDA && (
              <span className="text-xs bg-blue-600 px-2 py-0.5 rounded text-white flex-shrink-0">
                USDA
              </span>
            )}
          </div>
          <button
            onClick={() => setShowServingSelector(!showServingSelector)}
            className="text-xs text-zinc-400 hover:text-green-400 transition-colors underline"
          >
            {servingSize.amount % 1 === 0 ? servingSize.amount : servingSize.amount.toFixed(1)}{servingSize.unit} serving
          </button>
        </div>
        
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-white">{displayMacros.calories}</p>
          <p className="text-xs text-zinc-500">kcal</p>
        </div>
      </div>

      {/* Serving Size Selector (collapsible) */}
      {showServingSelector && (
        <div className="mb-3 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
          <ServingSizeSelector
            value={servingSize}
            onChange={setServingSize}
            foodDescription={food.name}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-red-600/20 rounded px-2 py-1 text-center">
          <p className="text-red-400 font-semibold">{displayMacros.protein}g</p>
          <p className="text-zinc-500">P</p>
        </div>
        <div className="bg-blue-600/20 rounded px-2 py-1 text-center">
          <p className="text-blue-400 font-semibold">{displayMacros.carbs}g</p>
          <p className="text-zinc-500">C</p>
        </div>
        <div className="bg-yellow-600/20 rounded px-2 py-1 text-center">
          <p className="text-yellow-400 font-semibold">{displayMacros.fat}g</p>
          <p className="text-zinc-500">F</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleAddFood}
          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          + Add
        </button>
        
        {!isUSDA && onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(food.id)}
            className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? '⭐' : '☆'}
          </button>
        )}
        
        {!isUSDA && onToggleHide && (
          <button
            onClick={() => onToggleHide(food.id, isBlacklisted)}
            className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
            title={isBlacklisted ? "Unhide from quick picks" : "Hide from quick picks"}
          >
            {isBlacklisted ? '👁️‍🗨️' : '👁️'}
          </button>
        )}
      </div>
    </div>
  );
};
