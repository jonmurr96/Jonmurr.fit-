import React from 'react';
import { GeneratedMealPlan } from '../types';

interface MealPlanViewProps {
  plan: GeneratedMealPlan;
  onActivate: (plan: GeneratedMealPlan) => void;
}

const MealPlanView: React.FC<MealPlanViewProps> = ({ plan, onActivate }) => {
    const { dailyPlan } = plan;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 flex-shrink-0 border-b border-zinc-800 text-center">
                    <h2 className="text-2xl font-bold text-white">{plan.planName}</h2>
                    <p className="text-sm text-zinc-400 mt-1">{plan.description}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-zinc-800 rounded-lg p-4 grid grid-cols-4 gap-2 text-center">
                        <div>
                            <p className="text-xs text-zinc-400">Calories</p>
                            <p className="font-bold text-green-400">{dailyPlan.totalCalories}</p>
                        </div>
                        <div>
                            <p className="text-xs text-sky-400">Protein</p>
                            <p className="font-bold">{dailyPlan.totalProtein}g</p>
                        </div>
                        <div>
                            <p className="text-xs text-orange-400">Carbs</p>
                            <p className="font-bold">{dailyPlan.totalCarbs}g</p>
                        </div>
                        <div>
                            <p className="text-xs text-pink-400">Fat</p>
                            <p className="font-bold">{dailyPlan.totalFat}g</p>
                        </div>
                    </div>

                    {dailyPlan.meals.map((meal, index) => (
                        <div key={index} className="bg-zinc-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-lg text-white mb-2">{meal.name}</h3>
                            <ul className="space-y-2 text-sm">
                                {meal.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="text-zinc-300">
                                        <span className="font-semibold">{item.food}</span> - {item.quantity}
                                    </li>
                                ))}
                            </ul>
                            {meal.swaps && meal.swaps.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-xs font-semibold text-zinc-500">SWAPS</p>
                                    <p className="text-sm text-zinc-400">{meal.swaps.join(', ')}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="p-4 flex-shrink-0 border-t border-zinc-800 space-y-2">
                    <button onClick={() => onActivate(plan)} className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg transition-colors">
                        Activate Plan
                    </button>
                    <button onClick={() => onActivate(plan)} className="w-full text-zinc-400 font-semibold py-2 rounded-lg hover:text-white transition-colors">
                        Discard Plan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MealPlanView;
