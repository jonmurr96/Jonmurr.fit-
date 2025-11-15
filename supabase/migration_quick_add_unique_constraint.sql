-- Migration: Add unique constraint to prevent duplicate Quick Add meals per user
-- This prevents users from having duplicate Quick Add meals with the same name

BEGIN;

-- Step 1: Enable CASCADE DELETE first (before deleting duplicates)
-- This ensures child items are automatically deleted with parent meals
-- NOTE: The FK column is 'quick_meal_id', not 'meal_id'
ALTER TABLE quick_add_meal_items
  DROP CONSTRAINT IF EXISTS quick_add_meal_items_quick_meal_id_fkey;

ALTER TABLE quick_add_meal_items
  ADD CONSTRAINT quick_add_meal_items_quick_meal_id_fkey
    FOREIGN KEY (quick_meal_id)
    REFERENCES quick_add_meals(id)
    ON DELETE CASCADE;

-- Step 2: Delete existing duplicates (keep the oldest entry per user/name combination)
-- Cascade will automatically delete associated items
DELETE FROM quick_add_meals
WHERE id NOT IN (
  SELECT MIN(id)
  FROM quick_add_meals
  GROUP BY user_id, LOWER(name)
);

-- Step 3: Add unique constraint on (user_id, lower(name))
-- This prevents future duplicates case-insensitively
CREATE UNIQUE INDEX IF NOT EXISTS idx_quick_add_meals_unique_name
  ON quick_add_meals (user_id, LOWER(name));

COMMIT;

-- Verification queries (commented out - uncomment to run manually):
-- Check for remaining duplicates:
-- SELECT user_id, name, COUNT(*) as count
-- FROM quick_add_meals
-- GROUP BY user_id, name
-- HAVING COUNT(*) > 1;

-- View all Quick Add meals:
-- SELECT user_id, name, COUNT(*) as item_count
-- FROM quick_add_meals qam
-- LEFT JOIN quick_add_meal_items qami ON qam.id = qami.meal_id
-- GROUP BY qam.id, user_id, name
-- ORDER BY user_id, name;
