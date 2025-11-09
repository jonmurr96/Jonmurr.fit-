-- Migration: Enhanced Gamification System v2
-- Adds support for 100-level system, loot, expanded challenges, and analytics

-- 1. Create User Gamification Profile Table
CREATE TABLE IF NOT EXISTS user_gamification_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL DEFAULT 'default_user',
  numeric_level INTEGER DEFAULT 1 CHECK (numeric_level >= 1 AND numeric_level <= 100),
  rank_title TEXT DEFAULT 'Newbie' CHECK (rank_title IN ('Newbie', 'Rookie', 'Unit', 'Gym Rat', 'Gym Addict', 'Bodybuilder')),
  total_xp INTEGER DEFAULT 0,
  xp_multiplier NUMERIC DEFAULT 1.0,
  perks_unlocked JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Loot Inventory Table
CREATE TABLE IF NOT EXISTS loot_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  loot_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tip', 'exercise', 'theme', 'xp_boost', 'mystery')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  icon TEXT NOT NULL,
  value JSONB,
  unlocked_on DATE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, loot_id)
);

-- 3. Create Challenge Progress Tracking Table (for historical data)
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  challenge_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  progress INTEGER DEFAULT 0,
  completed_on DATE,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add columns to existing gamification_state table (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='gamification_state' AND column_name='level_up_count') THEN
    ALTER TABLE gamification_state ADD COLUMN level_up_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='gamification_state' AND column_name='last_level_up') THEN
    ALTER TABLE gamification_state ADD COLUMN last_level_up TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='gamification_state' AND column_name='total_xp_earned') THEN
    ALTER TABLE gamification_state ADD COLUMN total_xp_earned INTEGER DEFAULT 0;
  END IF;
END $$;

-- 5. Add columns to earned_badges table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='earned_badges' AND column_name='rank_when_earned') THEN
    ALTER TABLE earned_badges ADD COLUMN rank_when_earned TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='earned_badges' AND column_name='level_when_earned') THEN
    ALTER TABLE earned_badges ADD COLUMN level_when_earned INTEGER;
  END IF;
END $$;

-- 6. Create AI Usage Tracking Table (for AI-related badges and XP)
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  usage_type TEXT NOT NULL CHECK (usage_type IN ('workout_plan', 'meal_plan', 'coaching')),
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create XP Transactions Log (for analytics and debugging)
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source TEXT, -- e.g., 'workout', 'meal', 'water', 'challenge', 'streak_bonus', 'loot'
  multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loot_inventory_user ON loot_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_week ON challenge_progress(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_date ON xp_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(user_id, source);

-- 9. Add comments
COMMENT ON TABLE user_gamification_profile IS 'Extended gamification profile with 100-level system and perks';
COMMENT ON TABLE loot_inventory IS 'Tracks unlocked loot items (tips, exercises, themes, XP boosts)';
COMMENT ON TABLE challenge_progress IS 'Historical record of challenge completions for analytics';
COMMENT ON TABLE ai_usage_log IS 'Tracks AI feature usage for badges and XP rewards';
COMMENT ON TABLE xp_transactions IS 'Audit log of all XP gains for analytics and debugging';

-- 10. Insert default gamification profile if it doesn't exist
INSERT INTO user_gamification_profile (user_id, numeric_level, rank_title, total_xp)
VALUES ('default_user', 1, 'Newbie', 0)
ON CONFLICT (user_id) DO NOTHING;

-- 11. Migration: Sync existing XP to user_gamification_profile and calculate level/rank
-- This converts existing gamification_state XP into the new level system
-- XP Formula: totalXP = 1.99 * (level ^ 2.2)

-- Function to calculate numeric level from XP
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  level INTEGER := 1;
  required_xp INTEGER;
BEGIN
  -- Loop through levels 1-100 to find the highest level achievable with given XP
  FOR i IN 1..100 LOOP
    required_xp := FLOOR(1.99 * POW(i, 2.2));
    IF xp_amount >= required_xp THEN
      level := i;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  RETURN level;
END;
$$ LANGUAGE plpgsql;

-- Function to get rank title from numeric level
CREATE OR REPLACE FUNCTION get_rank_from_level(level INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF level >= 1 AND level <= 10 THEN RETURN 'Newbie';
  ELSIF level >= 11 AND level <= 25 THEN RETURN 'Rookie';
  ELSIF level >= 26 AND level <= 40 THEN RETURN 'Unit';
  ELSIF level >= 41 AND level <= 60 THEN RETURN 'Gym Rat';
  ELSIF level >= 61 AND level <= 80 THEN RETURN 'Gym Addict';
  ELSIF level >= 81 AND level <= 100 THEN RETURN 'Bodybuilder';
  ELSE RETURN 'Newbie';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update ALL user_gamification_profile rows with calculated values from gamification_state
UPDATE user_gamification_profile ugp
SET 
  total_xp = COALESCE(gs.xp, 0),
  numeric_level = calculate_level_from_xp(COALESCE(gs.xp, 0)),
  rank_title = get_rank_from_level(calculate_level_from_xp(COALESCE(gs.xp, 0))),
  updated_at = NOW()
FROM gamification_state gs
WHERE ugp.user_id = gs.user_id;

-- Drop the temporary functions after migration
DROP FUNCTION IF EXISTS calculate_level_from_xp(INTEGER);
DROP FUNCTION IF EXISTS get_rank_from_level(INTEGER);
