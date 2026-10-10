-- ============================================================================
-- YUYAN (语言) — HSK EXAM ENGINE V2 MIGRATION (HSK 2.0 & HSK 3.0)
-- Modern normalized schema with full versioning, multi-paper sets, reading passages,
-- audio prompts, provenance tracking, and attempt telemetry.
-- ============================================================================

-- 1. Create or Upgrade EXAM PAPERS METADATA TABLE
CREATE TABLE IF NOT EXISTS public.exam_papers (
    paper_id VARCHAR(100) PRIMARY KEY,
    hsk_version VARCHAR(20) NOT NULL CHECK (hsk_version IN ('hsk2', 'hsk3')),
    level INT NOT NULL CHECK (level BETWEEN 1 AND 9),
    source_id VARCHAR(100) NOT NULL,
    provider_name VARCHAR(200) NOT NULL,
    title_zh VARCHAR(255) NOT NULL,
    title_vi VARCHAR(255) NOT NULL,
    syllabus_standard VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    source_revision VARCHAR(100),
    source_type VARCHAR(50) NOT NULL,
    license TEXT NOT NULL,
    classification VARCHAR(50) NOT NULL DEFAULT 'official_sample',
    verification_status VARCHAR(50) NOT NULL DEFAULT 'verified',
    duration_minutes INT NOT NULL,
    total_questions INT NOT NULL,
    max_score INT NOT NULL DEFAULT 300,
    passing_score INT NOT NULL DEFAULT 180,
    has_verified_answer_key BOOLEAN NOT NULL DEFAULT TRUE,
    has_listening_audio BOOLEAN NOT NULL DEFAULT FALSE,
    has_transcript BOOLEAN NOT NULL DEFAULT FALSE,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_papers_version_level ON public.exam_papers(hsk_version, level);
CREATE INDEX IF NOT EXISTS idx_exam_papers_source ON public.exam_papers(source_id);

-- 2. Upgrade EXAM QUESTIONS TABLE (Add version, paper_id, passage, and audio columns)
DO $$
BEGIN
    -- Add hsk_version column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_questions' AND column_name = 'hsk_version'
    ) THEN
        ALTER TABLE public.exam_questions ADD COLUMN hsk_version VARCHAR(20) DEFAULT 'hsk2';
    END IF;

    -- Add paper_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_questions' AND column_name = 'paper_id'
    ) THEN
        ALTER TABLE public.exam_questions ADD COLUMN paper_id VARCHAR(100);
    END IF;

    -- Add section column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_questions' AND column_name = 'section'
    ) THEN
        ALTER TABLE public.exam_questions ADD COLUMN section VARCHAR(50) DEFAULT 'reading';
    END IF;

    -- Add passage_text and passage_title
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_questions' AND column_name = 'passage_text'
    ) THEN
        ALTER TABLE public.exam_questions ADD COLUMN passage_text TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_questions' AND column_name = 'passage_title'
    ) THEN
        ALTER TABLE public.exam_questions ADD COLUMN passage_title VARCHAR(255);
    END IF;

    -- Add audio columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_questions' AND column_name = 'audio_prompt'
    ) THEN
        ALTER TABLE public.exam_questions ADD COLUMN audio_prompt TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_questions' AND column_name = 'audio_url'
    ) THEN
        ALTER TABLE public.exam_questions ADD COLUMN audio_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_questions' AND column_name = 'transcript'
    ) THEN
        ALTER TABLE public.exam_questions ADD COLUMN transcript TEXT;
    END IF;

    -- Add provenance column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_questions' AND column_name = 'provenance'
    ) THEN
        ALTER TABLE public.exam_questions ADD COLUMN provenance JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Drop obsolete CHECK constraint on question_type to allow listening, writing, speaking, and translation types
DO $$
BEGIN
    ALTER TABLE public.exam_questions DROP CONSTRAINT IF EXISTS exam_questions_question_type_check;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_q_version_level ON public.exam_questions(hsk_version, hsk_level);
CREATE INDEX IF NOT EXISTS idx_exam_q_paper ON public.exam_questions(paper_id);

-- 3. Upgrade EXAM ATTEMPTS TABLE (Telemetry & Multi-mode history)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'hsk_version'
    ) THEN
        ALTER TABLE public.exam_attempts ADD COLUMN hsk_version VARCHAR(20) DEFAULT 'hsk2';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'paper_id'
    ) THEN
        ALTER TABLE public.exam_attempts ADD COLUMN paper_id VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'mode'
    ) THEN
        ALTER TABLE public.exam_attempts ADD COLUMN mode VARCHAR(50) DEFAULT 'timed_simulation';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'section_scores'
    ) THEN
        ALTER TABLE public.exam_attempts ADD COLUMN section_scores JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_v2 ON public.exam_attempts(user_id, hsk_version, hsk_level);

-- Enable RLS
ALTER TABLE public.exam_papers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read exam_papers" ON public.exam_papers;
CREATE POLICY "Public read exam_papers" ON public.exam_papers FOR SELECT USING (true);
