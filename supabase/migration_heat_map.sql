-- Heat Map System Migration
-- Creates daily_activity_summary table to track daily user activity for heat map visualization

-- Create daily_activity_summary table
CREATE TABLE IF NOT EXISTS daily_activity_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Activity tracking
    workout_logged BOOLEAN DEFAULT FALSE,
    meals_logged INTEGER DEFAULT 0,
    water_intake_oz DECIMAL(5,1) DEFAULT 0,
    goal_water_oz DECIMAL(5,1) DEFAULT 0,
    
    -- Goal tracking
    hit_macros BOOLEAN DEFAULT FALSE,
    hit_protein_goal BOOLEAN DEFAULT FALSE,
    
    -- Manual overrides
    is_rest_day BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one row per user per day
    UNIQUE(user_id, date)
);

-- Create index for fast lookups by user and date range
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date 
ON daily_activity_summary(user_id, date DESC);

-- Create index for querying by month
CREATE INDEX IF NOT EXISTS idx_daily_activity_month 
ON daily_activity_summary(user_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));

-- Enable Row Level Security
ALTER TABLE daily_activity_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own activity summaries
CREATE POLICY daily_activity_user_policy ON daily_activity_summary
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_activity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_daily_activity_timestamp_trigger
    BEFORE UPDATE ON daily_activity_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_activity_timestamp();

-- Helper function to upsert daily activity
CREATE OR REPLACE FUNCTION upsert_daily_activity(
    p_user_id UUID,
    p_date DATE,
    p_workout_logged BOOLEAN DEFAULT NULL,
    p_meals_logged INTEGER DEFAULT NULL,
    p_water_intake_oz DECIMAL DEFAULT NULL,
    p_goal_water_oz DECIMAL DEFAULT NULL,
    p_hit_macros BOOLEAN DEFAULT NULL,
    p_hit_protein_goal BOOLEAN DEFAULT NULL,
    p_is_rest_day BOOLEAN DEFAULT NULL
)
RETURNS daily_activity_summary AS $$
DECLARE
    result daily_activity_summary;
BEGIN
    INSERT INTO daily_activity_summary (
        user_id, 
        date,
        workout_logged,
        meals_logged,
        water_intake_oz,
        goal_water_oz,
        hit_macros,
        hit_protein_goal,
        is_rest_day
    )
    VALUES (
        p_user_id,
        p_date,
        COALESCE(p_workout_logged, FALSE),
        COALESCE(p_meals_logged, 0),
        COALESCE(p_water_intake_oz, 0),
        COALESCE(p_goal_water_oz, 0),
        COALESCE(p_hit_macros, FALSE),
        COALESCE(p_hit_protein_goal, FALSE),
        COALESCE(p_is_rest_day, FALSE)
    )
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        workout_logged = COALESCE(p_workout_logged, daily_activity_summary.workout_logged),
        meals_logged = COALESCE(p_meals_logged, daily_activity_summary.meals_logged),
        water_intake_oz = COALESCE(p_water_intake_oz, daily_activity_summary.water_intake_oz),
        goal_water_oz = COALESCE(p_goal_water_oz, daily_activity_summary.goal_water_oz),
        hit_macros = COALESCE(p_hit_macros, daily_activity_summary.hit_macros),
        hit_protein_goal = COALESCE(p_hit_protein_goal, daily_activity_summary.hit_protein_goal),
        is_rest_day = COALESCE(p_is_rest_day, daily_activity_summary.is_rest_day),
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
