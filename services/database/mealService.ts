import { supabase } from '../supabaseClient';
import { Meal, FoodItem, DailyMacros, DailyLog } from '../../types';

export interface MealService {
  getMealsForDate(date: string): Promise<Meal[]>;
  addMeal(meal: Omit<Meal, 'id'>): Promise<Meal>;
  deleteMeal(mealId: string, mealDate: Date): Promise<void>;
  updateDailyLog(date: Date): Promise<void>;
  getDailyLog(date: string): Promise<DailyMacros>;
  getWeekLogs(startDate: Date): Promise<DailyLog[]>;
  getQuickAddMeals(): Promise<{ name: string; items: FoodItem[] }[]>;
  addQuickAddMeal(name: string, items: FoodItem[]): Promise<void>;
}

export const createMealService = (userId: string): MealService => {
  const getMealsForDate = async (date: string): Promise<Meal[]> => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('meals')
      .select(`
        id,
        type,
        timestamp,
        food_items (*)
      `)
      .eq('user_id', userId)
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching meals:', error);
      return [];
    }

    return (data || []).map((meal: any) => ({
      id: meal.id,
      type: meal.type,
      timestamp: new Date(meal.timestamp),
      items: (meal.food_items || []).map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      })),
    }));
  };

  const getDailyLog = async (date: string): Promise<DailyMacros> => {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error || !data) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    return {
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
    };
  };

  const updateDailyLog = async (date: Date): Promise<void> => {
    const dateStr = date.toISOString().split('T')[0];
    const meals = await getMealsForDate(dateStr);

    const macros = meals.reduce(
      (acc, meal) => {
        meal.items.forEach(item => {
          acc.calories += item.calories;
          acc.protein += item.protein;
          acc.carbs += item.carbs;
          acc.fat += item.fat;
        });
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: userId,
        date: dateStr,
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date'
      });

    if (error) {
      console.error('Error updating daily log:', error);
      throw error;
    }
  };

  const addMeal = async (meal: Omit<Meal, 'id'>): Promise<Meal> => {
    const { data: mealData, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        type: meal.type,
        timestamp: meal.timestamp.toISOString(),
      })
      .select()
      .single();

    if (mealError || !mealData) {
      console.error('Error adding meal:', mealError);
      throw mealError;
    }

    const foodItems = meal.items.map(item => ({
      meal_id: mealData.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }));

    const { error: itemsError } = await supabase
      .from('food_items')
      .insert(foodItems);

    if (itemsError) {
      console.error('Error adding food items:', itemsError);
      throw itemsError;
    }

    await updateDailyLog(meal.timestamp);

    return {
      id: mealData.id,
      ...meal,
    };
  };

  const deleteMeal = async (mealId: string, mealDate: Date): Promise<void> => {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }

    await updateDailyLog(mealDate);
  };

  const getWeekLogs = async (startDate: Date): Promise<DailyLog[]> => {
    const logs: DailyLog[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const macros = await getDailyLog(dateStr);
      logs.push({ date: dateStr, macros });
    }

    return logs;
  };

  const getQuickAddMeals = async (): Promise<{ name: string; items: FoodItem[] }[]> => {
    const { data, error } = await supabase
      .from('quick_add_meals')
      .select(`
        id,
        name,
        quick_add_meal_items (*)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching quick add meals:', error);
      throw error; // Surface error to caller instead of returning empty array
    }

    return (data || []).map((meal: any) => ({
      name: meal.name,
      items: (meal.quick_add_meal_items || []).map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      })),
    }));
  };

  const addQuickAddMeal = async (name: string, items: FoodItem[]): Promise<void> => {
    const { data: mealData, error: mealError} = await supabase
      .from('quick_add_meals')
      .insert({
        user_id: userId,
        name,
      })
      .select()
      .single();

    if (mealError || !mealData) {
      console.error('Error adding quick add meal:', mealError);
      throw mealError;
    }

    const mealItems = items.map(item => ({
      quick_meal_id: mealData.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }));

    const { error: itemsError } = await supabase
      .from('quick_add_meal_items')
      .insert(mealItems);

    if (itemsError) {
      console.error('Error adding quick add meal items:', itemsError);
      throw itemsError;
    }
  };

  return {
    getMealsForDate,
    addMeal,
    deleteMeal,
    updateDailyLog,
    getDailyLog,
    getWeekLogs,
    getQuickAddMeals,
    addQuickAddMeal,
  };
};

export const mealService = createMealService('default_user');
