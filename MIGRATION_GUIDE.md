# Gamification v2 Database Migration Guide

## Overview

This migration adds the enhanced gamification system to your Supabase database. It creates new tables and columns to support:

- **100-level progression system** with rank titles (Newbie → Bodybuilder)
- **Loot/rewards system** with mystery chests and unlockable items
- **Enhanced challenge tracking** with historical analytics
- **AI usage logging** for AI-related badges and XP
- **XP transaction audit log** for debugging and analytics

## What This Migration Does

### New Tables Created:
1. **user_gamification_profile** - Extended profile with numeric level, rank title, perks
2. **loot_inventory** - Tracks unlocked loot items (tips, exercises, themes, XP boosts)
3. **challenge_progress** - Historical record of challenge completions
4. **ai_usage_log** - Tracks AI feature usage for badges and XP rewards
5. **xp_transactions** - Audit log of all XP gains

### Updates to Existing Tables:
- **gamification_state** - Adds level_up_count, last_level_up, total_xp_earned
- **earned_badges** - Adds rank_when_earned, level_when_earned

### Automatic Data Migration:
- Converts existing XP to the new 100-level system
- Calculates your current level and rank based on total XP
- Creates performance indexes for faster queries

## How to Apply the Migration

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration
1. Open `supabase/migration_gamification_v2.sql` in this project
2. Copy the **entire contents** (all 171 lines)
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)

### Step 3: Verify Success
You should see output like:
```
Success. No rows returned
```

If you see any errors, check:
- You copied the entire file
- Your database has the original tables (from schema.sql)
- You're using the correct Supabase project

## Testing the Gamification System

After applying the migration, test these features in the app:

### Test 1: XP Triggers
- ✅ **Log a workout** → Should earn 200 XP + see XP toast
- ✅ **Log a meal** → Should earn 30 XP
- ✅ **Track water intake** → Should earn 10 XP per glass
- ✅ **Generate AI workout/meal** → Should earn 75 XP

### Test 2: Level-Up System
- ✅ **Earn enough XP** → Should see level-up modal with new rank
- ✅ **Check XP bar** → Should show correct level, rank title, XP progress
- ✅ **Click XP bar** → Should open Gamification Dashboard

### Test 3: Gamification Dashboard
- ✅ **Overview tab** → Shows level, rank, total XP, streaks, active challenges
- ✅ **Badges tab** → Shows 45+ badges across 8 categories (earned vs locked)
- ✅ **Challenges tab** → Shows weekly/monthly challenges with progress bars
- ✅ **Loot tab** → Shows unlocked items (if you've reached milestone levels)

### Test 4: Badge Unlocking
- ✅ **Complete badge requirements** → Should see badge unlock modal
- ✅ **Badge appears in dashboard** → Marked as "Earned" with unlock date
- ✅ **Badge context tracking** → Badges auto-check on XP triggers

### Test 5: Mystery Chests
- ✅ **Reach milestone level** (5, 10, 15, 20, 25...) → Should unlock mystery chest
- ✅ **Chest contains loot** → Random item with rarity (common/rare/epic/legendary)
- ✅ **Loot appears in inventory** → Visible in Loot tab of dashboard

## Rollback Instructions

If you need to undo the migration:

```sql
-- Remove new tables
DROP TABLE IF EXISTS user_gamification_profile CASCADE;
DROP TABLE IF EXISTS loot_inventory CASCADE;
DROP TABLE IF EXISTS challenge_progress CASCADE;
DROP TABLE IF EXISTS ai_usage_log CASCADE;
DROP TABLE IF EXISTS xp_transactions CASCADE;

-- Remove added columns from existing tables
ALTER TABLE gamification_state 
  DROP COLUMN IF EXISTS level_up_count,
  DROP COLUMN IF EXISTS last_level_up,
  DROP COLUMN IF EXISTS total_xp_earned;

ALTER TABLE earned_badges 
  DROP COLUMN IF EXISTS rank_when_earned,
  DROP COLUMN IF EXISTS level_when_earned;
```

## Troubleshooting

**"Table already exists" error:**
- You may have run the migration before
- Use `DROP TABLE` commands above to remove, then re-run migration

**"Column already exists" error:**
- Migration uses `IF NOT EXISTS` checks, this shouldn't happen
- If it does, the migration is safe to re-run

**No XP/levels showing:**
- Check browser console for errors
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are set correctly
- Refresh the page after migration

**Badge/challenge data missing:**
- These populate dynamically based on your activity
- Log workouts, meals, water to trigger badge checks
- Challenges reset weekly/monthly

## Next Steps

After successful migration:
1. ✅ Test all features listed above
2. ✅ Explore the Gamification Dashboard (click XP bar on Home screen)
3. ✅ Start earning XP and unlocking badges!
4. ✅ Reach level 5 to unlock your first mystery chest

## Questions or Issues?

If you encounter any problems:
- Check Supabase logs in the Dashboard
- Verify all tables were created
- Check browser console for errors
- Review the test plan above to ensure everything works

---

**Ready to level up!** 🎮🏋️
