-- ============================================
-- COMPLETE FOOD SYSTEM MIGRATION
-- Apply this in your Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 1. USDA FOODS INDEX TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS usda_foods_index (
  fdc_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('protein', 'carbs', 'fats', 'other')),
  
  -- Nutritional data (per 100g)
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  
  -- Serving information
  serving_size NUMERIC NOT NULL DEFAULT 100,
  serving_unit TEXT NOT NULL DEFAULT 'g',
  
  -- Metadata for search ranking
  data_type TEXT NOT NULL CHECK (data_type IN ('Foundation', 'SR Legacy', 'Branded', 'Survey')),
  is_canonical BOOLEAN DEFAULT false,
  preparation_method TEXT,
  
  -- Search optimization
  search_terms TEXT[] NOT NULL DEFAULT '{}',
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(preparation_method, ''))
  ) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_usda_foods_search_vector 
  ON usda_foods_index USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_usda_foods_normalized_name_trgm 
  ON usda_foods_index USING GIN (normalized_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_usda_foods_category 
  ON usda_foods_index (category);

CREATE INDEX IF NOT EXISTS idx_usda_foods_is_canonical 
  ON usda_foods_index (is_canonical);

CREATE INDEX IF NOT EXISTS idx_usda_foods_data_type 
  ON usda_foods_index (data_type);

-- ============================================
-- 2. FOOD CATALOG TABLE (Quick Picks)
-- ============================================
CREATE TABLE IF NOT EXISTS food_catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('protein', 'carbs', 'fats')),
    calories DECIMAL(7,2) NOT NULL,
    protein_g DECIMAL(6,2) NOT NULL DEFAULT 0,
    carbs_g DECIMAL(6,2) NOT NULL DEFAULT 0,
    fat_g DECIMAL(6,2) NOT NULL DEFAULT 0,
    serving_size DECIMAL(7,2) NOT NULL,
    serving_unit VARCHAR(50) NOT NULL DEFAULT 'g',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_food_catalog_category ON food_catalog(category);
CREATE INDEX IF NOT EXISTS idx_food_catalog_name ON food_catalog(name);
CREATE INDEX IF NOT EXISTS idx_food_catalog_tags ON food_catalog USING GIN(tags);

-- ============================================
-- 3. USER FOOD PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_food_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    favorited_foods INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    blacklisted_foods INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    recent_swaps JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE usda_foods_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_food_preferences ENABLE ROW LEVEL SECURITY;

-- USDA Foods Index: Publicly readable
DROP POLICY IF EXISTS "USDA foods index is publicly readable" ON usda_foods_index;
CREATE POLICY "USDA foods index is publicly readable"
    ON usda_foods_index FOR SELECT
    USING (true);

-- Food Catalog: Publicly readable
DROP POLICY IF EXISTS "Food catalog is publicly readable" ON food_catalog;
CREATE POLICY "Food catalog is publicly readable"
    ON food_catalog FOR SELECT
    USING (true);

-- User Food Preferences: Users can only access their own data
DROP POLICY IF EXISTS "Users can view their own food preferences" ON user_food_preferences;
CREATE POLICY "Users can view their own food preferences"
    ON user_food_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own food preferences" ON user_food_preferences;
CREATE POLICY "Users can insert their own food preferences"
    ON user_food_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own food preferences" ON user_food_preferences;
CREATE POLICY "Users can update their own food preferences"
    ON user_food_preferences FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own food preferences" ON user_food_preferences;
CREATE POLICY "Users can delete their own food preferences"
    ON user_food_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_usda_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_usda_foods_updated_at ON usda_foods_index;
CREATE TRIGGER trigger_usda_foods_updated_at
  BEFORE UPDATE ON usda_foods_index
  FOR EACH ROW
  EXECUTE FUNCTION update_usda_foods_updated_at();

-- Trigram similarity search function
CREATE OR REPLACE FUNCTION search_foods_trigram(
  search_query TEXT,
  search_category TEXT DEFAULT NULL,
  max_results INTEGER DEFAULT 25
)
RETURNS TABLE (
  fdc_id INTEGER,
  name TEXT,
  normalized_name TEXT,
  category TEXT,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  serving_size NUMERIC,
  serving_unit TEXT,
  data_type TEXT,
  is_canonical BOOLEAN,
  preparation_method TEXT,
  search_terms TEXT[],
  relevance_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.fdc_id,
    f.name,
    f.normalized_name,
    f.category,
    f.calories,
    f.protein,
    f.carbs,
    f.fat,
    f.serving_size,
    f.serving_unit,
    f.data_type,
    f.is_canonical,
    f.preparation_method,
    f.search_terms,
    similarity(f.normalized_name, search_query) AS relevance_score
  FROM usda_foods_index f
  WHERE 
    (search_category IS NULL OR f.category = search_category)
    AND similarity(f.normalized_name, search_query) > 0.1
  ORDER BY relevance_score DESC, f.is_canonical DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. SEED CURATED FOOD CATALOG (60 FOODS)
-- ============================================

-- Clear existing data (safe for re-runs)
TRUNCATE food_catalog RESTART IDENTITY CASCADE;

-- PROTEIN SOURCES (20 foods)
INSERT INTO food_catalog (name, category, calories, protein_g, carbs_g, fat_g, serving_size, serving_unit, tags, is_verified) VALUES
('Chicken Breast (Grilled)', 'protein', 165, 31, 0, 3.6, 100, 'g', ARRAY['lean', 'poultry'], true),
('Ground Turkey (93/7)', 'protein', 150, 22, 0, 6, 100, 'g', ARRAY['lean', 'poultry'], true),
('Salmon (Atlantic)', 'protein', 206, 22, 0, 13, 100, 'g', ARRAY['fatty-fish', 'omega-3'], true),
('Tilapia', 'protein', 96, 20, 0, 1.7, 100, 'g', ARRAY['lean', 'white-fish'], true),
('Tuna (Canned in Water)', 'protein', 116, 26, 0, 0.8, 100, 'g', ARRAY['lean', 'canned'], true),
('Eggs (Whole)', 'protein', 155, 13, 1.1, 11, 100, 'g', ARRAY['versatile'], true),
('Egg Whites', 'protein', 52, 11, 0.7, 0.2, 100, 'g', ARRAY['lean'], true),
('Greek Yogurt (Non-Fat)', 'protein', 59, 10, 3.6, 0.4, 100, 'g', ARRAY['dairy', 'low-fat'], true),
('Cottage Cheese (Low-Fat)', 'protein', 72, 12, 2.7, 1, 100, 'g', ARRAY['dairy', 'low-fat'], true),
('Tofu (Firm)', 'protein', 144, 17, 3.5, 8.7, 100, 'g', ARRAY['vegan', 'plant-based'], true),
('Tempeh', 'protein', 193, 19, 9.4, 11, 100, 'g', ARRAY['vegan', 'plant-based', 'fermented'], true),
('Seitan', 'protein', 370, 75, 14, 1.9, 100, 'g', ARRAY['vegan', 'plant-based', 'high-protein'], true),
('Ground Beef (90/10)', 'protein', 176, 20, 0, 10, 100, 'g', ARRAY['red-meat'], true),
('Sirloin Steak', 'protein', 201, 27, 0, 10, 100, 'g', ARRAY['red-meat', 'lean'], true),
('Pork Loin (Lean)', 'protein', 143, 23, 0, 5, 100, 'g', ARRAY['lean', 'pork'], true),
('Protein Powder (Whey)', 'protein', 120, 24, 3, 1.5, 30, 'g', ARRAY['supplement', 'dairy'], true),
('Protein Powder (Vegan)', 'protein', 110, 20, 5, 2, 30, 'g', ARRAY['supplement', 'vegan', 'plant-based'], true),
('Shrimp', 'protein', 99, 24, 0.2, 0.3, 100, 'g', ARRAY['lean', 'seafood'], true),
('Cod', 'protein', 82, 18, 0, 0.7, 100, 'g', ARRAY['lean', 'white-fish'], true),
('Turkey Breast (Sliced)', 'protein', 104, 24, 1, 1, 100, 'g', ARRAY['lean', 'deli'], true);

-- CARB SOURCES (20 foods)
INSERT INTO food_catalog (name, category, calories, protein_g, carbs_g, fat_g, serving_size, serving_unit, tags, is_verified) VALUES
('Brown Rice (Cooked)', 'carbs', 112, 2.6, 24, 0.9, 100, 'g', ARRAY['whole-grain', 'gluten-free'], true),
('White Rice (Cooked)', 'carbs', 130, 2.7, 28, 0.3, 100, 'g', ARRAY['gluten-free'], true),
('Quinoa (Cooked)', 'carbs', 120, 4.4, 21, 1.9, 100, 'g', ARRAY['whole-grain', 'gluten-free', 'complete-protein'], true),
('Sweet Potato (Baked)', 'carbs', 90, 2, 21, 0.2, 100, 'g', ARRAY['root-vegetable', 'gluten-free'], true),
('Oats (Dry)', 'carbs', 389, 17, 66, 7, 100, 'g', ARRAY['whole-grain'], true),
('Whole Wheat Bread', 'carbs', 247, 13, 41, 3.4, 100, 'g', ARRAY['bread', 'whole-grain'], true),
('Sourdough Bread', 'carbs', 289, 9.4, 56, 2.7, 100, 'g', ARRAY['bread', 'fermented'], true),
('Pasta (Whole Wheat, Cooked)', 'carbs', 124, 5.3, 26, 0.5, 100, 'g', ARRAY['whole-grain'], true),
('Pasta (White, Cooked)', 'carbs', 131, 5, 25, 1.1, 100, 'g', ARRAY['refined'], true),
('Banana', 'carbs', 89, 1.1, 23, 0.3, 100, 'g', ARRAY['fruit'], true),
('Apple', 'carbs', 52, 0.3, 14, 0.2, 100, 'g', ARRAY['fruit'], true),
('Blueberries', 'carbs', 57, 0.7, 14, 0.3, 100, 'g', ARRAY['fruit', 'berries'], true),
('Strawberries', 'carbs', 32, 0.7, 7.7, 0.3, 100, 'g', ARRAY['fruit', 'berries'], true),
('Mango', 'carbs', 60, 0.8, 15, 0.4, 100, 'g', ARRAY['fruit', 'tropical'], true),
('Grapes', 'carbs', 69, 0.7, 18, 0.2, 100, 'g', ARRAY['fruit'], true),
('Potato (Baked)', 'carbs', 93, 2.5, 21, 0.1, 100, 'g', ARRAY['root-vegetable'], true),
('Tortilla (Corn)', 'carbs', 218, 5.7, 45, 2.8, 100, 'g', ARRAY['gluten-free'], true),
('Tortilla (Flour)', 'carbs', 304, 8, 50, 8, 100, 'g', ARRAY['refined'], true),
('Rice Cakes', 'carbs', 387, 8, 82, 3, 100, 'g', ARRAY['gluten-free', 'snack'], true),
('Honey', 'carbs', 304, 0.3, 82, 0, 100, 'g', ARRAY['sweetener', 'natural'], true);

-- FAT SOURCES (20 foods)
INSERT INTO food_catalog (name, category, calories, protein_g, carbs_g, fat_g, serving_size, serving_unit, tags, is_verified) VALUES
('Avocado', 'fats', 160, 2, 8.5, 15, 100, 'g', ARRAY['healthy-fat', 'monounsaturated'], true),
('Olive Oil', 'fats', 884, 0, 0, 100, 100, 'ml', ARRAY['healthy-fat', 'monounsaturated', 'cooking'], true),
('Almonds', 'fats', 579, 21, 22, 50, 100, 'g', ARRAY['nuts', 'healthy-fat', 'snack'], true),
('Walnuts', 'fats', 654, 15, 14, 65, 100, 'g', ARRAY['nuts', 'omega-3', 'healthy-fat'], true),
('Cashews', 'fats', 553, 18, 30, 44, 100, 'g', ARRAY['nuts', 'healthy-fat'], true),
('Peanut Butter (Natural)', 'fats', 588, 25, 20, 50, 100, 'g', ARRAY['nut-butter', 'spread'], true),
('Almond Butter', 'fats', 614, 21, 19, 56, 100, 'g', ARRAY['nut-butter', 'spread'], true),
('Coconut Oil', 'fats', 862, 0, 0, 100, 100, 'ml', ARRAY['saturated-fat', 'cooking'], true),
('Chia Seeds', 'fats', 486, 17, 42, 31, 100, 'g', ARRAY['seeds', 'omega-3', 'fiber'], true),
('Flax Seeds (Ground)', 'fats', 534, 18, 29, 42, 100, 'g', ARRAY['seeds', 'omega-3', 'fiber'], true),
('Pumpkin Seeds', 'fats', 559, 30, 14, 49, 100, 'g', ARRAY['seeds', 'healthy-fat', 'snack'], true),
('Sunflower Seeds', 'fats', 584, 21, 20, 51, 100, 'g', ARRAY['seeds', 'healthy-fat', 'snack'], true),
('Dark Chocolate (70%+)', 'fats', 598, 7.8, 46, 43, 100, 'g', ARRAY['treat', 'antioxidants'], true),
('Cheese (Cheddar)', 'fats', 403, 25, 1.3, 33, 100, 'g', ARRAY['dairy', 'high-fat'], true),
('Cheese (Mozzarella)', 'fats', 280, 28, 2.2, 17, 100, 'g', ARRAY['dairy', 'moderate-fat'], true),
('Cream Cheese', 'fats', 342, 6, 5.5, 34, 100, 'g', ARRAY['dairy', 'spread'], true),
('Butter', 'fats', 717, 0.9, 0.1, 81, 100, 'g', ARRAY['dairy', 'saturated-fat', 'cooking'], true),
('Ghee', 'fats', 900, 0, 0, 100, 100, 'g', ARRAY['dairy', 'saturated-fat', 'cooking'], true),
('Pecans', 'fats', 691, 9.2, 14, 72, 100, 'g', ARRAY['nuts', 'healthy-fat'], true),
('Macadamia Nuts', 'fats', 718, 7.9, 14, 76, 100, 'g', ARRAY['nuts', 'high-fat'], true);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next step: Run "npm run seed:usda" locally to populate usda_foods_index with 1,632 foods
