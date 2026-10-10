-- ============================================================================
-- YUYAN (语言) — REALTIME LEARNING PROGRESS, JOURNEY & STREAK SCHEMA
-- Migration: 20261010190000_realtime_learning_progress_and_journey.sql
-- ============================================================================

-- 1. Enhance learner_profiles with persistent journey & streak telemetry
ALTER TABLE learner_profiles 
    ADD COLUMN IF NOT EXISTS journey_start_date DATE,
    ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_active_days INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_study_date DATE,
    ADD COLUMN IF NOT EXISTS school_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create authoritative study_activity_logs table
CREATE TABLE IF NOT EXISTS study_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    score NUMERIC(5, 2),
    duration_seconds INT DEFAULT 0,
    activity_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user_date ON study_activity_logs(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_activity_user_type ON study_activity_logs(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_date ON study_activity_logs(activity_date);

-- 3. Expand constraints on learner_progress to support all modern modules
DO $$
BEGIN
    -- Relax entity_type check to accommodate all skill modules & bookmarks
    ALTER TABLE learner_progress DROP CONSTRAINT IF EXISTS learner_progress_entity_type_check;
    ALTER TABLE learner_progress ADD CONSTRAINT learner_progress_entity_type_check
        CHECK (entity_type IN ('lesson', 'vocab', 'hanzi', 'reading', 'exam', 'grammar', 'listening', 'speaking', 'bookmark'));

    -- Relax status check to accommodate bookmarks & mastery
    ALTER TABLE learner_progress DROP CONSTRAINT IF EXISTS learner_progress_status_check;
    ALTER TABLE learner_progress ADD CONSTRAINT learner_progress_status_check
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered', 'bookmarked'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 4. Enable Row Level Security (RLS) on study_activity_logs
ALTER TABLE study_activity_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Study activity logs access" ON study_activity_logs;
    CREATE POLICY "Study activity logs access" ON study_activity_logs 
        FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 5. Configure Replica Identity for real-time change detection
ALTER TABLE learner_profiles REPLICA IDENTITY FULL;
ALTER TABLE learner_progress REPLICA IDENTITY FULL;
ALTER TABLE study_activity_logs REPLICA IDENTITY FULL;

-- 6. Add tables to Supabase Realtime publication safely
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE learner_profiles;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE learner_progress;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE study_activity_logs;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE exam_attempts;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE learner_mistakes;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
