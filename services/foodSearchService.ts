/**
 * Food Search Service
 * 
 * Searches the local USDA foods index with hybrid PostgreSQL full-text + trigram search
 * and custom scoring for accurate food matching.
 */

import { supabase } from './supabaseClient';

export interface IndexedFood {
  fdc_id: number;
  name: string;
  normalized_name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: number;
  serving_unit: string;
  data_type: string;
  is_canonical: boolean;
  preparation_method: string | null;
  search_terms: string[];
}

export interface FoodSearchResult extends IndexedFood {
  relevance_score: number;
}

/**
 * Search local USDA foods index with advanced ranking
 * 
 * @param query - Search term (e.g., "white rice cooked", "chicken breast raw")
 * @param category - Optional category filter ('protein', 'carbs', 'fats')
 * @param limit - Max results to return (default 25)
 */
export async function searchFoodIndex(
  query: string,
  category?: 'protein' | 'carbs' | 'fats',
  limit: number = 25
): Promise<FoodSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const queryLower = query.toLowerCase().trim();
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 0);
    
    // Execute hybrid search query
    let dbQuery = supabase
      .from('usda_foods_index')
      .select('*');
    
    // Apply category filter if specified
    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }
    
    // Use full-text search for initial filtering
    // Pass natural language query directly - websearch type handles AND logic
    dbQuery = dbQuery.textSearch('search_vector', queryLower, {
      type: 'websearch',
      config: 'english'
    });
    
    // Fetch results (more than needed for scoring)
    dbQuery = dbQuery.limit(Math.min(limit * 3, 200));
    
    const { data, error } = await dbQuery;
    
    if (error) {
      console.error('❌ Food search error:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      // Fallback: try trigram similarity search if full-text returns nothing
      return await trigramFallbackSearch(queryLower, category, limit);
    }
    
    // Score and rank results
    const scoredResults = data.map(food => ({
      ...food,
      relevance_score: calculateSearchScore(food, query, queryTerms)
    }));
    
    // Sort by relevance score (descending)
    scoredResults.sort((a, b) => b.relevance_score - a.relevance_score);
    
    // Return top results
    return scoredResults.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Food search error:', error);
    return [];
  }
}

/**
 * Fallback trigram similarity search when full-text returns no results
 */
async function trigramFallbackSearch(
  query: string,
  category?: string,
  limit: number = 25
): Promise<FoodSearchResult[]> {
  try {
    // Use PostgreSQL trigram similarity (requires pg_trgm extension)
    const { data, error } = await supabase.rpc('search_foods_trigram', {
      search_query: query,
      search_category: category || null,
      max_results: limit
    });
    
    if (error) {
      console.warn('⚠️ Trigram search not available:', error.message);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Trigram fallback error:', error);
    return [];
  }
}

/**
 * Calculate relevance score using multi-factor algorithm
 * 
 * Scoring factors:
 * - Exact name match: +50
 * - All query terms present: +25
 * - Per-term matches: +10 each
 * - First word match: +30
 * - Preparation method match: +20
 * - Canonical food bonus: +15
 * - Data type priority: Foundation +20, SR Legacy +10
 * - Short/simple name: +10
 */
function calculateSearchScore(
  food: IndexedFood,
  originalQuery: string,
  queryTerms: string[]
): number {
  const nameLower = food.name.toLowerCase();
  const normalizedName = food.normalized_name;
  const queryLower = originalQuery.toLowerCase();
  
  let score = 0;
  
  // === EXACT MATCH BOOST ===
  // Exact match on normalized name
  if (normalizedName === queryLower.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()) {
    score += 50;
  }
  
  // Exact phrase match anywhere in name
  if (nameLower.includes(queryLower)) {
    score += 25;
  }
  
  // === TERM COVERAGE ===
  // All query terms found
  const allTermsFound = queryTerms.every(term => normalizedName.includes(term));
  if (allTermsFound) {
    score += 25;
  }
  
  // Per-term matches
  const matchingTerms = queryTerms.filter(term => normalizedName.includes(term)).length;
  score += matchingTerms * 10;
  
  // === POSITION MATCHING ===
  // First word of food name matches first word of query
  const nameFirstWord = normalizedName.split(/\s+/)[0];
  const queryFirstWord = queryTerms[0];
  if (nameFirstWord === queryFirstWord) {
    score += 30;
  }
  
  // === PREPARATION METHOD MATCHING ===
  // If query contains a preparation method and food has it tagged
  if (food.preparation_method) {
    const prepMethod = food.preparation_method.toLowerCase();
    if (queryLower.includes(prepMethod)) {
      score += 20;
    }
  }
  
  // === CANONICALITY BONUS ===
  if (food.is_canonical) {
    score += 15;
  }
  
  // === DATA TYPE PRIORITY ===
  if (food.data_type === 'Foundation') {
    score += 20;
  } else if (food.data_type === 'SR Legacy') {
    score += 10;
  } else if (food.data_type === 'Branded') {
    score -= 5; // Slight penalty for branded foods
  }
  
  // === SIMPLICITY BONUS ===
  // Short, simple names are likely more canonical
  if (food.name.length <= 35) {
    score += 10;
  }
  
  // Few comma segments
  const segments = food.name.split(',').length;
  if (segments <= 2) {
    score += 5;
  } else {
    score -= (segments - 2) * 3; // Penalty for complex descriptions
  }
  
  return Math.max(0, score);
}

/**
 * Get foods by exact FDC ID
 */
export async function getFoodByFdcId(fdcId: number): Promise<IndexedFood | null> {
  try {
    const { data, error } = await supabase
      .from('usda_foods_index')
      .select('*')
      .eq('fdc_id', fdcId)
      .single();
    
    if (error) {
      console.error('❌ Error fetching food by ID:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching food by ID:', error);
    return null;
  }
}

/**
 * Get random foods by category (for suggestions)
 */
export async function getRandomFoodsByCategory(
  category: 'protein' | 'carbs' | 'fats',
  limit: number = 10
): Promise<IndexedFood[]> {
  try {
    // Prioritize canonical foods for suggestions
    const { data, error } = await supabase
      .from('usda_foods_index')
      .select('*')
      .eq('category', category)
      .eq('is_canonical', true)
      .limit(limit * 3);
    
    if (error || !data || data.length === 0) {
      return [];
    }
    
    // Shuffle and return subset
    const shuffled = data.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Error getting random foods:', error);
    return [];
  }
}

/**
 * Check if the index has been populated
 */
export async function isIndexPopulated(): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('usda_foods_index')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error checking index status:', error);
      return false;
    }
    
    return (count || 0) > 100; // Consider populated if >100 foods
  } catch (error) {
    console.error('❌ Error checking index status:', error);
    return false;
  }
}
