# Database Migration Order

Apply these migrations in Supabase Dashboard → SQL Editor in this exact order:

## ✅ Step 1: Base Schema (Already Applied)
You should have already applied `schema.sql` which creates 22 base tables.

## ✅ Step 2: Users/Auth Table
**File:** `migration_users_auth.sql`

This creates:
- `users` table for user profiles
- Trigger to auto-create profiles on signup
- RLS policies for users table

**How to Apply:**
1. Open Supabase Dashboard → SQL Editor → New Query
2. Copy contents of `supabase/migration_users_auth.sql`
3. Paste and click Run
4. ✅ Should see "Success. No rows returned"

---

## ✅ Step 3: Enhanced Gamification (v2)
**File:** `migration_gamification_v2.sql`

This creates:
- `user_gamification_profile` - 100-level system
- `loot_inventory` - Rewards and loot items
- `challenge_progress` - Historical challenge data
- `ai_usage_log` - AI feature usage tracking
- `xp_transactions` - XP audit log

**How to Apply:**
1. Supabase Dashboard → SQL Editor → New Query
2. Copy contents of `supabase/migration_gamification_v2.sql`
3. Paste and click Run
4. ✅ Should see "Success"

---

## ✅ Step 4: Heat Map System
**File:** `migration_heat_map.sql`

This creates:
- `daily_activity_summary` - Daily activity tracking for heat map

**How to Apply:**
1. Supabase Dashboard → SQL Editor → New Query
2. Copy contents of `supabase/migration_heat_map.sql`
3. Paste and click Run
4. ✅ Should see "Success"

---

## ✅ Step 5: Badge Tiers (Optional)
**File:** `migration_badge_tiers.sql`

This updates badge data (Bronze, Silver, Gold, Diamond tiers).

**How to Apply:**
1. Supabase Dashboard → SQL Editor → New Query
2. Copy contents of `supabase/migration_badge_tiers.sql`
3. Paste and click Run
4. ✅ Should see "Success"

---

## ⚠️ Step 6: Row-Level Security Policies (FINAL STEP)
**File:** `migration_rls_policies.sql`

**IMPORTANT**: Only apply this AFTER all the above migrations are complete!

This adds RLS policies to ALL 28 tables for multi-user data isolation.

**How to Apply:**
1. Supabase Dashboard → SQL Editor → New Query
2. Copy contents of `supabase/migration_rls_policies.sql`
3. Paste and click Run
4. ✅ Should see "Success. No rows returned"

---

## Verification

After applying all migrations, verify with this query:

```sql
-- Check all tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Count policies per table (should be 4 per table)
SELECT tablename, COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename 
ORDER BY tablename;
```

---

## Current Status

Based on the error you got, you need to apply migrations in this order:
1. ✅ `schema.sql` - Already applied
2. ⚠️ `migration_users_auth.sql` - **Apply this first**
3. ⚠️ `migration_gamification_v2.sql` - **Then this**
4. ⚠️ `migration_heat_map.sql` - **Then this**
5. ⚠️ `migration_badge_tiers.sql` - **Optional**
6. ⚠️ `migration_rls_policies.sql` - **Apply LAST**
