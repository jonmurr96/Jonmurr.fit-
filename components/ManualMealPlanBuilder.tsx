import React, { useState, useEffect } from 'react';
import { useUserServices } from '../hooks/useUserServices';
import { FoodItem as CatalogFoodItem } from '../services/database/foodCatalogService';
import { GeneratedMealPlan, MealPlanItem } from '../types';
import { searchUSDAFoods, convertToSimplifiedFood, SimplifiedFood } from '../services/usdaFoodService';

interface ManualMealPlanBuilderProps {
  onClose: () => void;
  onSave: (plan: GeneratedMealPlan) => void;
}

interface MealSlot {
  name: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack 1' | 'Snack 2';
  items: MealPlanItem[];
}

const ManualMealPlanBuilder: React.FC<ManualMealPlanBuilderProps> = ({ onClose, onSave }) => {
  const { foodCatalogService } = useUserServices();
  const [catalogFoods, setCatalogFoods] = useState<CatalogFoodItem[]>([]);
  const [usdaFoods, setUsdaFoods] = useState<SimplifiedFood[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<'protein' | 'carbs' | 'fats'>('protein');
  const [searchQuery, setSearchQuery] = useState('');
  const [planName, setPlanName] = useState('My Custom Plan');
  const [isSearching, setIsSearching] = useState(false);
  const [showQuickPicks, setShowQuickPicks] = useState(true);
  
  const [meals, setMeals] = useState<MealSlot[]>([
    { name: 'Breakfast', items: [] },
    { name: 'Lunch', items: [] },
    { name: 'Dinner', items: [] },
    { name: 'Snack 1', items: [] },
    { name: 'Snack 2', items: [] },
  ]);

  // Load quick picks from catalog (60 curated foods)
  useEffect(() => {
    const loadFoodCatalog = async () => {
      const foods = await foodCatalogService.getAllFoods();
      setCatalogFoods(foods);
      console.log('📦 Loaded catalog quick picks:', foods.length, 'foods');
      
      const prefs = await foodCatalogService.getUserPreferences();
      if (prefs) {
        setFavorites(prefs.favorited_foods || []);
      }
    };
    
    loadFoodCatalog();
  }, [foodCatalogService]);

  // Search USDA database when user types
  useEffect(() => {
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
        const simplified = results.map(convertToSimplifiedFood);
        const filtered = simplified.filter(food => food.category === activeCategory);
        setUsdaFoods(filtered);
        console.log('🔍 USDA search results:', filtered.length, 'foods');
      } catch (error) {
        console.error('Error searching USDA:', error);
        setUsdaFoods([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUSDA, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, activeCategory]);

  // Quick picks (catalog foods)
  const filteredQuickPicks = catalogFoods
    .filter(food => food.category === activeCategory)
    .sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });

  // Determine which foods to display
  const displayedFoods = showQuickPicks ? filteredQuickPicks : usdaFoods;

  const addFoodToMeal = (mealIndex: number, food: CatalogFoodItem | SimplifiedFood, servings: number = 1) => {
    const newMeals = [...meals];
    
    // Handle both catalog and USDA foods
    const servingSize = ('serving_size' in food) ? food.serving_size : (food as SimplifiedFood).servingSize;
    const servingUnit = ('serving_unit' in food) ? food.serving_unit : (food as SimplifiedFood).servingUnit;
    const protein = ('protein_g' in food) ? food.protein_g : (food as SimplifiedFood).protein;
    const carbs = ('carbs_g' in food) ? food.carbs_g : (food as SimplifiedFood).carbs;
    const fat = ('fat_g' in food) ? food.fat_g : (food as SimplifiedFood).fat;
    
    const mealItem: MealPlanItem = {
      food: food.name,
      quantity: `${servingSize * servings}${servingUnit}`,
      calories: food.calories * servings,
      protein: protein * servings,
      carbs: carbs * servings,
      fat: fat * servings,
      catalogFoodId: 'source' in food && food.source === 'usda' ? undefined : food.id,
    };
    newMeals[mealIndex].items.push(mealItem);
    setMeals(newMeals);
  };

  const removeFoodFromMeal = (mealIndex: number, itemIndex: number) => {
    const newMeals = [...meals];
    newMeals[mealIndex].items.splice(itemIndex, 1);
    setMeals(newMeals);
  };

  const updateServingSize = (mealIndex: number, itemIndex: number, servings: number) => {
    const newMeals = [...meals];
    const item = newMeals[mealIndex].items[itemIndex];
    const catalogFood = catalogFoods.find(f => f.id === item.catalogFoodId);
    
    if (catalogFood && servings > 0) {
      newMeals[mealIndex].items[itemIndex] = {
        ...item,
        quantity: `${catalogFood.serving_size * servings}${catalogFood.serving_unit}`,
        calories: catalogFood.calories * servings,
        protein: catalogFood.protein_g * servings,
        carbs: catalogFood.carbs_g * servings,
        fat: catalogFood.fat_g * servings,
      };
      setMeals(newMeals);
    }
  };

  const calculateTotalMacros = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meals.forEach(meal => {
      meal.items.forEach(item => {
        totalCalories += item.calories;
        totalProtein += item.protein;
        totalCarbs += item.carbs;
        totalFat += item.fat;
      });
    });

    return { totalCalories, totalProtein, totalCarbs, totalFat };
  };

  const handleSave = () => {
    const macros = calculateTotalMacros();
    
    const plan: GeneratedMealPlan = {
      planName,
      description: 'Custom meal plan created manually',
      dailyPlan: {
        dayOfWeek: 'Daily',
        totalCalories: macros.totalCalories,
        totalProtein: macros.totalProtein,
        totalCarbs: macros.totalCarbs,
        totalFat: macros.totalFat,
        meals: meals
          .filter(meal => meal.items.length > 0)
          .map(meal => ({
            name: meal.name,
            items: meal.items,
            swaps: [],
          })),
      },
    };

    onSave(plan);
  };

  const macros = calculateTotalMacros();
  const totalItems = meals.reduce((sum, meal) => sum + meal.items.length, 0);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'protein': return 'bg-red-500';
      case 'carbs': return 'bg-blue-500';
      case 'fats': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 sm:px-0">
      <div className="bg-zinc-900 text-white rounded-2xl p-4 sm:p-6 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border border-zinc-800 shadow-2xl">
        
        {/* Header */}
        <div className="pb-4 sm:pb-6 border-b border-zinc-800 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0 mr-4">
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="text-xl sm:text-2xl font-bold bg-transparent border-b border-zinc-700 focus:border-green-500 outline-none transition-colors w-full"
                placeholder="Enter plan name"
              />
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Macro Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-400">Calories</p>
              <p className="text-2xl font-bold text-white">{Math.round(macros.totalCalories)}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-400">Protein</p>
              <p className="text-2xl font-bold text-red-400">{Math.round(macros.totalProtein)}g</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-400">Carbs</p>
              <p className="text-2xl font-bold text-blue-400">{Math.round(macros.totalCarbs)}g</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-400">Fat</p>
              <p className="text-2xl font-bold text-yellow-400">{Math.round(macros.totalFat)}g</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Food Catalog Browser */}
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col min-h-0">
            <div className="p-3 sm:p-4 border-b border-zinc-800">
              <h3 className="text-base sm:text-lg font-bold mb-3">Food Catalog</h3>
              
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(['protein', 'carbs', 'fats'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeCategory === cat
                        ? `${getCategoryColor(cat)} text-white`
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search USDA database (1000+ foods)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              
              {!showQuickPicks && (
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Searching USDA database - all nutrition values per 100g</span>
                </div>
              )}
              {showQuickPicks && (
                <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Showing quick picks - Type to search 1000+ USDA foods</span>
                </div>
              )}
            </div>

            {/* Food List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isSearching && (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-2 text-zinc-400">Searching USDA database...</p>
                </div>
              )}
              
              {!isSearching && displayedFoods.map((food: CatalogFoodItem | SimplifiedFood) => {
                const isFavorite = favorites.includes(food.id);
                const isUSDA = 'source' in food && food.source === 'usda';
                
                // Get macros safely
                const protein = ('protein_g' in food) ? food.protein_g : (food as SimplifiedFood).protein;
                const carbs = ('carbs_g' in food) ? food.carbs_g : (food as SimplifiedFood).carbs;
                const fat = ('fat_g' in food) ? food.fat_g : (food as SimplifiedFood).fat;
                const servingSize = ('serving_size' in food) ? food.serving_size : (food as SimplifiedFood).servingSize;
                const servingUnit = ('serving_unit' in food) ? food.serving_unit : (food as SimplifiedFood).servingUnit;
                
                return (
                  <div
                    key={`${isUSDA ? 'usda' : 'cat'}-${food.id}`}
                    className="bg-zinc-800 rounded-lg p-3 hover:bg-zinc-750 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 mb-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <p className="font-bold text-white break-words">{food.name}</p>
                        {isFavorite && <span className="text-yellow-400 text-sm flex-shrink-0">⭐</span>}
                        {isUSDA && <span className="text-xs bg-blue-600 px-2 py-0.5 rounded text-white flex-shrink-0">USDA</span>}
                      </div>
                      <div className="space-y-1 text-left sm:text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-white">{Math.round(food.calories)} kcal</p>
                        <p className="text-xs text-zinc-400 break-words">
                          P: {Math.round(protein)}g · C: {Math.round(carbs)}g · F: {Math.round(fat)}g
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">{servingSize}{servingUnit}</p>
                    
                    {/* Add to Meal Buttons */}
                    <div className="flex flex-wrap gap-1">
                      {meals.map((meal, idx) => (
                        <button
                          key={idx}
                          onClick={() => addFoodToMeal(idx, food)}
                          className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-black rounded font-semibold transition-colors"
                        >
                          + {meal.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {!isSearching && displayedFoods.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  <p>{showQuickPicks ? 'No foods in this category' : 'No foods found. Try a different search.'}</p>
                  {!showQuickPicks && (
                    <p className="text-xs mt-2">Searching {activeCategory} foods in USDA database...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Meal Builder */}
          <div className="w-full lg:w-1/2 flex flex-col min-h-0">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold">Your Meal Plan</h3>
              <p className="text-sm text-zinc-400">{totalItems} items added</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {meals.map((meal, mealIdx) => (
                <div key={mealIdx} className="bg-zinc-800 rounded-lg p-4">
                  <h4 className="font-bold text-white mb-3">{meal.name}</h4>
                  
                  {meal.items.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">No items yet</p>
                  ) : (
                    <div className="space-y-2">
                      {meal.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="bg-zinc-900 rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-white">{item.food}</p>
                              <p className="text-xs text-zinc-400">
                                {Math.round(item.calories)} kcal · P: {Math.round(item.protein)}g · C: {Math.round(item.carbs)}g · F: {Math.round(item.fat)}g
                              </p>
                            </div>
                            <button
                              onClick={() => removeFoodFromMeal(mealIdx, itemIdx)}
                              className="text-red-400 hover:text-red-300 ml-2"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                          
                          {/* Serving Size Adjuster */}
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-zinc-400">Servings:</label>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              defaultValue="1"
                              onChange={(e) => updateServingSize(mealIdx, itemIdx, parseFloat(e.target.value) || 1)}
                              className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 flex justify-between items-center">
          <div>
            <p className="text-sm text-zinc-400">
              {totalItems === 0 ? 'Add foods to get started' : `${totalItems} items · ${Math.round(macros.totalCalories)} total kcal`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={totalItems === 0}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-black rounded-lg font-semibold transition-colors"
            >
              Save Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualMealPlanBuilder;
