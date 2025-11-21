-- Muscle Tracking System Migration
-- Creates workout_muscle_engagement table to track which muscle groups were worked in each workout
-- This enables muscle recovery heatmap visualization and smart workout recommendations

-- Create workout_muscle_engagement table
CREATE TABLE IF NOT EXISTS workout_muscle_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT auth.uid()::text,
    
    -- Workout reference (can link to workout_history or be standalone)
    workout_id UUID,
    workout_name TEXT,
    workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Muscle group tracking
    muscle_group TEXT NOT NULL,
    intensity DECIMAL(3,1) DEFAULT 5.0 CHECK (intensity >= 0 AND intensity <= 10),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique muscle group per workout per day
    UNIQUE(user_id, workout_id, muscle_group)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_muscle_engagement_user_muscle_date 
ON workout_muscle_engagement(user_id, muscle_group, workout_date DESC);

CREATE INDEX IF NOT EXISTS idx_muscle_engagement_user_date 
ON workout_muscle_engagement(user_id, workout_date DESC);

CREATE INDEX IF NOT EXISTS idx_muscle_engagement_workout 
ON workout_muscle_engagement(workout_id);

-- Enable Row Level Security
ALTER TABLE workout_muscle_engagement ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own muscle engagement data
CREATE POLICY muscle_engagement_user_policy ON workout_muscle_engagement
    FOR ALL
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_muscle_engagement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_muscle_engagement_timestamp_trigger
    BEFORE UPDATE ON workout_muscle_engagement
    FOR EACH ROW
    EXECUTE FUNCTION update_muscle_engagement_timestamp();

-- Helper function to track muscle engagement
CREATE OR REPLACE FUNCTION track_muscle_engagement(
    p_user_id TEXT,
    p_workout_id UUID,
    p_workout_name TEXT,
    p_workout_date DATE,
    p_muscle_groups TEXT[], -- Array of muscle group names
    p_intensities DECIMAL[] DEFAULT NULL -- Optional array of intensities (1-10 scale)
)
RETURNS SETOF workout_muscle_engagement AS $$
DECLARE
    i INTEGER;
    muscle_result workout_muscle_engagement;
BEGIN
    -- Security: Validate user_id matches authenticated user
    IF p_user_id != auth.uid()::text THEN
        RAISE EXCEPTION 'Unauthorized: Cannot track muscle engagement for other users';
    END IF;
    
    -- Loop through each muscle group
    FOR i IN 1..array_length(p_muscle_groups, 1)
    LOOP
        INSERT INTO workout_muscle_engagement (
            user_id,
            workout_id,
            workout_name,
            workout_date,
            muscle_group,
            intensity
        )
        VALUES (
            p_user_id,
            p_workout_id,
            p_workout_name,
            p_workout_date,
            p_muscle_groups[i],
            CASE 
                WHEN p_intensities IS NOT NULL AND i <= array_length(p_intensities, 1) 
                THEN p_intensities[i]
                ELSE 5.0
            END
        )
        ON CONFLICT (user_id, workout_id, muscle_group)
        DO UPDATE SET
            intensity = EXCLUDED.intensity,
            workout_name = EXCLUDED.workout_name,
            workout_date = EXCLUDED.workout_date,
            updated_at = NOW()
        RETURNING * INTO muscle_result;
        
        RETURN NEXT muscle_result;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get last trained date for each muscle group
CREATE OR REPLACE FUNCTION get_muscle_recovery_status(
    p_user_id TEXT,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    muscle_group TEXT,
    last_trained_date DATE,
    days_since_trained INTEGER,
    total_workouts INTEGER,
    avg_intensity DECIMAL
) AS $$
BEGIN
    -- Security: Validate user_id matches authenticated user
    IF p_user_id != auth.uid()::text THEN
        RAISE EXCEPTION 'Unauthorized: Cannot access muscle recovery status for other users';
    END IF;
    
    RETURN QUERY
    SELECT 
        wme.muscle_group,
        MAX(wme.workout_date) as last_trained_date,
        EXTRACT(DAY FROM (CURRENT_DATE - MAX(wme.workout_date)))::INTEGER as days_since_trained,
        COUNT(*)::INTEGER as total_workouts,
        ROUND(AVG(wme.intensity), 1) as avg_intensity
    FROM workout_muscle_engagement wme
    WHERE wme.user_id = p_user_id
      AND wme.workout_date >= CURRENT_DATE - p_days_back
    GROUP BY wme.muscle_group
    ORDER BY last_trained_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get fresh muscle groups (ready to train)
CREATE OR REPLACE FUNCTION get_fresh_muscles(
    p_user_id TEXT,
    p_recovery_hours INTEGER DEFAULT 48
)
RETURNS TABLE (
    muscle_group TEXT,
    last_trained_date DATE,
    hours_since_trained DECIMAL
) AS $$
BEGIN
    -- Security: Validate user_id matches authenticated user
    IF p_user_id != auth.uid()::text THEN
        RAISE EXCEPTION 'Unauthorized: Cannot access fresh muscles for other users';
    END IF;
    
    RETURN QUERY
    SELECT DISTINCT
        wme.muscle_group,
        MAX(wme.workout_date) as last_trained_date,
        ROUND(EXTRACT(EPOCH FROM (NOW() - MAX(wme.workout_date || ' 00:00:00'::TIMESTAMP))) / 3600, 1) as hours_since_trained
    FROM workout_muscle_engagement wme
    WHERE wme.user_id = p_user_id
    GROUP BY wme.muscle_group
    HAVING EXTRACT(EPOCH FROM (NOW() - MAX(wme.workout_date || ' 00:00:00'::TIMESTAMP))) / 3600 >= p_recovery_hours
    ORDER BY hours_since_trained DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
