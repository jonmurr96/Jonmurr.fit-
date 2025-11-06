import React, { useState } from 'react';
import { GeneratedMealPlan, PlannedMeal, MealPlanItem } from '../types';
import { TrashIcon, PlusIcon, ArrowLeftIcon } from '../components/Icons';

interface MealPlanEditorProps {
  plan: GeneratedMealPlan;
  onSave: (updatedPlan: GeneratedMealPlan) => void;
  onClose: () => void;
}

const MealPlanEditor: React.FC<MealPlanEditorProps> = ({ plan, onSave, onClose }) => {
  const [editablePlan, setEditablePlan] = useState<GeneratedMealPlan>(JSON.parse(JSON.stringify(plan)));

  const handlePlanNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditablePlan(prev => ({ ...prev, planName: e.target.value }));
  };
  
  const handleItemChange = (mealIndex: number, itemIndex: number, field: keyof MealPlanItem, value: string) => {
    const newPlan = { ...editablePlan };
    const item = newPlan.dailyPlan.meals[mealIndex].items[itemIndex];
    if (field === 'food' || field === 'quantity') {
      item[field] = value;
    } else {
      (item[field] as number) = parseFloat(value) || 0;
    }
    setEditablePlan(newPlan);
  };
  
  const handleAddItem = (mealIndex: number) => {
    const newItem: MealPlanItem = { food: '', quantity: '', calories: 0, protein: 0, carbs: 0, fat: 0 };
    const newPlan = { ...editablePlan };
    newPlan.dailyPlan.meals[mealIndex].items.push(newItem);
    setEditablePlan(newPlan);
  };

  const handleDeleteItem = (mealIndex: number, itemIndex: number) => {
    const newPlan = { ...editablePlan };
    newPlan.dailyPlan.meals[mealIndex].items.splice(itemIndex, 1);
    setEditablePlan(newPlan);
  };

  const handleSave = () => {
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    
    const finalPlan = JSON.parse(JSON.stringify(editablePlan));

    finalPlan.dailyPlan.meals.forEach((meal: PlannedMeal) => {
        meal.items.forEach((item: MealPlanItem) => {
            totalCalories += Number(item.calories) || 0;
            totalProtein += Number(item.protein) || 0;
            totalCarbs += Number(item.carbs) || 0;
            totalFat += Number(item.fat) || 0;
        });
    });

    finalPlan.dailyPlan.totalCalories = Math.round(totalCalories);
    finalPlan.dailyPlan.totalProtein = Math.round(totalProtein);
    finalPlan.dailyPlan.totalCarbs = Math.round(totalCarbs);
    finalPlan.dailyPlan.totalFat = Math.round(totalFat);

    onSave(finalPlan);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col p-4 z-50 animate-fade-in">
        <div className="w-full max-w-md mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <button onClick={onClose} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Edit Meal Plan</h1>
                <button onClick={handleSave} className="bg-green-500 text-black font-bold py-2 px-4 rounded-lg">
                    Save
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
                <input
                    type="text"
                    value={editablePlan.planName}
                    onChange={handlePlanNameChange}
                    className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-2 px-4 text-white font-bold text-2xl focus:outline-none focus:border-green-500"
                />

                {editablePlan.dailyPlan.meals.map((meal, mealIndex) => (
                    <div key={mealIndex} className="bg-zinc-900 p-4 rounded-xl">
                        <h3 className="font-bold text-lg text-white mb-3">{meal.name}</h3>
                        <div className="space-y-3">
                            {meal.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="bg-zinc-800 p-3 rounded-lg space-y-2">
                                    <div className="flex gap-2">
                                        <input type="text" value={item.food} onChange={e => handleItemChange(mealIndex, itemIndex, 'food', e.target.value)} placeholder="Food Name" className="flex-1 bg-zinc-700 p-2 rounded-md" />
                                        <input type="text" value={item.quantity} onChange={e => handleItemChange(mealIndex, itemIndex, 'quantity', e.target.value)} placeholder="Qty" className="w-20 bg-zinc-700 p-2 rounded-md text-center" />
                                        <button onClick={() => handleDeleteItem(mealIndex, itemIndex)} className="p-2 text-zinc-500 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                        <input type="text" inputMode="decimal" value={item.calories} onChange={e => handleItemChange(mealIndex, itemIndex, 'calories', e.target.value)} placeholder="kcal" className="bg-zinc-700 p-2 rounded-md text-center" />
                                        <input type="text" inputMode="decimal" value={item.protein} onChange={e => handleItemChange(mealIndex, itemIndex, 'protein', e.target.value)} placeholder="P (g)" className="bg-zinc-700 p-2 rounded-md text-center" />
                                        <input type="text" inputMode="decimal" value={item.carbs} onChange={e => handleItemChange(mealIndex, itemIndex, 'carbs', e.target.value)} placeholder="C (g)" className="bg-zinc-700 p-2 rounded-md text-center" />
                                        <input type="text" inputMode="decimal" value={item.fat} onChange={e => handleItemChange(mealIndex, itemIndex, 'fat', e.target.value)} placeholder="F (g)" className="bg-zinc-700 p-2 rounded-md text-center" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => handleAddItem(mealIndex)} className="w-full mt-3 bg-zinc-800 hover:bg-zinc-700 text-green-400 font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                            <PlusIcon className="w-4 h-4" /> Add Item
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default MealPlanEditor;
