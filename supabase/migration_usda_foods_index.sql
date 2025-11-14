-- USDA Foods Index Migration
-- Creates a local search index for USDA foods with full-text and trigram search

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- USDA Foods Index Table
-- Stores bulk-ingested USDA foods with preprocessing for accurate search
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

-- Ingestion audit table
CREATE TABLE IF NOT EXISTS usda_ingestion_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  foods_fetched INTEGER NOT NULL,
  foods_inserted INTEGER NOT NULL,
  foods_updated INTEGER NOT NULL,
  keywords_used TEXT[] NOT NULL,
  duration_seconds NUMERIC,
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  error_log TEXT
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_usda_ingestion_runs_date 
  ON usda_ingestion_runs (run_date DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_usda_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_usda_foods_updated_at
  BEFORE UPDATE ON usda_foods_index
  FOR EACH ROW
  EXECUTE FUNCTION update_usda_foods_updated_at();

-- Trigram similarity search function (fallback when full-text returns no results)
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

-- Comments for documentation
COMMENT ON TABLE usda_foods_index IS 'Local search index for USDA foods with preprocessing for accurate search ranking';
COMMENT ON COLUMN usda_foods_index.normalized_name IS 'Lowercase name without extra spaces for deduplication';
COMMENT ON COLUMN usda_foods_index.is_canonical IS 'True for simple, Foundation/SR Legacy foods (e.g., "Chicken, breast, raw")';
COMMENT ON COLUMN usda_foods_index.preparation_method IS 'Detected cooking method: raw, cooked, fried, baked, etc.';
COMMENT ON COLUMN usda_foods_index.search_terms IS 'Preprocessed search tokens for matching';
COMMENT ON COLUMN usda_foods_index.search_vector IS 'Full-text search vector generated from name and preparation method';
COMMENT ON FUNCTION search_foods_trigram IS 'Fallback trigram similarity search when full-text search returns no results';
