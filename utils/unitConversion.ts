// Unit conversion utilities for food measurements

export type WeightUnit = 'g' | 'oz';
export type VolumeUnit = 'cup' | 'tbsp' | 'tsp' | 'ml';
export type ServingUnit = WeightUnit | VolumeUnit;

export interface ServingSize {
  amount: number;
  unit: ServingUnit;
}

// Conversion constants
const OZ_TO_GRAMS = 28.3495;
const CUP_TO_ML = 236.588;
const TBSP_TO_ML = 14.7868;
const TSP_TO_ML = 4.92892;

// Average food densities (g/ml) for volume-to-weight conversions
// These are approximations and vary by food type
const FOOD_DENSITIES: Record<string, number> = {
  // Liquids (close to water)
  liquid: 1.0,
  milk: 1.03,
  oil: 0.92,
  
  // Semi-solids
  yogurt: 1.04,
  honey: 1.42,
  peanutbutter: 1.08,
  
  // Powders/grains
  flour: 0.59,
  sugar: 0.85,
  rice: 0.77,
  oats: 0.41,
  
  // Default for unknown foods
  default: 0.85,
};

/**
 * Estimate food density based on food description
 * Returns grams per milliliter
 */
function estimateDensity(foodDescription: string): number {
  const desc = foodDescription.toLowerCase();
  
  // Check for specific food types
  if (desc.includes('milk') || desc.includes('cream')) return FOOD_DENSITIES.milk;
  if (desc.includes('oil') || desc.includes('butter')) return FOOD_DENSITIES.oil;
  if (desc.includes('yogurt')) return FOOD_DENSITIES.yogurt;
  if (desc.includes('honey') || desc.includes('syrup')) return FOOD_DENSITIES.honey;
  if (desc.includes('peanut butter') || desc.includes('nut butter')) return FOOD_DENSITIES.peanutbutter;
  if (desc.includes('flour')) return FOOD_DENSITIES.flour;
  if (desc.includes('sugar')) return FOOD_DENSITIES.sugar;
  if (desc.includes('rice')) return FOOD_DENSITIES.rice;
  if (desc.includes('oat')) return FOOD_DENSITIES.oats;
  if (desc.includes('juice') || desc.includes('water') || desc.includes('broth')) return FOOD_DENSITIES.liquid;
  
  return FOOD_DENSITIES.default;
}

/**
 * Convert volume to milliliters
 */
function volumeToMl(amount: number, unit: VolumeUnit): number {
  switch (unit) {
    case 'cup': return amount * CUP_TO_ML;
    case 'tbsp': return amount * TBSP_TO_ML;
    case 'tsp': return amount * TSP_TO_ML;
    case 'ml': return amount;
  }
}

/**
 * Convert weight to grams
 */
function weightToGrams(amount: number, unit: WeightUnit): number {
  switch (unit) {
    case 'g': return amount;
    case 'oz': return amount * OZ_TO_GRAMS;
  }
}

/**
 * Check if unit is volume-based
 */
export function isVolumeUnit(unit: ServingUnit): unit is VolumeUnit {
  return ['cup', 'tbsp', 'tsp', 'ml'].includes(unit);
}

/**
 * Convert any serving size to grams for macro calculations
 * For volume units, uses food description to estimate density
 */
export function convertToGrams(
  serving: ServingSize,
  foodDescription: string
): number {
  if (isVolumeUnit(serving.unit)) {
    const ml = volumeToMl(serving.amount, serving.unit);
    const density = estimateDensity(foodDescription);
    return ml * density;
  } else {
    return weightToGrams(serving.amount, serving.unit);
  }
}

/**
 * Calculate macros for a specific serving size
 * Base macros should be per 100g
 */
export function calculateMacrosForServing(
  baseMacros: { calories: number; protein: number; carbs: number; fat: number },
  serving: ServingSize,
  foodDescription: string
): { calories: number; protein: number; carbs: number; fat: number } {
  const grams = convertToGrams(serving, foodDescription);
  const multiplier = grams / 100;
  
  return {
    calories: Math.round(baseMacros.calories * multiplier),
    protein: Math.round(baseMacros.protein * multiplier * 10) / 10,
    carbs: Math.round(baseMacros.carbs * multiplier * 10) / 10,
    fat: Math.round(baseMacros.fat * multiplier * 10) / 10,
  };
}

/**
 * Get recommended units based on food type
 */
export function getRecommendedUnits(foodDescription: string): {
  primary: ServingUnit;
  alternatives: ServingUnit[];
} {
  const desc = foodDescription.toLowerCase();
  
  // Liquids should use volume
  if (
    desc.includes('milk') ||
    desc.includes('juice') ||
    desc.includes('water') ||
    desc.includes('oil') ||
    desc.includes('broth') ||
    desc.includes('sauce')
  ) {
    return {
      primary: 'cup',
      alternatives: ['ml', 'tbsp', 'g', 'oz'],
    };
  }
  
  // Default to weight for solids
  return {
    primary: 'g',
    alternatives: ['oz', 'cup', 'tbsp'],
  };
}

/**
 * Format serving size for display
 */
export function formatServingSize(serving: ServingSize): string {
  const amount = serving.amount % 1 === 0 
    ? serving.amount.toString() 
    : serving.amount.toFixed(1);
  return `${amount}${serving.unit}`;
}

/**
 * Parse serving size from string (e.g., "150g", "1 cup")
 */
export function parseServingSize(input: string): ServingSize | null {
  const match = input.trim().match(/^([\d.]+)\s*(g|oz|cup|tbsp|tsp|ml)$/i);
  if (!match) return null;
  
  return {
    amount: parseFloat(match[1]),
    unit: match[2].toLowerCase() as ServingUnit,
  };
}
