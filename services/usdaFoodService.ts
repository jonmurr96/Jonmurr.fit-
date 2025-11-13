/**
 * USDA FoodData Central API Service
 * 
 * Free API with 1,000 requests/hour
 * Documentation: https://fdc.nal.usda.gov/api-guide.html
 */

const USDA_API_KEY = (import.meta as any).env?.VITE_USDA_API_KEY || '';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string; // 'Foundation', 'SR Legacy', 'Branded', etc.
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: USDANutrient[];
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDASearchResult {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface SimplifiedFood {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  category: 'protein' | 'carbs' | 'fats';
  source: 'usda';
  dataType: string;
  brandName?: string;
  // Aliases for compatibility with CatalogFoodItem
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  serving_size?: number;
  serving_unit?: string;
}

/**
 * Search for foods in USDA database
 * @param query - Search term (e.g., "chicken breast", "apple")
 * @param pageSize - Number of results (max 200, default 25)
 */
export async function searchUSDAFoods(query: string, pageSize: number = 25): Promise<USDASearchResult[]> {
  if (!USDA_API_KEY) {
    console.error('❌ USDA_API_KEY not found in environment variables');
    return [];
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const url = `${BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Foundation,SR%20Legacy`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('USDA API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    
    if (!data.foods || data.foods.length === 0) {
      return [];
    }

    // Map results with basic nutrition info
    return data.foods.map((food: any) => ({
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      brandOwner: food.brandOwner,
      calories: extractNutrient(food.foodNutrients, 1008), // Energy (kcal)
      protein: extractNutrient(food.foodNutrients, 1003), // Protein
      carbs: extractNutrient(food.foodNutrients, 1005), // Carbs
      fat: extractNutrient(food.foodNutrients, 1004), // Total lipid (fat)
    }));
  } catch (error) {
    console.error('Error searching USDA foods:', error);
    return [];
  }
}

/**
 * Get detailed food information by FDC ID
 */
export async function getUSDAFoodById(fdcId: number): Promise<USDAFood | null> {
  if (!USDA_API_KEY) {
    console.error('❌ USDA_API_KEY not found in environment variables');
    return null;
  }

  try {
    const url = `${BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('USDA API error:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching USDA food:', error);
    return null;
  }
}

/**
 * Convert USDA search result to simplified format for meal planning
 */
export function convertToSimplifiedFood(usdaFood: USDASearchResult): SimplifiedFood {
  // Determine category based on macros (highest macro wins)
  const protein = usdaFood.protein || 0;
  const carbs = usdaFood.carbs || 0;
  const fat = usdaFood.fat || 0;
  
  let category: 'protein' | 'carbs' | 'fats' = 'protein';
  if (carbs > protein && carbs > fat) {
    category = 'carbs';
  } else if (fat > protein && fat > carbs) {
    category = 'fats';
  }

  const food: SimplifiedFood = {
    id: usdaFood.fdcId,
    name: usdaFood.description,
    calories: usdaFood.calories || 0,
    protein: usdaFood.protein || 0,
    carbs: usdaFood.carbs || 0,
    fat: usdaFood.fat || 0,
    servingSize: 100, // USDA data is typically per 100g
    servingUnit: 'g',
    category,
    source: 'usda',
    dataType: usdaFood.dataType,
    brandName: usdaFood.brandOwner,
  };
  
  // Add aliases for compatibility with FoodItem
  food.protein_g = food.protein;
  food.carbs_g = food.carbs;
  food.fat_g = food.fat;
  food.serving_size = food.servingSize;
  food.serving_unit = food.servingUnit;
  
  return food;
}

/**
 * Convert SimplifiedFood (USDA) to FoodItem-compatible format for swapping
 * This ensures USDA foods work properly in the swap system
 */
export function convertSimplifiedToFoodItem(simplified: SimplifiedFood): any {
  return {
    id: simplified.id,
    name: simplified.name,
    category: simplified.category,
    calories: simplified.calories,
    protein_g: simplified.protein,
    carbs_g: simplified.carbs,
    fat_g: simplified.fat,
    serving_size: simplified.servingSize,
    serving_unit: simplified.servingUnit,
    tags: [], // USDA foods don't have tags
    is_verified: true,
    source: 'usda', // Mark as USDA for downstream logic
  };
}

/**
 * Extract nutrient value by nutrient ID
 * Common IDs: 1008=Energy, 1003=Protein, 1005=Carbs, 1004=Fat
 */
function extractNutrient(nutrients: any[], nutrientId: number): number {
  if (!nutrients || !Array.isArray(nutrients)) return 0;
  
  const nutrient = nutrients.find((n: any) => n.nutrientId === nutrientId || n.nutrientNumber === nutrientId.toString());
  return nutrient?.value || 0;
}

/**
 * Search foods by category (filters by macro dominance)
 */
export async function searchFoodsByCategory(
  query: string, 
  category: 'protein' | 'carbs' | 'fats',
  pageSize: number = 50
): Promise<SimplifiedFood[]> {
  const results = await searchUSDAFoods(query, pageSize);
  const simplified = results.map(convertToSimplifiedFood);
  
  // Filter by category
  return simplified.filter(food => food.category === category);
}

/**
 * Get common protein-rich foods
 */
export async function getProteinFoods(query: string = 'chicken'): Promise<SimplifiedFood[]> {
  return searchFoodsByCategory(query, 'protein', 25);
}

/**
 * Get common carb-rich foods
 */
export async function getCarbFoods(query: string = 'rice'): Promise<SimplifiedFood[]> {
  return searchFoodsByCategory(query, 'carbs', 25);
}

/**
 * Get common fat-rich foods
 */
export async function getFatFoods(query: string = 'avocado'): Promise<SimplifiedFood[]> {
  return searchFoodsByCategory(query, 'fats', 25);
}
