import { supabase } from '../supabaseClient';

export interface FoodItem {
  id: number;
  name: string;
  category: 'protein' | 'carbs' | 'fats';
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: number;
  serving_unit: string;
  tags: string[];
  image_url?: string;
  is_verified: boolean;
}

export interface UserFoodPreferences {
  user_id: string;
  favorited_foods: number[];
  blacklisted_foods: number[];
  recent_swaps: SwapRecord[];
}

export interface SwapRecord {
  original_food_id: number;
  new_food_id: number;
  timestamp: string;
  meal_name: string;
}

export interface FoodCatalogService {
  getAllFoods(): Promise<FoodItem[]>;
  getFoodsByCategory(category: 'protein' | 'carbs' | 'fats'): Promise<FoodItem[]>;
  searchFoods(query: string, category?: 'protein' | 'carbs' | 'fats'): Promise<FoodItem[]>;
  getFoodById(id: number): Promise<FoodItem | null>;
  getUserPreferences(): Promise<UserFoodPreferences | null>;
  addFavorite(foodId: number): Promise<void>;
  removeFavorite(foodId: number): Promise<void>;
  addBlacklist(foodId: number): Promise<void>;
  removeBlacklist(foodId: number): Promise<void>;
  recordSwap(originalFoodId: number, newFoodId: number, mealName: string): Promise<void>;
}

export const createFoodCatalogService = (userId: string): FoodCatalogService => {
  const getAllFoods = async (): Promise<FoodItem[]> => {
    const { data, error } = await supabase
      .from('food_catalog')
      .select('*')
      .order('category')
      .order('name');

    if (error) {
      console.error('Error fetching foods:', error);
      return [];
    }

    return data || [];
  };

  const getFoodsByCategory = async (category: 'protein' | 'carbs' | 'fats'): Promise<FoodItem[]> => {
    const { data, error } = await supabase
      .from('food_catalog')
      .select('*')
      .eq('category', category)
      .order('name');

    if (error) {
      console.error('Error fetching foods by category:', error);
      return [];
    }

    return data || [];
  };

  const searchFoods = async (query: string, category?: 'protein' | 'carbs' | 'fats'): Promise<FoodItem[]> => {
    let queryBuilder = supabase
      .from('food_catalog')
      .select('*')
      .ilike('name', `%${query}%`);

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    queryBuilder = queryBuilder.order('name');

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error searching foods:', error);
      return [];
    }

    return data || [];
  };

  const getFoodById = async (id: number): Promise<FoodItem | null> => {
    const { data, error } = await supabase
      .from('food_catalog')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching food by id:', error);
      return null;
    }

    return data;
  };

  const getUserPreferences = async (): Promise<UserFoodPreferences | null> => {
    const { data, error } = await supabase
      .from('user_food_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          user_id: userId,
          favorited_foods: [],
          blacklisted_foods: [],
          recent_swaps: [],
        };
      }
      console.error('Error fetching user food preferences:', error);
      return null;
    }

    return data;
  };

  const ensurePreferencesExist = async (): Promise<void> => {
    const existing = await getUserPreferences();
    if (!existing || existing.favorited_foods === null) {
      const { error } = await supabase
        .from('user_food_preferences')
        .upsert({
          user_id: userId,
          favorited_foods: [],
          blacklisted_foods: [],
          recent_swaps: [],
        });

      if (error) {
        console.error('Error creating user preferences:', error);
      }
    }
  };

  const addFavorite = async (foodId: number): Promise<void> => {
    await ensurePreferencesExist();
    
    const prefs = await getUserPreferences();
    if (!prefs) return;

    const favorited = [...(prefs.favorited_foods || [])];
    if (!favorited.includes(foodId)) {
      favorited.push(foodId);

      const { error } = await supabase
        .from('user_food_preferences')
        .update({ favorited_foods: favorited })
        .eq('user_id', userId);

      if (error) {
        console.error('Error adding favorite:', error);
        throw error;
      }
    }
  };

  const removeFavorite = async (foodId: number): Promise<void> => {
    const prefs = await getUserPreferences();
    if (!prefs) return;

    const favorited = (prefs.favorited_foods || []).filter(id => id !== foodId);

    const { error } = await supabase
      .from('user_food_preferences')
      .update({ favorited_foods: favorited })
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  };

  const addBlacklist = async (foodId: number): Promise<void> => {
    await ensurePreferencesExist();
    
    const prefs = await getUserPreferences();
    if (!prefs) return;

    const blacklisted = [...(prefs.blacklisted_foods || [])];
    if (!blacklisted.includes(foodId)) {
      blacklisted.push(foodId);

      const { error } = await supabase
        .from('user_food_preferences')
        .update({ blacklisted_foods: blacklisted })
        .eq('user_id', userId);

      if (error) {
        console.error('Error adding to blacklist:', error);
        throw error;
      }
    }
  };

  const removeBlacklist = async (foodId: number): Promise<void> => {
    const prefs = await getUserPreferences();
    if (!prefs) return;

    const blacklisted = (prefs.blacklisted_foods || []).filter(id => id !== foodId);

    const { error } = await supabase
      .from('user_food_preferences')
      .update({ blacklisted_foods: blacklisted })
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing from blacklist:', error);
      throw error;
    }
  };

  const recordSwap = async (originalFoodId: number, newFoodId: number, mealName: string): Promise<void> => {
    await ensurePreferencesExist();
    
    const prefs = await getUserPreferences();
    if (!prefs) return;

    const swapRecord: SwapRecord = {
      original_food_id: originalFoodId,
      new_food_id: newFoodId,
      timestamp: new Date().toISOString(),
      meal_name: mealName,
    };

    const recentSwaps = [...(prefs.recent_swaps || []), swapRecord].slice(-20);

    const { error } = await supabase
      .from('user_food_preferences')
      .update({ recent_swaps: recentSwaps })
      .eq('user_id', userId);

    if (error) {
      console.error('Error recording swap:', error);
      throw error;
    }
  };

  return {
    getAllFoods,
    getFoodsByCategory,
    searchFoods,
    getFoodById,
    getUserPreferences,
    addFavorite,
    removeFavorite,
    addBlacklist,
    removeBlacklist,
    recordSwap,
  };
};
