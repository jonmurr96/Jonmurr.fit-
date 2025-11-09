-- Migration: Badge Tier System
-- Converts earned_badges table to support Bronze → Diamond tier progression
-- Date: November 9, 2025

-- Step 1: Rename table from earned_badges to badge_progress
ALTER TABLE IF EXISTS earned_badges RENAME TO badge_progress;

-- Step 2: Add new tier tracking columns
ALTER TABLE badge_progress 
ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'bronze' CHECK (current_tier IN ('bronze', 'silver', 'gold', 'diamond')),
ADD COLUMN IF NOT EXISTS progress_value INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier_progress_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_tier_awarded_at DATE DEFAULT CURRENT_DATE;

-- Step 3: Backfill existing badges to Bronze tier
UPDATE badge_progress
SET 
  current_tier = 'bronze',
  progress_value = 1, -- They've hit the first threshold
  tier_progress_pct = 0,
  last_tier_awarded_at = COALESCE(earned_on, CURRENT_DATE)
WHERE current_tier IS NULL;

-- Step 4: Update indexes
DROP INDEX IF EXISTS idx_earned_badges_user_badge;
CREATE INDEX idx_badge_progress_user_badge ON badge_progress(user_id, badge_id);
CREATE INDEX idx_badge_progress_tier ON badge_progress(current_tier);

-- Step 5: Add comment for documentation
COMMENT ON TABLE badge_progress IS 'Tracks user badge progression through 4 tiers (Bronze/Silver/Gold/Diamond)';
COMMENT ON COLUMN badge_progress.current_tier IS 'Current tier level: bronze, silver, gold, or diamond';
COMMENT ON COLUMN badge_progress.progress_value IS 'Raw count/metric value toward next tier threshold';
COMMENT ON COLUMN badge_progress.tier_progress_pct IS 'Percentage progress to next tier (0-100)';
COMMENT ON COLUMN badge_progress.last_tier_awarded_at IS 'Date when current tier was unlocked';

-- Step 6: Success message
DO $$
BEGIN
  RAISE NOTICE 'Badge tier migration completed successfully! Existing badges upgraded to Bronze tier.';
END $$;
