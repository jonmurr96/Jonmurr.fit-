import React, { useState, useEffect, useRef } from 'react';
import { useUserServices } from '../hooks/useUserServices';
import { FoodItem as CatalogFoodItem } from '../services/database/foodCatalogService';
import { GeneratedMealPlan, MealPlanItem } from '../types';
import { searchUSDAFoods } from '../services/foodSearchWrapper';
import { SimplifiedFood } from '../services/usdaFoodService';
import { logFoodWithPhoto } from '../services/geminiService';
import { MacroSummaryCard } from './meal-builder/MacroSummaryCard';
import { FoodCard } from './meal-builder/FoodCard';
import { SearchBar } from './meal-builder/SearchBar';
import { PlanPreview } from './meal-builder/PlanPreview';

interface ManualMealPlanBuilderProps {
  onClose: () => void;
  onSave: (plan: GeneratedMealPlan) => void;
}

interface MealSlot {
  name: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack 1' | 'Snack 2';
  items: MealPlanItem[];
}

export const ManualMealPlanBuilderV2: React.FC<ManualMealPlanBuilderProps> = ({ onClose, onSave }) => {
  const { foodCatalogService } = useUserServices();
  
  // State
  const [activeTab, setActiveTab] = useState<'browse' | 'plan'>('browse');
  const [catalogFoods, setCatalogFoods] = useState<CatalogFoodItem[]>([]);
  const [usdaFoods, setUsdaFoods] = useState<SimplifiedFood[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [blacklisted, setBlacklisted] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<'protein' | 'carbs' | 'fats'>('protein');
  const [searchQuery, setSearchQuery] = useState('');
  const [planName, setPlanName] = useState('My Custom Plan');
  const [isSearching, setIsSearching] = useState(false);
  const [showQuickPicks, setShowQuickPicks] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState<number>(0); // Default to Breakfast
  const [showHiddenFoods, setShowHiddenFoods] = useState(false);
  const [includeBranded, setIncludeBranded] = useState(false);
  const [pendingUndoFoodIds, setPendingUndoFoodIds] = useState<number[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const baselineHeightRef = useRef<number>(0);
  const pendingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [meals, setMeals] = useState<MealSlot[]>([
    { name: 'Breakfast', items: [] },
    { name: 'Lunch', items: [] },
    { name: 'Dinner', items: [] },
    { name: 'Snack 1', items: [] },
    { name: 'Snack 2', items: [] },
  ]);

  // Load catalog and preferences
  useEffect(() => {
    const loadFoodCatalog = async () => {
      const foods = await foodCatalogService.getAllFoods();
      setCatalogFoods(foods);
      
      const prefs = await foodCatalogService.getUserPreferences();
      if (prefs) {
        setFavorites(prefs.favorited_foods || []);
        setBlacklisted(prefs.blacklisted_foods || []);
      }
    };
    
    loadFoodCatalog();
  }, [foodCatalogService]);

  // Search USDA database with debounce
  useEffect(() => {
    const searchUSDA = async () => {
      if (searchQuery.trim().length < 2) {
        setUsdaFoods([]);
        setShowQuickPicks(true);
        return;
      }

      setIsSearching(true);
      setShowQuickPicks(false);
      setSearchError(null);
      
      try {
        const results = await searchUSDAFoods(searchQuery, 50, includeBranded);
        const filtered = results.filter(food => food.category === activeCategory);
        setUsdaFoods(filtered);
        setSearchError(null);
      } catch (error) {
        console.error('Error searching foods:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to search foods';
        setSearchError(errorMessage);
        setUsdaFoods([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUSDA, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, activeCategory, includeBranded]);

  // Keyboard detection for mobile using baseline height approach
  useEffect(() => {
    // Store baseline height on mount
    if (window.visualViewport) {
      baselineHeightRef.current = window.visualViewport.height;
    } else {
      baselineHeightRef.current = window.innerHeight;
    }

    const handleOrientationChange = () => {
      // Reset baseline and keyboard height on orientation change
      if (window.visualViewport) {
        baselineHeightRef.current = window.visualViewport.height;
      } else {
        baselineHeightRef.current = window.innerHeight;
      }
      setKeyboardHeight(0);
    };

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const offsetTop = window.visualViewport.offsetTop || 0;
        const baseline = baselineHeightRef.current;
        
        // Calculate keyboard height from baseline (not window.innerHeight)
        const heightDiff = baseline - currentHeight;
        const totalKeyboardHeight = heightDiff + offsetTop;
        
        // Close to baseline = no keyboard
        if (Math.abs(heightDiff) < 80 && offsetTop < 10) {
          setKeyboardHeight(0);
        }
        // Keyboard is open (rely on orientationchange handler for rotation detection)
        else if (totalKeyboardHeight > 80) {
          setKeyboardHeight(totalKeyboardHeight);
        } else {
          setKeyboardHeight(0);
        }
      } else {
        // Fallback for browsers without visualViewport
        const currentHeight = window.innerHeight;
        const baseline = baselineHeightRef.current;
        const diff = baseline - currentHeight;
        
        if (Math.abs(diff) < 80) {
          setKeyboardHeight(0);
        } else if (diff > 80) {
          setKeyboardHeight(diff);
        } else {
          setKeyboardHeight(0);
        }
      }
    };

    // Listen to orientation changes explicitly
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Listen to visualViewport if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    // Fallback listener for older browsers
    window.addEventListener('resize', handleViewportChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      pendingTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      pendingTimeoutsRef.current.clear();
    };
  }, []);

  // Filter and sort quick picks
  const filteredQuickPicks = catalogFoods
    .filter(food => {
      if (food.category !== activeCategory) return false;
      if (showHiddenFoods) return blacklisted.includes(food.id);
      return !blacklisted.includes(food.id);
    })
    .sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });

  const displayedFoods = showQuickPicks ? filteredQuickPicks : usdaFoods;

  // Macro calculations
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

  const macros = calculateTotalMacros();
  const totalItems = meals.reduce((sum, meal) => sum + meal.items.length, 0);

  // Food management handlers
  const handleAddFood = (food: CatalogFoodItem | SimplifiedFood) => {

    const servingSize = ('serving_size' in food) ? food.serving_size : food.servingSize;
    const servingUnit = ('serving_unit' in food) ? food.serving_unit : food.servingUnit;
    const protein = ('protein_g' in food) ? food.protein_g : food.protein;
    const carbs = ('carbs_g' in food) ? food.carbs_g : food.carbs;
    const fat = ('fat_g' in food) ? food.fat_g : food.fat;
    
    const mealItem: MealPlanItem = {
      food: food.name,
      quantity: `${servingSize}${servingUnit}`,
      calories: food.calories,
      protein,
      carbs,
      fat,
      catalogFoodId: 'source' in food && food.source === 'usda' ? undefined : food.id,
    };

    setMeals(prev => {
      const newMeals = [...prev];
      newMeals[selectedMealSlot].items.push(mealItem);
      return newMeals;
    });

    // Auto-switch to plan tab after adding
    setActiveTab('plan');
  };

  const handleRemoveFood = (mealIndex: number, itemIndex: number) => {
    setMeals(prev => {
      const newMeals = [...prev];
      newMeals[mealIndex].items.splice(itemIndex, 1);
      return newMeals;
    });
  };

  const handleUpdateServing = (mealIndex: number, itemIndex: number, newServing: number) => {
    setMeals(prev => {
      const newMeals = [...prev];
      const item = newMeals[mealIndex].items[itemIndex];
      const catalogFood = catalogFoods.find(f => f.id === item.catalogFoodId);
      
      if (catalogFood && newServing > 0) {
        const multiplier = newServing / catalogFood.serving_size;
        newMeals[mealIndex].items[itemIndex] = {
          ...item,
          serving: newServing,
          quantity: `${newServing}${catalogFood.serving_unit}`,
          calories: catalogFood.calories * multiplier,
          protein: catalogFood.protein_g * multiplier,
          carbs: catalogFood.carbs_g * multiplier,
          fat: catalogFood.fat_g * multiplier,
        };
      } else if (newServing > 0) {
        const originalServing = item.serving || 1;
        const multiplier = newServing / originalServing;
        newMeals[mealIndex].items[itemIndex] = {
          ...item,
          serving: newServing,
          quantity: `${newServing}${item.servingUnit}`,
          calories: item.calories / originalServing * newServing,
          protein: item.protein / originalServing * newServing,
          carbs: item.carbs / originalServing * newServing,
          fat: item.fat / originalServing * newServing,
        };
      }
      
      return newMeals;
    });
  };

  const handleToggleFavorite = async (foodId: number) => {
    if (favorites.includes(foodId)) {
      await foodCatalogService.removeFavorite(foodId);
      setFavorites(prev => prev.filter(id => id !== foodId));
    } else {
      await foodCatalogService.addFavorite(foodId);
      setFavorites(prev => [...prev, foodId]);
    }
  };

  const handleToggleHide = async (foodId: number, currentlyHidden: boolean) => {
    if (currentlyHidden) {
      const existingTimeout = pendingTimeoutsRef.current.get(foodId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        pendingTimeoutsRef.current.delete(foodId);
        setPendingUndoFoodIds(prev => prev.filter(id => id !== foodId));
      }
      
      await foodCatalogService.removeBlacklist(foodId);
      setBlacklisted(prev => prev.filter(id => id !== foodId));
    } else {
      const existingTimeout = pendingTimeoutsRef.current.get(foodId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      setBlacklisted(prev => [...prev, foodId]);
      
      const timeoutId = setTimeout(async () => {
        await foodCatalogService.addBlacklist(foodId);
        pendingTimeoutsRef.current.delete(foodId);
        setPendingUndoFoodIds(prev => prev.filter(id => id !== foodId));
      }, 5000);
      
      pendingTimeoutsRef.current.set(foodId, timeoutId);
      setPendingUndoFoodIds(prev => [...prev, foodId]);
    }
  };

  const handleSave = () => {
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

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'protein': return 'bg-red-500';
      case 'carbs': return 'bg-blue-500';
      case 'fats': return 'bg-yellow-500';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div 
        className="bg-zinc-900 text-white w-full flex flex-col"
        style={{ 
          height: '100dvh', // Dynamic viewport height (adjusts for keyboard on modern browsers)
          maxHeight: '100vh', // Fallback for older browsers
        }}
      >
        
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="text-xl font-bold bg-transparent border-b border-zinc-700 focus:border-green-500 outline-none transition-colors flex-1 mr-4"
              placeholder="Enter plan name"
            />
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Macro Summary */}
          <MacroSummaryCard
            totalCalories={macros.totalCalories}
            totalProtein={macros.totalProtein}
            totalCarbs={macros.totalCarbs}
            totalFat={macros.totalFat}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 flex gap-2 p-4 bg-zinc-900 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'browse'
                ? 'bg-green-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            🔍 Browse Foods
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all relative ${
              activeTab === 'plan'
                ? 'bg-green-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            📝 Your Plan
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Content Area - Always scrollable with keyboard-aware padding */}
        <div 
          className="flex-1 overflow-y-auto" 
          style={{ 
            paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 20}px` : '100px',
            WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
          }}
        >
          {activeTab === 'browse' ? (
            <div className="flex flex-col min-h-full">
              {/* Search & Filters */}
              <div className="flex-shrink-0 p-4 space-y-4">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  isSearching={isSearching}
                  showQuickPicks={showQuickPicks}
                  includeBranded={includeBranded}
                  onToggleBranded={() => setIncludeBranded(!includeBranded)}
                />

                {/* Category Filters */}
                <div className="flex gap-2">
                  {(['protein', 'carbs', 'fats'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                        activeCategory === cat
                          ? `${getCategoryColor(cat)} text-white`
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Meal Slot Selector */}
                <div className="bg-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 mb-2">Add foods to:</p>
                  <div className="flex gap-2 flex-wrap">
                    {meals.map((meal, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedMealSlot(index)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          selectedMealSlot === index
                            ? 'bg-green-600 text-white'
                            : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                        }`}
                      >
                        {meal.name}
                      </button>
                    ))}
                  </div>
                  {selectedMealSlot !== null && (
                    <p className="text-xs text-green-400 mt-1">
                      ✓ Adding to: {meals[selectedMealSlot].name}
                    </p>
                  )}
                </div>

                {/* Hidden Foods Toggle */}
                {showQuickPicks && blacklisted.length > 0 && (
                  <button
                    onClick={() => setShowHiddenFoods(!showHiddenFoods)}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                      showHiddenFoods ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {showHiddenFoods ? '👁️ Viewing Hidden' : '🙈 Show Hidden'}
                    {blacklisted.length > 0 && ` (${blacklisted.length})`}
                  </button>
                )}
              </div>

              {/* Food Grid - No nested scroll, parent handles scrolling */}
              <div className="p-4">
                {searchError && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
                    <p className="text-red-400 text-sm">{searchError}</p>
                  </div>
                )}


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedFoods.map((food) => {
                    const isUSDA = 'source' in food && food.source === 'usda';
                    return (
                      <FoodCard
                        key={`${isUSDA ? 'usda' : 'cat'}-${food.id}`}
                        food={food}
                        isFavorite={favorites.includes(food.id)}
                        isBlacklisted={blacklisted.includes(food.id)}
                        isUSDA={isUSDA}
                        onAdd={handleAddFood}
                        onToggleFavorite={!isUSDA ? handleToggleFavorite : undefined}
                        onToggleHide={!isUSDA ? handleToggleHide : undefined}
                      />
                    );
                  })}
                </div>

                {displayedFoods.length === 0 && !isSearching && !searchError && (
                  <div className="text-center py-12 text-zinc-500">
                    {searchQuery ? 'No foods found. Try a different search.' : 'Type to search for foods'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <PlanPreview
                meals={meals}
                onRemoveFood={handleRemoveFood}
              />
            </div>
          )}
        </div>

        {/* Sticky Bottom Actions - Fixed at bottom with keyboard-aware positioning */}
        <div 
          className="fixed left-0 right-0 p-4 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm z-30 transition-transform duration-200"
          style={{ 
            bottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px',
            paddingBottom: keyboardHeight > 0 ? '1rem' : 'max(1rem, env(safe-area-inset-bottom))'
          }}
        >
          <div className="flex gap-3 max-w-7xl mx-auto">
            <button
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={totalItems === 0}
              className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-all ${
                totalItems === 0
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              Save Plan ({totalItems} foods)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
