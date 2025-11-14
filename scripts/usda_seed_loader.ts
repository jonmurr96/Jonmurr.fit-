/**
 * USDA Foods Index Seed Loader
 * 
 * Bulk ingests USDA foods using targeted keyword searches to build a local
 * search index with ~1500 high-quality, canonical foods.
 * 
 * Usage: npx tsx scripts/usda_seed_loader.ts
 */

import { createClient } from '@supabase/supabase-js';

const USDA_API_KEY = process.env.VITE_USDA_API_KEY || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Seed keywords organized by category for comprehensive coverage
 */
const SEED_KEYWORDS = {
  proteins: [
    'chicken breast', 'chicken thigh', 'turkey', 'beef', 'pork', 'salmon',
    'tuna', 'cod', 'tilapia', 'shrimp', 'eggs', 'egg whites', 'tofu',
    'tempeh', 'greek yogurt', 'cottage cheese', 'protein powder', 'whey',
    'ground beef', 'ground turkey', 'steak', 'pork chop', 'bacon', 'sausage',
    'lamb', 'duck', 'venison', 'bison', 'sardines', 'mackerel', 'halibut',
    'mahi mahi', 'scallops', 'crab', 'lobster', 'oysters', 'mussels'
  ],
  carbs: [
    'white rice', 'brown rice', 'quinoa', 'oats', 'oatmeal', 'bread',
    'whole wheat bread', 'sweet potato', 'potato', 'pasta', 'rice',
    'couscous', 'bulgur', 'barley', 'farro', 'buckwheat', 'millet',
    'banana', 'apple', 'orange', 'berries', 'strawberries', 'blueberries',
    'grapes', 'watermelon', 'mango', 'pineapple', 'kiwi', 'peach', 'pear',
    'plum', 'cherries', 'dates', 'figs', 'raisins', 'prunes',
    'beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans',
    'pinto beans', 'navy beans', 'lima beans', 'split peas'
  ],
  fats: [
    'avocado', 'olive oil', 'coconut oil', 'butter', 'ghee', 'nuts',
    'almonds', 'walnuts', 'cashews', 'pecans', 'macadamia nuts',
    'peanuts', 'peanut butter', 'almond butter', 'tahini', 'seeds',
    'chia seeds', 'flax seeds', 'pumpkin seeds', 'sunflower seeds',
    'sesame seeds', 'hemp seeds', 'cheese', 'cheddar cheese',
    'mozzarella', 'parmesan', 'feta', 'cream cheese', 'heavy cream',
    'sour cream', 'mayo', 'mayonnaise'
  ],
  vegetables: [
    'broccoli', 'spinach', 'kale', 'lettuce', 'romaine', 'arugula',
    'cabbage', 'brussels sprouts', 'cauliflower', 'carrots', 'celery',
    'cucumber', 'bell pepper', 'tomato', 'onion', 'garlic', 'ginger',
    'asparagus', 'zucchini', 'squash', 'eggplant', 'mushrooms',
    'green beans', 'peas', 'corn', 'bok choy', 'swiss chard', 'collard greens'
  ],
  dairy: [
    'milk', 'whole milk', 'skim milk', '2% milk', 'almond milk',
    'soy milk', 'oat milk', 'coconut milk', 'yogurt', 'kefir',
    'ricotta', 'goat cheese', 'blue cheese', 'brie', 'gouda'
  ],
  miscellaneous: [
    'honey', 'maple syrup', 'agave', 'dark chocolate', 'cocoa powder',
    'protein bar', 'rice cakes', 'hummus', 'salsa', 'guacamole'
  ]
};

/**
 * Hard ban keywords - completely filter out these results
 */
const HARD_BAN_KEYWORDS = [
  'babyfood', 'baby food', 'infant', 'toddler', 'formula',
  'snack', 'cracker', 'chip', 'candy', 'dessert', 'pastry', 'cookie', 'brownie', 'muffin', 'cake', 'pie',
  'flour', 'starch', 'mix', 'batter', 'breaded', 'coating', 'breading',
  'soup', 'broth', 'gravy', 'sauce', 'dressing', 'marinade', 'syrup',
  'supplement', 'beverage', 'cocktail', 'smoothie', 'powder', 'shake', 'pudding',
  'pickled', 'preserved', 'dehydrated', 'sweetened',
  'microwave', 'entree', 'meal', 'kit',
  'cereal', 'tortilla', 'wrap', 'noodle', 'ramen', 'pizza', 'waffle', 'pancake', 'biscuit'
];

/**
 * Preparation method keywords for tagging
 */
const PREPARATION_METHODS = [
  'raw', 'cooked', 'fried', 'baked', 'grilled', 'roasted', 'steamed',
  'boiled', 'braised', 'sauteed', 'poached', 'broiled', 'smoked',
  'dried', 'fresh', 'frozen', 'canned'
];

interface USDAFoodResult {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  foodNutrients: any[];
}

/**
 * Normalize description for deduplication
 */
function normalizeForDedup(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if description should be filtered out
 */
function shouldFilter(description: string, query: string): boolean {
  const normalized = normalizeForDedup(description);
  const queryLower = query.toLowerCase();
  
  for (const keyword of HARD_BAN_KEYWORDS) {
    if (queryLower.includes(keyword)) continue;
    if (normalized.includes(keyword)) return true;
  }
  
  return false;
}

/**
 * Detect preparation method from description
 */
function detectPreparationMethod(description: string): string | null {
  const normalized = description.toLowerCase();
  
  for (const method of PREPARATION_METHODS) {
    if (normalized.includes(method)) {
      return method;
    }
  }
  
  return null;
}

/**
 * Determine if food is canonical (simple, Foundation/SR Legacy)
 */
function isCanonical(description: string, dataType: string): boolean {
  // Must be Foundation or SR Legacy
  if (dataType !== 'Foundation' && dataType !== 'SR Legacy') {
    return false;
  }
  
  // Must be relatively short and simple
  if (description.length > 45) {
    return false;
  }
  
  // Count comma-separated segments
  const segments = description.split(',').length;
  if (segments > 3) {
    return false;
  }
  
  return true;
}

/**
 * Determine category based on macro dominance
 */
function determineCategory(protein: number, carbs: number, fat: number): string {
  if (protein > carbs && protein > fat && protein > 5) {
    return 'protein';
  } else if (carbs > protein && carbs > fat && carbs > 5) {
    return 'carbs';
  } else if (fat > protein && fat > carbs && fat > 3) {
    return 'fats';
  }
  return 'other';
}

/**
 * Extract nutrient value by ID
 */
function extractNutrient(nutrients: any[], nutrientId: number): number {
  if (!nutrients || !Array.isArray(nutrients)) return 0;
  const nutrient = nutrients.find((n: any) => 
    n.nutrientId === nutrientId || n.nutrientNumber === nutrientId.toString()
  );
  return nutrient?.value || 0;
}

/**
 * Generate search terms array from description
 */
function generateSearchTerms(description: string): string[] {
  const normalized = normalizeForDedup(description);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  // Return unique words
  return Array.from(new Set(words));
}

/**
 * Search USDA API for a specific keyword
 */
async function searchUSDA(keyword: string, pageSize: number = 50): Promise<USDAFoodResult[]> {
  try {
    const url = `${BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(keyword)}&pageSize=${pageSize}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ USDA API error for "${keyword}":`, response.status);
      return [];
    }
    
    const data = await response.json();
    return data.foods || [];
  } catch (error) {
    console.error(`❌ Error searching USDA for "${keyword}":`, error);
    return [];
  }
}

/**
 * Main ingestion process
 */
async function ingestUSDAFoods() {
  console.log('🚀 Starting USDA Foods Index Ingestion...\n');
  
  if (!USDA_API_KEY) {
    console.error('❌ VITE_USDA_API_KEY not found in environment');
    return;
  }
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase credentials not found in environment');
    return;
  }
  
  const startTime = Date.now();
  const allKeywords = Object.values(SEED_KEYWORDS).flat();
  const foodsMap = new Map<number, any>(); // fdcId -> food data
  const seenDescriptions = new Set<string>(); // For deduplication
  
  let totalFetched = 0;
  let totalFiltered = 0;
  
  console.log(`📋 Processing ${allKeywords.length} seed keywords across ${Object.keys(SEED_KEYWORDS).length} categories\n`);
  
  // Process keywords in batches to avoid rate limiting
  for (let i = 0; i < allKeywords.length; i++) {
    const keyword = allKeywords[i];
    const progress = ((i + 1) / allKeywords.length * 100).toFixed(1);
    
    process.stdout.write(`\r[${progress}%] Searching: ${keyword.padEnd(25)} `);
    
    const results = await searchUSDA(keyword, 20); // 20 results per keyword
    totalFetched += results.length;
    
    for (const food of results) {
      // Skip if already seen this FDC ID
      if (foodsMap.has(food.fdcId)) continue;
      
      // Skip if hard-banned
      if (shouldFilter(food.description, keyword)) {
        totalFiltered++;
        continue;
      }
      
      // Skip duplicates based on normalized description
      const normalizedDesc = normalizeForDedup(food.description);
      const firstFiveWords = normalizedDesc.split(/\s+/).slice(0, 5).join(' ');
      if (seenDescriptions.has(firstFiveWords)) {
        continue;
      }
      seenDescriptions.add(firstFiveWords);
      
      // Extract nutrition
      const calories = extractNutrient(food.foodNutrients, 1008);
      const protein = extractNutrient(food.foodNutrients, 1003);
      const carbs = extractNutrient(food.foodNutrients, 1005);
      const fat = extractNutrient(food.foodNutrients, 1004);
      
      // Skip if missing critical nutrition data
      if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
        continue;
      }
      
      // Determine metadata
      const category = determineCategory(protein, carbs, fat);
      const preparationMethod = detectPreparationMethod(food.description);
      const canonical = isCanonical(food.description, food.dataType);
      const searchTerms = generateSearchTerms(food.description);
      
      foodsMap.set(food.fdcId, {
        fdc_id: food.fdcId,
        name: food.description,
        normalized_name: normalizedDesc,
        category,
        calories,
        protein,
        carbs,
        fat,
        serving_size: 100,
        serving_unit: 'g',
        data_type: food.dataType,
        is_canonical: canonical,
        preparation_method: preparationMethod,
        search_terms: searchTerms,
      });
    }
    
    // Rate limiting: delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n\n✅ Fetching complete!`);
  console.log(`   Total fetched: ${totalFetched}`);
  console.log(`   Filtered out: ${totalFiltered}`);
  console.log(`   Unique foods: ${foodsMap.size}\n`);
  
  // Insert into database
  console.log('💾 Inserting foods into Supabase...\n');
  
  const foodsArray = Array.from(foodsMap.values());
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  // Batch insert (500 at a time to avoid payload limits)
  const batchSize = 500;
  for (let i = 0; i < foodsArray.length; i += batchSize) {
    const batch = foodsArray.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('usda_foods_index')
        .upsert(batch, { onConflict: 'fdc_id' });
      
      if (error) {
        console.error(`❌ Batch insert error:`, error);
        errors += batch.length;
      } else {
        inserted += batch.length;
        process.stdout.write(`\r   Inserted: ${inserted} / ${foodsArray.length}`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error:`, err);
      errors += batch.length;
    }
  }
  
  console.log(`\n\n✅ Database insertion complete!`);
  console.log(`   Successfully inserted/updated: ${inserted}`);
  console.log(`   Errors: ${errors}\n`);
  
  // Log ingestion run
  const durationSeconds = (Date.now() - startTime) / 1000;
  await supabase.from('usda_ingestion_runs').insert({
    foods_fetched: totalFetched,
    foods_inserted: inserted,
    foods_updated: 0,
    keywords_used: allKeywords,
    duration_seconds: durationSeconds,
    status: errors > 0 ? 'partial' : 'success',
    error_log: errors > 0 ? `${errors} insertion errors` : null,
  });
  
  console.log(`⏱️  Total duration: ${durationSeconds.toFixed(1)}s`);
  console.log(`🎉 Ingestion complete!\n`);
  
  // Print category breakdown
  const categoryBreakdown = foodsArray.reduce((acc, food) => {
    acc[food.category] = (acc[food.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 Category Breakdown:');
  Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .forEach(([cat, count]) => {
      console.log(`   ${cat.padEnd(10)}: ${count}`);
    });
}

// Run ingestion
ingestUSDAFoods().catch(console.error);
