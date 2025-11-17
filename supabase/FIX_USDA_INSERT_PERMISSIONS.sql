-- ============================================
-- FIX: Allow inserting USDA foods for seeding
-- Run this in Supabase SQL Editor, then run: npm run seed:usda
-- ============================================

-- Add policy to allow inserts (needed for seeding)
DROP POLICY IF EXISTS "Allow service role to insert USDA foods" ON usda_foods_index;
CREATE POLICY "Allow service role to insert USDA foods"
    ON usda_foods_index FOR INSERT
    WITH CHECK (true);

-- Add policy to allow updates (needed for re-seeding)
DROP POLICY IF EXISTS "Allow service role to update USDA foods" ON usda_foods_index;
CREATE POLICY "Allow service role to update USDA foods"
    ON usda_foods_index FOR UPDATE
    USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'usda_foods_index';
