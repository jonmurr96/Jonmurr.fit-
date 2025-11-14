import React, { useState, useEffect } from 'react';
import { FoodItem } from '../services/database/foodCatalogService';
import { MealPlanItem } from '../types';
import { searchUSDAFoods } from '../services/foodSearchWrapper';
import { convertSimplifiedToFoodItem, SimplifiedFood } from '../services/usdaFoodService';

interface FoodSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFood: MealPlanItem;
  category: 'protein' | 'carbs' | 'fats';
  onSwap: (newFood: FoodItem) => void;
  foods: FoodItem[];
  favorites?: number[];
  blacklisted?: number[];
  onToggleFavorite?: (foodId: number) => void;
}

const FoodSwapModal: React.FC<FoodSwapModalProps> = ({
  isOpen,
  onClose,
  currentFood,
  category,
  onSwap,
  foods,
  favorites = [],
  blacklisted = [],
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [usdaFoods, setUsdaFoods] = useState<SimplifiedFood[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showQuickPicks, setShowQuickPicks] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedFood(null);
      setFilterTags([]);
      setUsdaFoods([]);
      setShowQuickPicks(true);
    }
  }, [isOpen]);

  // Search USDA when user types
  useEffect(() => {
    if (!isOpen) return;
    
    const searchUSDA = async () => {
      if (searchQuery.trim().length < 2) {
        setUsdaFoods([]);
        setShowQuickPicks(true);
        return;
      }

      setIsSearching(true);
      setShowQuickPicks(false);
      
      try {
        const results = await searchUSDAFoods(searchQuery, 50);
        const filtered = results.filter(food => food.category === category);
        setUsdaFoods(filtered);
        console.log('🔍 Food swap search results:', filtered.length, 'foods');
      } catch (error) {
        console.error('Error searching foods for swaps:', error);
        setUsdaFoods([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUSDA, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, category, isOpen]);

  if (!isOpen) return null;

  const allTags: string[] = Array.from(new Set(foods.flatMap(food => food.tags || [])));

  if (foods.length === 0) {
    console.warn('⚠️ FoodSwapModal received empty foods array!');
  }

  const catalogFiltered = foods
    .filter(food => {
      if (!blacklisted.includes(food.id)) {
        const matchesTags = filterTags.length === 0 || filterTags.some(tag => (food.tags || []).includes(tag));
        return matchesTags;
      }
      return false;
    })
    .sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });

  const displayedFoods = showQuickPicks ? catalogFiltered : usdaFoods;

  const handleSwap = () => {
    if (selectedFood) {
      onSwap(selectedFood);
      onClose();
    }
  };

  const toggleTagFilter = (tag: string) => {
    setFilterTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'protein': return 'bg-red-500';
      case 'carbs': return 'bg-blue-500';
      case 'fats': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case 'protein': return 'Protein';
      case 'carbs': return 'Carbs';
      case 'fats': return 'Fats';
      default: return cat;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 sm:px-0">
      <div className="bg-zinc-900 text-white rounded-2xl p-4 sm:p-6 w-full max-w-lg sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-800 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold">Swap Food</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`${getCategoryColor(category)} text-white px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1 w-fit`}>
          {getCategoryName(category)} Sources
        </div>

        <div className="bg-zinc-800 rounded-lg p-3 sm:p-4 min-w-0">
          <p className="text-xs text-zinc-400 mb-2">Current Food</p>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <p className="font-bold text-white break-words">{currentFood.food}</p>
              <p className="text-sm text-zinc-400">{currentFood.quantity}</p>
            </div>
            <div className="space-y-1 sm:space-y-2 text-left sm:text-right">
              <p className="text-xs text-zinc-400">Macros</p>
              <p className="text-sm text-white">{Math.round(currentFood.calories)} kcal</p>
              <p className="text-xs text-zinc-400 break-words">P: {currentFood.protein}g · C: {currentFood.carbs}g · F: {currentFood.fat}g</p>
            </div>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search USDA database (1000+ foods)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {!showQuickPicks && (
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="break-words">Searching USDA database - all nutrition values per 100g</span>
          </div>
        )}

        {showQuickPicks && allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 12).map(tag => (
              <button
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  filterTags.includes(tag)
                    ? 'bg-green-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {isSearching && (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-zinc-400">Searching USDA database...</p>
            </div>
          )}
          
          {!isSearching && displayedFoods.map((food: FoodItem | SimplifiedFood) => {
            const isFavorite = favorites.includes(food.id);
            const isSelected = selectedFood?.id === food.id;
            const isUSDA = 'source' in food && food.source === 'usda';
            
            // Get macros safely
            const protein = ('protein_g' in food) ? food.protein_g : (food as SimplifiedFood).protein;
            const carbs = ('carbs_g' in food) ? food.carbs_g : (food as SimplifiedFood).carbs;
            const fat = ('fat_g' in food) ? food.fat_g : (food as SimplifiedFood).fat;
            const servingSize = ('serving_size' in food) ? food.serving_size : (food as SimplifiedFood).servingSize;
            const servingUnit = ('serving_unit' in food) ? food.serving_unit : (food as SimplifiedFood).servingUnit;
            const tags = ('tags' in food) ? food.tags : [];

            return (
              <div
                key={`${isUSDA ? 'usda' : 'cat'}-${food.id}`}
                onClick={() => {
                  // Convert USDA foods to FoodItem format for swapping
                  if (isUSDA) {
                    setSelectedFood(convertSimplifiedToFoodItem(food as SimplifiedFood) as FoodItem);
                  } else {
                    setSelectedFood(food as FoodItem);
                  }
                }}
                className={`bg-zinc-800 rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-green-500 bg-zinc-750' : 'hover:bg-zinc-750'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-white break-words">{food.name}</p>
                      {isFavorite && (
                        <span className="text-yellow-400">⭐</span>
                      )}
                      {isUSDA && <span className="text-xs bg-blue-600 px-2 py-0.5 rounded text-white flex-shrink-0">USDA</span>}
                    </div>
                    <p className="text-sm text-zinc-400">{servingSize}{servingUnit}</p>
                    {tags && tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 sm:space-y-2 text-left sm:text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">{Math.round(food.calories)} kcal</p>
                    <p className="text-xs text-zinc-400 break-words">
                      P: {Math.round(protein)}g · C: {Math.round(carbs)}g · F: {Math.round(fat)}g
                    </p>
                    {onToggleFavorite && !isUSDA && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(food.id);
                        }}
                        className="text-xs text-zinc-500 hover:text-yellow-400 mt-1"
                      >
                        {isFavorite ? 'Unfavorite' : 'Favorite'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!isSearching && displayedFoods.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <p>{showQuickPicks ? 'No foods found matching your criteria' : 'No foods found. Try a different search.'}</p>
              {!showQuickPicks && (
                <p className="text-xs mt-2">Searching {category} foods in USDA database...</p>
              )}
            </div>
          )}
        </div>

        {selectedFood && (
          <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-lg p-3 sm:p-4 min-w-0">
            <p className="text-xs text-green-200 mb-2">Swapping To</p>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <p className="font-bold text-white break-words">{selectedFood.name}</p>
                <p className="text-sm text-green-200">{selectedFood.serving_size}{selectedFood.serving_unit}</p>
              </div>
              <div className="space-y-1 sm:space-y-2 text-left sm:text-right">
                <p className="text-xs text-green-200">New Macros</p>
                <p className="text-sm text-white">{Math.round(selectedFood.calories)} kcal</p>
                <p className="text-xs text-green-200 break-words">
                  P: {selectedFood.protein_g}g · C: {selectedFood.carbs_g}g · F: {selectedFood.fat_g}g
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSwap}
            disabled={!selectedFood}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-black px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Confirm Swap
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodSwapModal;
