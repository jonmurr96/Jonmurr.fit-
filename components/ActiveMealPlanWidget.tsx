import React from 'react';
import { GeneratedMealPlan, PlannedMeal, FoodItem, Meal } from '../types';
import { PlusIcon, TrashIcon, PencilIcon } from './Icons';

interface ActiveMealPlanWidgetProps {
  plan: GeneratedMealPlan;
  addMeal: (type: Meal['type'], items: FoodItem[]) => void;
  mealsToday: Meal[];
  onDeactivate: () => void;
  onEdit: () => void;
}

const ActiveMealPlanWidget: React.FC<ActiveMealPlanWidgetProps> = ({ plan, addMeal, mealsToday, onDeactivate, onEdit }) => {

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
                                <div className="space-y-1 pl-2 border-l-2 border-zinc-700">
                                    {meal.items.map((item, itemIndex) => (
                                        <p key={itemIndex} className="text-sm text-zinc-300">
                                            {item.food} <span className="text-zinc-500">({item.quantity})</span>
                                        </p>
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
        </div>
    );
};

export default ActiveMealPlanWidget;
