import React, { useState, useEffect } from 'react';
import { GeneratedMealPlan, PlannedMeal, FoodItem, Meal, MealPlanItem } from '../types';
import { PlusIcon, TrashIcon, PencilIcon } from './Icons';
import FoodSwapModal from './FoodSwapModal';
import { useUserServices } from '../hooks/useUserServices';
import { FoodItem as CatalogFoodItem } from '../services/database/foodCatalogService';

interface ActiveMealPlanWidgetProps {
  plan: GeneratedMealPlan;
  addMeal: (type: Meal['type'], items: FoodItem[]) => void;
  mealsToday: Meal[];
  onDeactivate: () => void;
  onEdit: () => void;
  onPlanUpdate: (updatedPlan: GeneratedMealPlan) => void;
}

const ActiveMealPlanWidget: React.FC<ActiveMealPlanWidgetProps> = ({ plan, addMeal, mealsToday, onDeactivate, onEdit, onPlanUpdate }) => {
    const { foodCatalogService } = useUserServices();
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [selectedFoodForSwap, setSelectedFoodForSwap] = useState<{ mealIndex: number, itemIndex: number, item: MealPlanItem, category: 'protein' | 'carbs' | 'fats' } | null>(null);
    const [catalogFoods, setCatalogFoods] = useState<CatalogFoodItem[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [userPreferences, setUserPreferences] = useState({ favorites: [] as number[], blacklisted: [] as number[] });

    const loggedMealTypes = new Set(mealsToday.map(m => m.type));

    const handleLogMeal = (meal: PlannedMeal) => {
        const items: FoodItem[] = meal.items.map(i => ({
            name: i.food,
            quantity: parseFloat(i.quantity) || 1,
            unit: i.quantity.replace(/[0-9.]/g, '').trim() || 'serving',
            calories: i.calories,
            protein: i.protein,
            carbs: i.carbs,
            fat: i.fat
        }));

        let mealType: Meal['type'] = 'Snacks'; // Default
        if (meal.name === 'Breakfast' || meal.name === 'Lunch' || meal.name === 'Dinner') {
            mealType = meal.name;
        }

        addMeal(mealType, items);
    };
    
    useEffect(() => {
        const loadFoodCatalog = async () => {
            let foods: CatalogFoodItem[] = [];
            try {
                foods = await foodCatalogService.getAllFoods();
                console.log('📦 Loaded catalog foods:', foods.length);
                setCatalogFoods(foods);
                
                const prefs = await foodCatalogService.getUserPreferences();
                if (prefs) {
                    setUserPreferences({
                        favorites: prefs.favorited_foods || [],
                        blacklisted: prefs.blacklisted_foods || [],
                    });
                }
            } catch (error) {
                console.error('Failed to load food catalog:', error);
                setCatalogLoading(false);
                return;
            }

            const hasUnhydratedItems = plan.dailyPlan.meals.some(meal =>
                meal.items.some(item => !item.catalogFoodId)
            );

            if (!hasUnhydratedItems) {
                setCatalogLoading(false);
                return;
            }

            const foodNameToIdMap = new Map<string, number>();
            foods.forEach(food => {
                foodNameToIdMap.set(food.name.toLowerCase(), food.id);
            });

            let needsUpdate = false;
            const hydratedPlan: GeneratedMealPlan = {
                ...plan,
                dailyPlan: {
                    ...plan.dailyPlan,
                    meals: plan.dailyPlan.meals.map(meal => ({
                        ...meal,
                        items: meal.items.map(item => {
                            if (item.catalogFoodId) return { ...item };
                            
                            const catalogId = foodNameToIdMap.get(item.food.toLowerCase());
                            if (catalogId) {
                                needsUpdate = true;
                                return { ...item, catalogFoodId: catalogId };
                            }
                            return { ...item };
                        }),
                    })),
                },
            };

            if (needsUpdate) {
                onPlanUpdate(hydratedPlan);
            }
            
            setCatalogLoading(false);
        };
        
        loadFoodCatalog();
    }, [foodCatalogService, plan, onPlanUpdate]);

    const determineFoodCategory = (item: MealPlanItem): 'protein' | 'carbs' | 'fats' => {
        if (item.protein > Math.max(item.carbs, item.fat)) return 'protein';
        if (item.carbs > Math.max(item.protein, item.fat)) return 'carbs';
        return 'fats';
    };

    const handleSwapClick = (mealIndex: number, itemIndex: number, item: MealPlanItem) => {
        const category = determineFoodCategory(item);
        console.log('🔍 Swap clicked:', { 
            category, 
            totalCatalogFoods: catalogFoods.length,
            foodsInCategory: catalogFoods.filter(f => f.category === category).length
        });
        setSelectedFoodForSwap({ mealIndex, itemIndex, item, category });
        setSwapModalOpen(true);
    };

    const handleSwap = async (newFood: CatalogFoodItem) => {
        if (!selectedFoodForSwap) return;

        const { mealIndex, itemIndex, item } = selectedFoodForSwap;
        
        const updatedPlan: GeneratedMealPlan = {
            ...plan,
            dailyPlan: {
                ...plan.dailyPlan,
                meals: plan.dailyPlan.meals.map((meal, mIndex) => ({
                    ...meal,
                    items: meal.items.map((mealItem, iIndex) => {
                        if (mIndex === mealIndex && iIndex === itemIndex) {
                            return {
                                food: newFood.name,
                                quantity: `${newFood.serving_size}${newFood.serving_unit}`,
                                calories: newFood.calories,
                                protein: newFood.protein_g,
                                carbs: newFood.carbs_g,
                                fat: newFood.fat_g,
                                catalogFoodId: newFood.id,
                            };
                        }
                        return { ...mealItem };
                    }),
                })),
            },
        };

        const newTotalCalories = updatedPlan.dailyPlan.meals.reduce(
            (sum, meal) => sum + meal.items.reduce((mealSum, mealItem) => mealSum + (mealItem.calories || 0), 0),
            0
        );
        const newTotalProtein = updatedPlan.dailyPlan.meals.reduce(
            (sum, meal) => sum + meal.items.reduce((mealSum, mealItem) => mealSum + (mealItem.protein || 0), 0),
            0
        );
        const newTotalCarbs = updatedPlan.dailyPlan.meals.reduce(
            (sum, meal) => sum + meal.items.reduce((mealSum, mealItem) => mealSum + (mealItem.carbs || 0), 0),
            0
        );
        const newTotalFat = updatedPlan.dailyPlan.meals.reduce(
            (sum, meal) => sum + meal.items.reduce((mealSum, mealItem) => mealSum + (mealItem.fat || 0), 0),
            0
        );

        updatedPlan.dailyPlan.totalCalories = newTotalCalories;
        updatedPlan.dailyPlan.totalProtein = newTotalProtein;
        updatedPlan.dailyPlan.totalCarbs = newTotalCarbs;
        updatedPlan.dailyPlan.totalFat = newTotalFat;

        const originalFoodId = item.catalogFoodId || -1;
        await foodCatalogService.recordSwap(
            originalFoodId,
            newFood.id,
            updatedPlan.dailyPlan.meals[mealIndex].name
        );

        onPlanUpdate(updatedPlan);
        
        const refreshedPrefs = await foodCatalogService.getUserPreferences();
        if (refreshedPrefs) {
            setUserPreferences({
                favorites: refreshedPrefs.favorited_foods || [],
                blacklisted: refreshedPrefs.blacklisted_foods || [],
            });
        }
        
        setSwapModalOpen(false);
        setSelectedFoodForSwap(null);
    };

    const handleToggleFavorite = async (foodId: number) => {
        const isFavorited = userPreferences.favorites.includes(foodId);
        
        if (isFavorited) {
            await foodCatalogService.removeFavorite(foodId);
            setUserPreferences(prev => ({
                ...prev,
                favorites: prev.favorites.filter(id => id !== foodId),
            }));
        } else {
            await foodCatalogService.addFavorite(foodId);
            setUserPreferences(prev => ({
                ...prev,
                favorites: [...prev.favorites, foodId],
            }));
        }
    };
    
    const isMealLogged = (meal: PlannedMeal): boolean => {
         if (meal.name.startsWith('Snack')) {
            return loggedMealTypes.has('Snacks');
         }
         return loggedMealTypes.has(meal.name as Meal['type']);
    };
    
    return (
        <div className="bg-zinc-900 text-white p-4 mt-4 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h2 className="text-sm text-green-400 font-bold uppercase">Active Meal Plan</h2>
                    <p className="text-lg font-semibold">{plan.planName}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onEdit} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white font-semibold transition-colors">
                        <PencilIcon className="w-4 h-4" />
                        <span>Edit</span>
                    </button>
                    <button onClick={onDeactivate} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">
                        <TrashIcon className="w-4 h-4" />
                        <span>Deactivate</span>
                    </button>
                </div>
            </div>
            
            <div className="space-y-2">
                {plan.dailyPlan.meals.map((meal, index) => {
                    const mealIsLogged = isMealLogged(meal);
                    const totalCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);

                    return (
                        <div key={index} className={`bg-zinc-800 p-3 rounded-lg flex items-start justify-between ${mealIsLogged ? 'opacity-60' : ''}`}>
                            <div className="flex-1 pr-2">
                                <p className="font-bold text-white">{meal.name}</p>
                                <p className="text-xs text-zinc-400 mb-2">{Math.round(totalCalories)} kcal</p>
                                <div className="space-y-2 pl-2 border-l-2 border-zinc-700">
                                    {meal.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="flex items-center justify-between group">
                                            <p className="text-sm text-zinc-300 flex-1">
                                                {item.food} <span className="text-zinc-500">({item.quantity})</span>
                                            </p>
                                            <button
                                                onClick={() => handleSwapClick(index, itemIndex, item)}
                                                disabled={catalogLoading}
                                                className="ml-2 px-2 py-1 text-xs bg-zinc-700 hover:bg-green-500 hover:text-black text-zinc-400 rounded transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title={catalogLoading ? "Loading food catalog..." : "Swap food"}
                                            >
                                                {catalogLoading ? '⏳' : '🔄'} Swap
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => handleLogMeal(meal)}
                                disabled={mealIsLogged}
                                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-colors bg-green-500 disabled:bg-zinc-700 hover:bg-green-600 mt-1"
                                aria-label={`Log ${meal.name}`}
                            >
                                {mealIsLogged ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <PlusIcon className="w-6 h-6 text-black" />
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {selectedFoodForSwap && (
                <FoodSwapModal
                    isOpen={swapModalOpen}
                    onClose={() => {
                        setSwapModalOpen(false);
                        setSelectedFoodForSwap(null);
                    }}
                    currentFood={selectedFoodForSwap.item}
                    category={selectedFoodForSwap.category}
                    onSwap={handleSwap}
                    foods={catalogFoods.filter(f => f.category === selectedFoodForSwap.category)}
                    favorites={userPreferences.favorites}
                    blacklisted={userPreferences.blacklisted}
                    onToggleFavorite={handleToggleFavorite}
                />
            )}
        </div>
    );
};

export default ActiveMealPlanWidget;
