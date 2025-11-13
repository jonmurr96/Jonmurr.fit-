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
 * Hard ban keywords - results containing these are blocked entirely
 */
const HARD_BAN_KEYWORDS = [
  'babyfood', 'baby food', 'infant', 'toddler', 'formula',
  'snack', 'cracker', 'chip', 'candy', 'dessert', 'pastry', 'cookie', 'brownie', 'muffin', 'cake', 'pie',
  'flour', 'starch', 'mix', 'batter', 'breaded', 'coating', 'breading',
  'soup', 'broth', 'gravy', 'sauce', 'dressing', 'marinade', 'syrup',
  'supplement', 'beverage', 'cocktail', 'smoothie', 'powder', 'shake', 'shake mix', 'pudding',
  'pickled', 'preserved', 'dehydrated', 'sweetened',
  'microwave', 'entree', 'meal', 'kit',
  'cereal', 'tortilla', 'wrap', 'pasta', 'noodle', 'ramen', 'pizza', 'waffle', 'pancake', 'biscuit'
];

/**
 * Soft penalty keywords - subtracts points but doesn't block
 */
const SOFT_PENALTY_KEYWORDS = [
  'frozen', 'canned', 'seasoned', 'flavored', 'instant', 'prepared', 'ready-to-serve', 'reduced sodium', 'packaged'
];

/**
 * Processed adjectives that reduce canonicality score
 */
const PROCESSED_ADJECTIVES = [
  'smoked', 'breaded', 'seasoned', 'style', 'glazed', 'marinated', 'coated', 'fried', 'crispy'
];

/**
 * Descriptor words to strip when finding head keyword
 */
const DESCRIPTOR_WORDS = [
  'ground', 'boneless', 'skinless', 'raw', 'cooked', 'fresh', 'whole', 'chopped', 'sliced', 'diced'
];

/**
 * Normalize and tokenize description for filtering
 */
function normalizeDescription(description: string): { tokens: string[], normalized: string } {
  const normalized = description.toLowerCase()
    .replace(/[^a-z0-9\s,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const tokens = normalized.split(/[\s,]+/).filter(t => t.length > 0);
  
  return { tokens, normalized };
}

/**
 * Check if description contains hard-ban keywords
 * Special handling: if query itself contains the keyword (e.g., "flour"), don't block
 */
function containsHardBanKeyword(description: string, query: string): boolean {
  const { normalized } = normalizeDescription(description);
  const queryLower = query.toLowerCase();
  
  for (const keyword of HARD_BAN_KEYWORDS) {
    // If query contains this keyword, don't block (user is specifically searching for it)
    if (queryLower.includes(keyword)) {
      continue;
    }
    
    // Check if description contains the banned keyword
    if (normalized.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate relevance score for search result using multi-factor weighted algorithm
 */
function calculateRelevanceScore(description: string, query: string, dataType: string, brandOwner?: string): number {
  const descLower = description.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 0);
  const { tokens, normalized } = normalizeDescription(description);
  
  let score = 0;
  
  // === TERM COVERAGE ===
  // Exact phrase match = +25
  if (normalized.includes(queryLower)) {
    score += 25;
  }
  
  // All query terms found = +15
  const allTermsFound = queryTerms.every(term => normalized.includes(term));
  if (allTermsFound) {
    score += 15;
  }
  
  // Per-term match = +5 each
  const matchingTerms = queryTerms.filter(term => normalized.includes(term)).length;
  score += matchingTerms * 5;
  
  // === HEADWORD ALIGNMENT ===
  // Extract head keyword from query (strip descriptors)
  const headKeyword = queryTerms.find(term => !DESCRIPTOR_WORDS.includes(term)) || queryTerms[0];
  
  // First token matches head keyword = +30
  if (tokens[0] === headKeyword) {
    score += 30;
  }
  // First token after comma matches = +15
  else if (tokens.some((token, i) => i > 0 && tokens[i-1] === '' && token === headKeyword)) {
    score += 15;
  }
  
  // === DATA TYPE PRIORITY ===
  if (dataType === 'Foundation') {
    score += 25;
  } else if (dataType === 'SR Legacy') {
    score += 15;
  } else if (dataType === 'Branded') {
    score -= 20;
  }
  
  // === CANONICALITY & SIMPLICITY ===
  // Short simple description = +10
  if (description.length <= 35) {
    score += 10;
  }
  
  // No brand owner = more canonical
  if (!brandOwner) {
    score += 5;
  }
  
  // Count comma segments
  const segments = description.split(',').length;
  if (segments <= 2) {
    score += 5;
  } else {
    // Penalty for excessive segments
    score -= (segments - 2) * 5;
  }
  
  // === PENALTIES ===
  // Processed adjectives = -15
  const hasProcessedAdjectives = PROCESSED_ADJECTIVES.some(adj => normalized.includes(adj));
  if (hasProcessedAdjectives) {
    score -= 15;
  }
  
  // Soft penalty keywords = -10 each
  for (const keyword of SOFT_PENALTY_KEYWORDS) {
    if (normalized.includes(keyword)) {
      score -= 10;
    }
  }
  
  // Very long description = likely too specific = -10
  if (description.length > 80) {
    score -= 10;
  }
  
  // Floor score at 0
  return Math.max(0, score);
}


/**
 * Remove duplicate/very similar results with improved normalization
 * Handles variations like "Rice, brown, long-grain" vs "Rice, brown, long grain"
 */
function deduplicateResults(results: USDASearchResult[]): USDASearchResult[] {
  const seen = new Set<string>();
  const unique: USDASearchResult[] = [];
  
  for (const food of results) {
    // Normalize by removing punctuation, collapsing whitespace, extracting headword + key modifiers
    const { normalized } = normalizeDescription(food.description);
    const words = normalized.split(/\s+/).slice(0, 5); // First 5 words capture essence
    const key = words.join(' ');
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(food);
    }
  }
  
  return unique;
}

/**
 * Search for foods in USDA database with improved relevance
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
    // Increase page size to get more results for filtering
    const fetchSize = Math.min(pageSize * 3, 200);
    const url = `${BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${fetchSize}&dataType=Foundation,SR%20Legacy`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('USDA API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    
    if (!data.foods || data.foods.length === 0) {
      return [];
    }

    // Step 1: Apply hard ban filtering (blocks results completely)
    const afterHardBan = data.foods.filter((food: any) => 
      !containsHardBanKeyword(food.description, query)
    );

    // Step 2: Map results with nutrition info and calculate relevance score
    const results = afterHardBan.map((food: any) => ({
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      brandOwner: food.brandOwner,
      calories: extractNutrient(food.foodNutrients, 1008), // Energy (kcal)
      protein: extractNutrient(food.foodNutrients, 1003), // Protein
      carbs: extractNutrient(food.foodNutrients, 1005), // Carbs
      fat: extractNutrient(food.foodNutrients, 1004), // Total lipid (fat)
      _relevanceScore: calculateRelevanceScore(food.description, query, food.dataType, food.brandOwner),
    }));

    // Step 3: Sort by relevance score (highest first), then by data type as tie-breaker
    const sorted = results.sort((a: any, b: any) => {
      // Primary sort by score
      if (b._relevanceScore !== a._relevanceScore) {
        return b._relevanceScore - a._relevanceScore;
      }
      
      // Tie-breaker: Foundation > SR Legacy > Branded
      const dataTypePriority: Record<string, number> = {
        'Foundation': 3,
        'SR Legacy': 2,
        'Branded': 1,
      };
      
      const aPriority = dataTypePriority[a.dataType] || 0;
      const bPriority = dataTypePriority[b.dataType] || 0;
      
      return bPriority - aPriority;
    });
    
    // Step 4: Deduplicate similar results
    const deduplicated = deduplicateResults(sorted);
    
    // Step 5: Limit to requested page size
    const limited = deduplicated.slice(0, pageSize);
    
    console.log('🔍 USDA search results:', {
      query,
      totalFromAPI: data.foods.length,
      afterHardBan: afterHardBan.length,
      afterScoring: results.length,
      afterDedup: deduplicated.length,
      returned: limited.length,
      topResults: limited.slice(0, 3).map((f: any) => ({
        desc: f.description,
        score: f._relevanceScore,
        type: f.dataType
      }))
    });
    
    return limited;
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
