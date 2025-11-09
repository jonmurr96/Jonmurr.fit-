import { supabase } from '../supabaseClient';
import { Meal, FoodItem, DailyMacros, DailyLog } from '../../types';

const USER_ID = 'default_user';

export const mealService = {
  async getMealsForDate(date: string): Promise<Meal[]> {
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
      .eq('user_id', USER_ID)
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
  },

  async addMeal(meal: Omit<Meal, 'id'>): Promise<Meal> {
    const { data: mealData, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: USER_ID,
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

    await this.updateDailyLog(meal.timestamp);

    return {
      id: mealData.id,
      ...meal,
    };
  },

  async deleteMeal(mealId: string, mealDate: Date): Promise<void> {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }

    await this.updateDailyLog(mealDate);
  },

  async updateDailyLog(date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];
    const meals = await this.getMealsForDate(dateStr);

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
        user_id: USER_ID,
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
  },

  async getDailyLog(date: string): Promise<DailyMacros> {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', USER_ID)
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
  },

  async getWeekLogs(startDate: Date): Promise<DailyLog[]> {
    const logs: DailyLog[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const macros = await this.getDailyLog(dateStr);
      logs.push({ date: dateStr, macros });
    }

    return logs;
  },

  async getQuickAddMeals(): Promise<{ name: string; items: FoodItem[] }[]> {
    const { data, error } = await supabase
      .from('quick_add_meals')
      .select(`
        id,
        name,
        quick_add_meal_items (*)
      `)
      .eq('user_id', USER_ID);

    if (error) {
      console.error('Error fetching quick add meals:', error);
      return [];
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
  },

  async addQuickAddMeal(name: string, items: FoodItem[]): Promise<void> {
    const { data: mealData, error: mealError } = await supabase
      .from('quick_add_meals')
      .insert({
        user_id: USER_ID,
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
  },
};
