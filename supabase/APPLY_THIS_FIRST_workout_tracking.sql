-- ========================================
-- COMPLETE WORKOUT TRACKING SETUP
-- Run this ENTIRE file at once in Supabase SQL Editor
-- ========================================

-- STEP 1: Clean up any existing tables
-- ========================================

DROP TRIGGER IF EXISTS update_workout_sessions_timestamp_trigger ON workout_sessions CASCADE;
DROP TRIGGER IF EXISTS update_workout_sets_timestamp_trigger ON workout_sets CASCADE;

DROP FUNCTION IF EXISTS update_workout_timestamp() CASCADE;
DROP FUNCTION IF EXISTS get_previous_workout_sets(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_workout_session(UUID, UUID) CASCADE;

DROP POLICY IF EXISTS workout_sessions_user_policy ON workout_sessions;
DROP POLICY IF EXISTS workout_sets_user_policy ON workout_sets;

DROP TABLE IF EXISTS workout_sets CASCADE;
DROP TABLE IF EXISTS workout_sessions CASCADE;

-- STEP 2: Create fresh tables
-- ========================================

CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID,
    workout_name TEXT NOT NULL,
    workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    notes TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    weight_kg DECIMAL(6, 2),
    reps INTEGER,
    rest_seconds INTEGER,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, exercise_name, set_number)
);

-- STEP 3: Create indexes
-- ========================================

CREATE INDEX idx_workout_sessions_user_date 
    ON workout_sessions(user_id, workout_date DESC);

CREATE INDEX idx_workout_sessions_user_completed 
    ON workout_sessions(user_id, is_completed, workout_date DESC);

CREATE INDEX idx_workout_sets_session 
    ON workout_sets(session_id, exercise_name, set_number);

CREATE INDEX idx_workout_sets_user_exercise 
    ON workout_sets(user_id, exercise_name, completed_at DESC);

-- STEP 4: Enable Row Level Security
-- ========================================

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY workout_sessions_user_policy ON workout_sessions
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY workout_sets_user_policy ON workout_sets
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- STEP 5: Create helper functions
-- ========================================

CREATE OR REPLACE FUNCTION update_workout_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workout_sessions_timestamp_trigger
    BEFORE UPDATE ON workout_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_timestamp();

CREATE TRIGGER update_workout_sets_timestamp_trigger
    BEFORE UPDATE ON workout_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_timestamp();

CREATE OR REPLACE FUNCTION get_previous_workout_sets(
    p_user_id UUID,
    p_exercise_name TEXT,
    p_current_session_id UUID DEFAULT NULL
)
RETURNS TABLE (
    set_number INTEGER,
    weight_kg DECIMAL,
    reps INTEGER,
    workout_date DATE
) AS $$
BEGIN
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot access workout data for other users';
    END IF;
    
    RETURN QUERY
    SELECT 
        ws.set_number,
        ws.weight_kg,
        ws.reps,
        wses.workout_date
    FROM workout_sets ws
    JOIN workout_sessions wses ON ws.session_id = wses.id
    WHERE ws.user_id = p_user_id
      AND ws.exercise_name = p_exercise_name
      AND ws.is_completed = TRUE
      AND wses.is_completed = TRUE
      AND (p_current_session_id IS NULL OR wses.id != p_current_session_id)
    ORDER BY wses.workout_date DESC, ws.set_number ASC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_workout_session(
    p_user_id UUID,
    p_session_id UUID
)
RETURNS workout_sessions AS $$
DECLARE
    session_result workout_sessions;
    session_start TIMESTAMPTZ;
BEGIN
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot complete workout session for other users';
    END IF;
    
    SELECT start_time INTO session_start
    FROM workout_sessions
    WHERE id = p_session_id AND user_id = p_user_id;
    
    IF session_start IS NULL THEN
        RAISE EXCEPTION 'Session not found or access denied';
    END IF;
    
    UPDATE workout_sessions
    SET 
        is_completed = TRUE,
        end_time = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - session_start))::INTEGER,
        updated_at = NOW()
    WHERE id = p_session_id AND user_id = p_user_id
    RETURNING * INTO session_result;
    
    RETURN session_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- DONE! Workout tracking is ready to use
-- ========================================

SELECT 'Workout tracking tables and functions created successfully!' AS status;
