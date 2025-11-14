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
 * - Canonical food bonus: +30 (increased from +15)
 * - Data type priority: Foundation +30, SR Legacy +15
 * - Short/simple name: +10
 * - Compound food penalties: -20 to -40
 * - Incompatible term filtering: -100 (essentially removes from results)
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
  
  // === INCOMPATIBLE TERM FILTERING ===
  // Detect semantically incompatible foods (e.g., "bratwurst" when searching "ground chicken")
  const incompatibleTerms = detectIncompatibleTerms(nameLower, queryTerms);
  if (incompatibleTerms) {
    score -= 100; // Essentially remove from results
  }
  
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
  // Boost simple, canonical foods more aggressively
  if (food.is_canonical) {
    score += 30; // Increased from +15
  }
  
  // === DATA TYPE PRIORITY ===
  // Prefer Foundation and SR Legacy over Branded
  if (food.data_type === 'Foundation') {
    score += 30; // Increased from +20
  } else if (food.data_type === 'SR Legacy') {
    score += 15; // Increased from +10
  } else if (food.data_type === 'Branded') {
    score -= 5; // Slight penalty for branded foods
  }
  
  // === COMPOUND FOOD PENALTIES ===
  // Penalize foods with multiple ingredients or complex preparations
  const compoundPenalty = detectCompoundFood(nameLower);
  score -= compoundPenalty;
  
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
 * Detect compound foods (medleys, mixes, casseroles, etc.)
 * Returns penalty score (0 = simple food, higher = more complex)
 */
function detectCompoundFood(nameLower: string): number {
  let penalty = 0;
  
  // Strong indicators of compound/prepared dishes
  const strongCompoundIndicators = [
    'medley', 'mix', 'mixture', 'combo', 'combination',
    'casserole', 'stew', 'soup', 'salad', 'bowl',
    'platter', 'plate', 'meal', 'dish', 'entree'
  ];
  
  // Moderate indicators
  const moderateCompoundIndicators = [
    'with', 'and', 'plus', 'topped', 'stuffed',
    'filled', 'layered', 'wrapped', 'covered'
  ];
  
  // Weak indicators
  const weakCompoundIndicators = [
    'style', 'flavored', 'seasoned', 'marinated'
  ];
  
  // Check for strong compound indicators
  for (const indicator of strongCompoundIndicators) {
    if (nameLower.includes(indicator)) {
      penalty += 40; // Heavy penalty
      break; // Only apply once
    }
  }
  
  // Check for moderate indicators
  for (const indicator of moderateCompoundIndicators) {
    if (nameLower.includes(indicator)) {
      penalty += 20;
      break;
    }
  }
  
  // Check for weak indicators
  for (const indicator of weakCompoundIndicators) {
    if (nameLower.includes(indicator)) {
      penalty += 10;
      break;
    }
  }
  
  return penalty;
}

/**
 * Detect incompatible terms between query and food name
 * Returns true if food contains terms that conflict with the query
 */
function detectIncompatibleTerms(nameLower: string, queryTerms: string[]): boolean {
  // Protein type conflicts
  const proteinTypes = {
    'chicken': ['beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'tofu'],
    'beef': ['chicken', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp'],
    'pork': ['chicken', 'beef', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp'],
    'turkey': ['chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp'],
    'fish': ['chicken', 'beef', 'pork', 'lamb', 'turkey'],
    'salmon': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'tuna'],
    'tuna': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'salmon'],
    'shrimp': ['chicken', 'beef', 'pork', 'lamb', 'turkey'],
    'tofu': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish'],
  };
  
  // Check if query contains a protein type
  for (const [queryProtein, incompatibleProteins] of Object.entries(proteinTypes)) {
    if (queryTerms.includes(queryProtein)) {
      // Check if food name contains an incompatible protein
      for (const incompatible of incompatibleProteins) {
        if (nameLower.includes(incompatible)) {
          // Exception: allow if it's a comparison or option (e.g., "or beef")
          if (!nameLower.includes('or ' + incompatible) && !nameLower.includes(incompatible + ' or')) {
            return true;
          }
        }
      }
    }
  }
  
  // Specific product conflicts (e.g., "bratwurst" vs "ground")
  const specificConflicts: Record<string, string[]> = {
    'ground': ['bratwurst', 'sausage', 'hot dog', 'patty', 'burger', 'meatball', 'nugget'],
    'breast': ['thigh', 'leg', 'wing', 'drumstick'],
    'white': ['brown', 'black', 'red', 'wild'],
    'whole': ['skim', 'low fat', '2%', '1%'],
  };
  
  for (const [queryTerm, conflictTerms] of Object.entries(specificConflicts)) {
    if (queryTerms.includes(queryTerm)) {
      for (const conflict of conflictTerms) {
        if (nameLower.includes(conflict)) {
          return true;
        }
      }
    }
  }
  
  return false;
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
