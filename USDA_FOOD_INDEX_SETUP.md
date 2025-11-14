# USDA Food Search Index Setup Guide

## Overview

This guide explains how to set up the custom USDA food search index that dramatically improves search accuracy by using a local database index instead of live API searches.

## Why We Built This

**The Problem:**
The live USDA FoodData Central API uses basic keyword matching which returns poor results:
- Searching "white rice" returned "Adobo with rice" (compound dish)
- Searching "chicken breast cooked" returned raw chicken (ignores cooking method)
- Searching "captain crunch" returned random branded foods

**The Solution:**
We built a local food index that:
- Stores 1500+ preprocessed USDA foods in Supabase
- Uses PostgreSQL full-text search + trigram similarity matching
- Implements custom scoring (exact match, cooking method, canonicality)
- Falls back to live API if local index returns no results

## Setup Steps

### 1. Apply Database Migration

First, apply the database migration to create the `usda_foods_index` table:

1. Open Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)
2. Open `supabase/migration_usda_foods_index.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** to execute

This creates:
- `usda_foods_index` table with full-text and trigram indexes
- `usda_ingestion_runs` audit table
- `search_foods_trigram()` PostgreSQL function

### 2. Set Environment Variables

The ingestion script runs in Node.js (not the browser), so it needs environment variables without the `VITE_` prefix.

**Option A: Create `.env` file in project root**
```bash
USDA_API_KEY=your_usda_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Option B: Use Replit Secrets**
The script will automatically try both `VITE_*` and plain names, so if your secrets are already set in Replit, it should work.

### 3. Run the Ingestion Script

The ingestion script bulk-fetches foods from USDA and populates the local index.

```bash
npm run seed:usda
```

**What it does:**
- Searches USDA API for ~165 keywords across categories (proteins, carbs, fats, cereals, etc.)
- Fetches 20 results per keyword = ~3,300 total results
- Applies smart filtering (removes baby food, flour, soups, but keeps cereals and branded staples)
- Detects preparation methods (raw, cooked, fried, etc.)
- Tags canonical foods (Foundation/SR Legacy, simple descriptions)
- Deduplicates by normalized name
- Inserts 1000-1500 unique foods into `usda_foods_index`

**Expected output:**
```
🚀 Starting USDA Foods Index Ingestion...
📋 Processing 165 seed keywords across 7 categories

[100%] Searching: grape nuts
✅ Fetching complete!
   Total fetched: 3300
   Filtered out: 1200
   Unique foods: 1450

💾 Inserting foods into Supabase...
   Inserted: 1450 / 1450

✅ Database insertion complete!
⏱️  Total duration: 45.2s
🎉 Ingestion complete!

📊 Category Breakdown:
   protein   : 450
   carbs     : 520
   fats      : 280
   other     : 200
```

### 3. Verify the Index

The application automatically detects if the index is populated:

1. Open the Manual Meal Plan Builder or Food Swap Modal
2. Type "white rice" in the search box
3. Check browser console for log messages:
   - `🔍 Using local food index for search: white rice` ✅ (index working)
   - `⚠️ Local index not populated, using live USDA API` ⚠️ (needs seeding)

## Architecture

### Data Type Normalization

The ingestion script normalizes USDA API data_type values to match database constraints:

**Supported Mappings:**
- `Foundation` → `Foundation`
- `SR Legacy` → `SR Legacy`
- `Branded` → `Branded`
- `Survey (FNDDS)` → `Survey`
- `Survey` → `Survey`

**Unsupported Types (Skipped):**
- `Experimental Foods` - Logged as warning and skipped
- `Sample Food` - Logged as warning and skipped
- Unknown types - Logged as warning and skipped

This ensures only high-quality, production-ready foods are indexed while maintaining data integrity.

### Database Schema

**usda_foods_index table:**
- `fdc_id` (INTEGER) - Primary key from USDA
- `name` (TEXT) - Food description
- `normalized_name` (TEXT) - Lowercase, no punctuation (for deduplication)
- `category` (TEXT) - protein/carbs/fats/other
- `calories`, `protein`, `carbs`, `fat` (NUMERIC) - Per 100g
- `serving_size`, `serving_unit` (NUMERIC, TEXT)
- `data_type` (TEXT) - Foundation/SR Legacy/Branded/Survey
- `is_canonical` (BOOLEAN) - Simple, high-quality foods
- `preparation_method` (TEXT) - raw/cooked/fried/baked/etc.
- `search_terms` (TEXT[]) - Tokenized search keywords
- `search_vector` (tsvector) - Auto-generated full-text search index

**Indexes:**
- GIN index on `search_vector` (full-text search)
- GIN index on `normalized_name` (trigram similarity)
- B-tree indexes on `category`, `is_canonical`, `data_type`

### Search Flow

```
User types "white rice"
    ↓
searchUSDAFoods() (foodSearchWrapper.ts)
    ↓
Check: Is index populated? (>100 foods)
    ↓
    YES → searchFoodIndex() (foodSearchService.ts)
         ↓
         PostgreSQL full-text search (tsvector)
         ↓
         Results found?
         ↓
         YES → Score and rank results → Return
         NO  → Fallback to live USDA API
    ↓
    NO  → Live USDA API search
```

### Scoring Algorithm

Foods are ranked using a multi-factor scoring system:

| Factor | Points | Example |
|--------|--------|---------|
| Exact match | +50 | "white rice" exactly matches "White rice" |
| Exact phrase in name | +25 | "white rice" found in "Rice, white, long-grain" |
| All query terms found | +25 | "white", "rice" both present |
| Per-term matches | +10 each | 2 terms matched = +20 |
| First word match | +30 | "rice" is first word |
| Preparation method match | +20 | Query "cooked" matches tagged "cooked" |
| Canonical food | +15 | Foundation/SR Legacy, simple name |
| Foundation data type | +20 | Highest quality USDA data |
| SR Legacy data type | +10 | Legacy standard reference |
| Branded data type | -5 | Lower priority |
| Short/simple name | +10 | ≤35 characters |
| Few segments | +5 | ≤2 comma-separated parts |
| Complex description | -3 per segment | >2 segments = penalty |

**Example scoring:**
```
Query: "white rice cooked"

Result 1: "Rice, white, long-grain, cooked" (Foundation)
- All terms found: +25
- First word "rice": +30
- Preparation "cooked": +20
- Canonical: +15
- Foundation: +20
- Short name: +10
TOTAL: 120 points → Rank #1

Result 2: "Adobo with rice" (Branded)
- "rice" term found: +10
- Branded: -5
- Long description: -9 (3 segments)
TOTAL: -4 points → Rank #15
```

## Fallback Behavior

The system has intelligent fallback logic:

1. **Index not populated** → Always use live USDA API
2. **Index populated, query returns results** → Use local index
3. **Index populated, query returns 0 results** → Fallback to live USDA API

This ensures:
- You get results even if the index has gaps
- Queries for uncommon foods (not in our 1500-food index) still work
- The system degrades gracefully

## Maintenance

### Re-run Ingestion

To refresh the index with latest USDA data:

```bash
npm run seed:usda
```

Existing foods are updated (upsert by `fdc_id`), new foods are inserted.

### Check Ingestion History

Query the audit table to see past ingestion runs:

```sql
SELECT 
  run_date,
  foods_fetched,
  foods_inserted,
  duration_seconds,
  status
FROM usda_ingestion_runs
ORDER BY run_date DESC
LIMIT 10;
```

### Customize Seed Keywords

Edit `scripts/usda_seed_loader.ts` and modify the `SEED_KEYWORDS` object:

```typescript
const SEED_KEYWORDS = {
  proteins: ['chicken breast', 'salmon', ...],
  carbs: ['white rice', 'quinoa', ...],
  // Add your categories here
};
```

Then re-run `npm run seed:usda`.

## Benefits

✅ **Faster searches** - No network latency, local database queries <100ms
✅ **Better relevance** - Custom scoring algorithm understands cooking methods, food simplicity
✅ **Consistent results** - Same query always returns same results (deterministic)
✅ **Offline-capable** - Works without USDA API (as long as index is populated)
✅ **Smart fallback** - Automatically uses live API for edge cases

## Troubleshooting

**Q: Searches still return poor results**
A: Run `npm run seed:usda` to populate the index. Check console logs for `🔍 Using local food index`.

**Q: Ingestion script fails**
A: Verify `VITE_USDA_API_KEY` is set in environment. Check USDA API rate limits (1000 req/hour).

**Q: Database migration fails**
A: Ensure `pg_trgm` extension is available in Supabase (it's enabled by default).

**Q: Foods missing from index**
A: Add keywords to `SEED_KEYWORDS` in `scripts/usda_seed_loader.ts` and re-run ingestion.

## Files

- `supabase/migration_usda_foods_index.sql` - Database schema
- `scripts/usda_seed_loader.ts` - Ingestion script
- `services/foodSearchService.ts` - Local index search with scoring
- `services/foodSearchWrapper.ts` - Backward-compatible wrapper with fallback
- `services/usdaFoodService.ts` - Original live USDA API search (fallback)
