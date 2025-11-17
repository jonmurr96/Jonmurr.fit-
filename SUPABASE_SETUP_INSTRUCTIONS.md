# 🔧 Fix Food Search - Apply Database Migration

## The Problem
Your food search backend is working perfectly (32 results returned!), but Supabase doesn't have the required tables yet. The error logs show:
```
Could not find the table 'public.food_catalog' in the schema cache
Could not find the table 'public.user_food_preferences' in the schema cache
```

## The Solution - 3 Simple Steps

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Apply the Migration
1. Open the file: `supabase/APPLY_FOOD_SYSTEM.sql`
2. **Copy the entire contents** (it's a complete, tested migration)
3. **Paste it into the Supabase SQL Editor**
4. Click **"Run"** (or press Cmd/Ctrl + Enter)

You should see:
```
Success. No rows returned
```

This creates:
- ✅ `usda_foods_index` table (for searchable USDA foods)
- ✅ `food_catalog` table (60 curated quick picks - already seeded!)
- ✅ `user_food_preferences` table (for favorites/hidden foods)
- ✅ All security policies, indexes, and search functions

### Step 3: Seed USDA Foods (Optional but Recommended)
Back in Replit, run this command to add 1,632 USDA foods:
```bash
npm run seed:usda
```

This takes 2-3 minutes and populates the searchable food database.

## What You'll Get

**Instant Results:**
- 60 curated "Quick Pick" foods (already seeded in the migration!)
- Search for "chicken", "rice", "avocado" - instant results
- Category filtering (protein/carbs/fats)

**After Running Seed (Optional):**
- 1,632+ searchable USDA foods
- Advanced search with preparation methods
- More variety in meal planning

## Verify It Worked

After applying the migration, refresh your app and:
1. Open Manual Meal Plan Builder
2. You should immediately see 60 Quick Pick foods
3. Search for "chicken" - you'll see results!
4. (After seeding) Search results will expand to 1,600+ foods

## Need Help?

If you see any errors:
1. Make sure you're in the correct Supabase project
2. Copy the exact error message
3. The migration is safe to re-run (it uses `IF NOT EXISTS`)

---

**Ready?** Open `supabase/APPLY_FOOD_SYSTEM.sql`, copy it, and paste it into your Supabase SQL Editor. Click Run. Done! 🚀
