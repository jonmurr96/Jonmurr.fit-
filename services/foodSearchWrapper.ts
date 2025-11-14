/**
 * Food Search Wrapper
 * 
 * Provides backward-compatible interface for food searching.
 * Uses local indexed search when available, falls back to live USDA API.
 */

import { searchFoodIndex, isIndexPopulated, IndexedFood } from './foodSearchService';
import { searchUSDAFoods as liveSearchUSDA, SimplifiedFood, USDASearchResult, convertToSimplifiedFood } from './usdaFoodService';

/**
 * Convert indexed food to SimplifiedFood format for compatibility
 */
function convertIndexedToSimplified(indexedFood: IndexedFood): SimplifiedFood {
  // Map 'other' category to best-fit macro (protein/carbs/fats) based on nutritional values
  let category: 'protein' | 'carbs' | 'fats' = 'protein';
  
  if (indexedFood.category === 'protein' || indexedFood.category === 'carbs' || indexedFood.category === 'fats') {
    category = indexedFood.category as 'protein' | 'carbs' | 'fats';
  } else {
    // For 'other' category, determine by macro dominance
    const protein = Number(indexedFood.protein);
    const carbs = Number(indexedFood.carbs);
    const fat = Number(indexedFood.fat);
    
    if (carbs > protein && carbs > fat) {
      category = 'carbs';
    } else if (fat > protein && fat > carbs) {
      category = 'fats';
    } else {
      category = 'protein';
    }
  }
  
  return {
    id: indexedFood.fdc_id,
    name: indexedFood.name,
    calories: Number(indexedFood.calories),
    protein: Number(indexedFood.protein),
    carbs: Number(indexedFood.carbs),
    fat: Number(indexedFood.fat),
    servingSize: Number(indexedFood.serving_size),
    servingUnit: indexedFood.serving_unit,
    category,
    source: 'usda',
    dataType: indexedFood.data_type,
    // Aliases for compatibility
    protein_g: Number(indexedFood.protein),
    carbs_g: Number(indexedFood.carbs),
    fat_g: Number(indexedFood.fat),
    serving_size: Number(indexedFood.serving_size),
    serving_unit: indexedFood.serving_unit,
  };
}

/**
 * Search for foods - uses local index if populated, otherwise falls back to live API
 * Also falls back to live API if local index returns no results (handles ingestion gaps)
 * 
 * @param query - Search term
 * @param pageSize - Number of results (default 25)
 * @returns Array of SimplifiedFood results
 */
export async function searchUSDAFoods(query: string, pageSize: number = 25): Promise<SimplifiedFood[]> {
  // Check if local index is populated
  const hasIndex = await isIndexPopulated();
  
  if (hasIndex) {
    console.log('🔍 Using local food index for search:', query);
    
    // Search local index
    const results = await searchFoodIndex(query, undefined, pageSize);
    
    // If index returned results, use them
    if (results.length > 0) {
      const simplified = results.map(convertIndexedToSimplified);
      console.log('✅ Local search returned', simplified.length, 'results');
      return simplified;
    }
    
    // If index returned 0 results, fallback to live API (handles ingestion gaps)
    console.log('⚠️ Local index returned 0 results, falling back to live USDA API');
    const liveResults = await liveSearchUSDA(query, pageSize);
    return liveResults.map(convertToSimplifiedFood);
  } else {
    console.log('⚠️ Local index not populated, using live USDA API');
    
    // Fallback to live API
    const results = await liveSearchUSDA(query, pageSize);
    return results.map(convertToSimplifiedFood);
  }
}

/**
 * Search foods by category - uses local index if available
 * Falls back to live API if local index returns 0 results
 */
export async function searchFoodsByCategory(
  query: string,
  category: 'protein' | 'carbs' | 'fats',
  pageSize: number = 50
): Promise<SimplifiedFood[]> {
  const hasIndex = await isIndexPopulated();
  
  if (hasIndex) {
    console.log('🔍 Using local food index for category search:', category, query);
    
    const results = await searchFoodIndex(query, category, pageSize);
    
    if (results.length > 0) {
      return results.map(convertIndexedToSimplified);
    }
    
    // Fallback to live API if no results
    console.log('⚠️ Local index returned 0 results, falling back to live USDA API');
    const liveResults = await liveSearchUSDA(query, pageSize);
    const simplified = liveResults.map(convertToSimplifiedFood);
    return simplified.filter(food => food.category === category);
  } else {
    console.log('⚠️ Falling back to live USDA API for category search');
    
    const results = await liveSearchUSDA(query, pageSize);
    const simplified = results.map(convertToSimplifiedFood);
    return simplified.filter(food => food.category === category);
  }
}
