import React, { useState, useEffect } from 'react';
import { useUserServices } from '../hooks/useUserServices';
import { FoodItem as CatalogFoodItem } from '../services/database/foodCatalogService';
import { GeneratedMealPlan, MealPlanItem } from '../types';

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
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<'protein' | 'carbs' | 'fats'>('protein');
  const [searchQuery, setSearchQuery] = useState('');
  const [planName, setPlanName] = useState('My Custom Plan');
  
  const [meals, setMeals] = useState<MealSlot[]>([
    { name: 'Breakfast', items: [] },
    { name: 'Lunch', items: [] },
    { name: 'Dinner', items: [] },
    { name: 'Snack 1', items: [] },
    { name: 'Snack 2', items: [] },
  ]);

  useEffect(() => {
    const loadFoodCatalog = async () => {
      const foods = await foodCatalogService.getAllFoods();
      setCatalogFoods(foods);
      
      const prefs = await foodCatalogService.getUserPreferences();
      if (prefs) {
        setFavorites(prefs.favorited_foods || []);
      }
    };
    
    loadFoodCatalog();
  }, [foodCatalogService]);

  const filteredFoods = catalogFoods
    .filter(food => food.category === activeCategory)
    .filter(food => food.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });

  const addFoodToMeal = (mealIndex: number, food: CatalogFoodItem, servings: number = 1) => {
    const newMeals = [...meals];
    const mealItem: MealPlanItem = {
      food: food.name,
      quantity: `${food.serving_size * servings}${food.serving_unit}`,
      calories: food.calories * servings,
      protein: food.protein_g * servings,
      carbs: food.carbs_g * servings,
      fat: food.fat_g * servings,
      catalogFoodId: food.id,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 text-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border border-zinc-800 shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="text-2xl font-bold bg-transparent border-b border-zinc-700 focus:border-green-500 outline-none transition-colors"
                placeholder="Enter plan name"
              />
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors ml-4"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Macro Summary */}
          <div className="grid grid-cols-4 gap-4">
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

        <div className="flex flex-1 overflow-hidden">
          {/* Food Catalog Browser */}
          <div className="w-1/2 border-r border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold mb-3">Food Catalog</h3>
              
              {/* Category Tabs */}
              <div className="flex gap-2 mb-4">
                {(['protein', 'carbs', 'fats'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
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
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Food List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredFoods.map(food => {
                const isFavorite = favorites.includes(food.id);
                return (
                  <div
                    key={food.id}
                    className="bg-zinc-800 rounded-lg p-3 hover:bg-zinc-750 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">{food.name}</p>
                        {isFavorite && <span className="text-yellow-400 text-sm">⭐</span>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{Math.round(food.calories)} kcal</p>
                        <p className="text-xs text-zinc-400">
                          P: {food.protein_g}g · C: {food.carbs_g}g · F: {food.fat_g}g
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">{food.serving_size}{food.serving_unit}</p>
                    
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
              {filteredFoods.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  <p>No foods found</p>
                </div>
              )}
            </div>
          </div>

          {/* Meal Builder */}
          <div className="w-1/2 flex flex-col">
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
