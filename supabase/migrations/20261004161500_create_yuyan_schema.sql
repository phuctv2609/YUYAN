-- ============================================================================
-- YUYAN (语言) — FULL SYSTEM DATABASE SCHEMA MIGRATION
-- Project Ref: umeyobuqigbscjucxshs
-- PostgreSQL 17 / Supabase
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. KANGXI RADICALS (214 Bộ Thủ Khang Hy)
-- ============================================================================
CREATE TABLE IF NOT EXISTS kangxi_radicals (
    radical_number INT PRIMARY KEY CHECK (radical_number BETWEEN 1 AND 214),
    char VARCHAR(10) NOT NULL,
    name_zh VARCHAR(50) NOT NULL,
    name_vi VARCHAR(100) NOT NULL,
    meaning TEXT NOT NULL,
    stroke_count INT NOT NULL CHECK (stroke_count BETWEEN 1 AND 17),
    variants TEXT[] DEFAULT '{}',
    semantic_category VARCHAR(100) NOT NULL,
    mnemonic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radicals_stroke ON kangxi_radicals(stroke_count);
CREATE INDEX IF NOT EXISTS idx_radicals_category ON kangxi_radicals(semantic_category);

-- ============================================================================
-- 2. CANONICAL HANZI (Chữ Hán Chuẩn Hóa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS canonical_hanzi (
    char VARCHAR(10) PRIMARY KEY,
    traditional VARCHAR(10) NOT NULL,
    radical_number INT NOT NULL REFERENCES kangxi_radicals(radical_number),
    stroke_count INT NOT NULL,
    pinyin TEXT[] NOT NULL,
    meanings TEXT[] NOT NULL,
    structure VARCHAR(50) NOT NULL,
    structure_name_vi VARCHAR(100) NOT NULL,
    decomposition VARCHAR(50),
    stroke_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    hsk_levels INT[] NOT NULL DEFAULT '{}',
    vocabulary_ids TEXT[] NOT NULL DEFAULT '{}',
    mnemonic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hanzi_radical ON canonical_hanzi(radical_number);
CREATE INDEX IF NOT EXISTS idx_hanzi_stroke ON canonical_hanzi(stroke_count);
CREATE INDEX IF NOT EXISTS idx_hanzi_levels ON canonical_hanzi USING GIN(hsk_levels);
CREATE INDEX IF NOT EXISTS idx_hanzi_char_trgm ON canonical_hanzi USING GIN(char gin_trgm_ops);

-- ============================================================================
-- 3. PINYIN PHONETICS (Hệ thống Ngữ âm Pinyin Chuẩn Hóa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pinyin_initials (
    id VARCHAR(50) PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    ipa VARCHAR(20) NOT NULL,
    display_order INT NOT NULL,
    description_vi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pinyin_finals (
    id VARCHAR(50) PRIMARY KEY,
    canonical_symbol VARCHAR(10) NOT NULL UNIQUE,
    display_symbol VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    ipa VARCHAR(20) NOT NULL,
    is_nasal BOOLEAN NOT NULL DEFAULT FALSE,
    reduced_form_from VARCHAR(10),
    context_notes_vi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pinyin_tones (
    tone_number INT PRIMARY KEY CHECK (tone_number BETWEEN 1 AND 5),
    name_zh VARCHAR(50) NOT NULL,
    name_vi VARCHAR(50) NOT NULL,
    pitch_contour VARCHAR(20) NOT NULL,
    mark_example VARCHAR(10) NOT NULL,
    description_vi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pinyin_syllables (
    id VARCHAR(50) PRIMARY KEY,
    display_pinyin VARCHAR(20) NOT NULL,
    display_pinyin_ascii VARCHAR(20) NOT NULL,
    canonical_initial VARCHAR(10) NOT NULL,
    canonical_final VARCHAR(10) NOT NULL,
    tone INT NOT NULL CHECK (tone BETWEEN 1 AND 5),
    pronunciation_class VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    is_standard_orthography BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syllables_pinyin ON pinyin_syllables(display_pinyin);
CREATE INDEX IF NOT EXISTS idx_syllables_ascii ON pinyin_syllables(display_pinyin_ascii);

-- ============================================================================
-- 4. HSK CURRICULUM LEVELS & LESSONS (Giáo trình HSK 1 - 6)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hsk_levels (
    level INT PRIMARY KEY CHECK (level BETWEEN 1 AND 6),
    title_zh VARCHAR(50) NOT NULL,
    title_vi VARCHAR(100) NOT NULL,
    description TEXT,
    target_vocab_count INT NOT NULL,
    total_lessons INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hsk_lessons (
    lesson_id VARCHAR(50) PRIMARY KEY,
    level INT NOT NULL REFERENCES hsk_levels(level),
    lesson_number INT NOT NULL CHECK (lesson_number BETWEEN 1 AND 50),
    title VARCHAR(255) NOT NULL,
    source_file VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_level_lesson UNIQUE (level, lesson_number)
);

CREATE INDEX IF NOT EXISTS idx_lessons_level ON hsk_lessons(level);

-- ============================================================================
-- 5. LESSON SENTENCES (Câu Bài Khóa HSK — 9,178 câu nguyên gốc)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lesson_sentences (
    id VARCHAR(100) PRIMARY KEY,
    lesson_id VARCHAR(50) NOT NULL REFERENCES hsk_lessons(lesson_id) ON DELETE CASCADE,
    sentence_index INT NOT NULL,
    hanzi TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    vietnamese TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_lesson_sentence UNIQUE (lesson_id, sentence_index)
);

CREATE INDEX IF NOT EXISTS idx_sentences_lesson ON lesson_sentences(lesson_id);
CREATE INDEX IF NOT EXISTS idx_sentences_hanzi_trgm ON lesson_sentences USING GIN(hanzi gin_trgm_ops);

-- ============================================================================
-- 6. HSK VOCABULARY (Từ Vựng HSK 1 - 6 — 8,456 mục)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hsk_vocabulary (
    id VARCHAR(100) PRIMARY KEY,
    lesson_id VARCHAR(50) REFERENCES hsk_lessons(lesson_id) ON DELETE SET NULL,
    stt INT,
    hanzi VARCHAR(100) NOT NULL,
    pinyin VARCHAR(150) NOT NULL,
    part_of_speech VARCHAR(50),
    vietnamese TEXT NOT NULL,
    collocations TEXT,
    hsk_level INT NOT NULL REFERENCES hsk_levels(level),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocab_hanzi ON hsk_vocabulary(hanzi);
CREATE INDEX IF NOT EXISTS idx_vocab_level ON hsk_vocabulary(hsk_level);
CREATE INDEX IF NOT EXISTS idx_vocab_lesson ON hsk_vocabulary(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocab_hanzi_trgm ON hsk_vocabulary USING GIN(hanzi gin_trgm_ops);

-- ============================================================================
-- 7. READING PASSAGES (Bài Tự Đọc Hiểu — 146 bài)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reading_passages (
    lesson_id VARCHAR(50) PRIMARY KEY REFERENCES hsk_lessons(lesson_id) ON DELETE CASCADE,
    level INT NOT NULL REFERENCES hsk_levels(level),
    lesson_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    hanzi TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    vietnamese TEXT NOT NULL,
    vocabulary_reappeared TEXT,
    comprehension_questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_level ON reading_passages(level);

-- ============================================================================
-- 8. EXAM QUESTIONS & ATTEMPTS (Ngân Hàng Đề Thi & Lịch Sử Làm Bài HSK)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_questions (
    id SERIAL PRIMARY KEY,
    hsk_level INT NOT NULL REFERENCES hsk_levels(level),
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('hanzi_pinyin', 'meaning', 'fill', 'reading')),
    options JSONB NOT NULL,
    correct_answer_index INT NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_level ON exam_questions(hsk_level);

CREATE TABLE IF NOT EXISTS exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    hsk_level INT NOT NULL REFERENCES hsk_levels(level),
    score INT NOT NULL,
    total_questions INT NOT NULL,
    time_spent_seconds INT NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id);

-- ============================================================================
-- 9. LEARNER PROFILES & PROGRESS (Hồ Sơ Học Viên & Tiến Độ Học Tập)
-- ============================================================================
CREATE TABLE IF NOT EXISTS learner_profiles (
    id VARCHAR(100) PRIMARY KEY,
    display_name VARCHAR(150) NOT NULL DEFAULT 'Học viên YUYAN',
    target_hsk_level INT NOT NULL DEFAULT 1 CHECK (target_hsk_level BETWEEN 1 AND 6),
    daily_goal_minutes INT NOT NULL DEFAULT 30,
    streak_days INT NOT NULL DEFAULT 0,
    total_study_minutes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learner_progress (
    id VARCHAR(120) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('lesson', 'vocab', 'hanzi', 'reading', 'exam')),
    entity_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
    score NUMERIC(5, 2) DEFAULT 0,
    review_count INT NOT NULL DEFAULT 0,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_learner_entity UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON learner_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_entity ON learner_progress(entity_type, entity_id);

-- ============================================================================
-- 10. LEARNER MISTAKES (Sổ Tay Câu Sai Cá Nhân Hóa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS learner_mistakes (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    selected_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mistakes_user_resolved ON learner_mistakes(user_id, resolved);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- 1. Reference Data: Public read for all users (anon & authenticated)
ALTER TABLE kangxi_radicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE canonical_hanzi ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinyin_initials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinyin_finals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinyin_tones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinyin_syllables ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsk_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsk_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsk_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public read kangxi_radicals" ON kangxi_radicals;
    CREATE POLICY "Public read kangxi_radicals" ON kangxi_radicals FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read canonical_hanzi" ON canonical_hanzi;
    CREATE POLICY "Public read canonical_hanzi" ON canonical_hanzi FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read pinyin_initials" ON pinyin_initials;
    CREATE POLICY "Public read pinyin_initials" ON pinyin_initials FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read pinyin_finals" ON pinyin_finals;
    CREATE POLICY "Public read pinyin_finals" ON pinyin_finals FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read pinyin_tones" ON pinyin_tones;
    CREATE POLICY "Public read pinyin_tones" ON pinyin_tones FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read pinyin_syllables" ON pinyin_syllables;
    CREATE POLICY "Public read pinyin_syllables" ON pinyin_syllables FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read hsk_levels" ON hsk_levels;
    CREATE POLICY "Public read hsk_levels" ON hsk_levels FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read hsk_lessons" ON hsk_lessons;
    CREATE POLICY "Public read hsk_lessons" ON hsk_lessons FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read lesson_sentences" ON lesson_sentences;
    CREATE POLICY "Public read lesson_sentences" ON lesson_sentences FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read hsk_vocabulary" ON hsk_vocabulary;
    CREATE POLICY "Public read hsk_vocabulary" ON hsk_vocabulary FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read reading_passages" ON reading_passages;
    CREATE POLICY "Public read reading_passages" ON reading_passages FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read exam_questions" ON exam_questions;
    CREATE POLICY "Public read exam_questions" ON exam_questions FOR SELECT USING (true);
END $$;

-- 2. Learner Data: Allow read and write for owner or anonymous sessions
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Learner profile access" ON learner_profiles;
    CREATE POLICY "Learner profile access" ON learner_profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Learner progress access" ON learner_progress;
    CREATE POLICY "Learner progress access" ON learner_progress FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Learner mistakes access" ON learner_mistakes;
    CREATE POLICY "Learner mistakes access" ON learner_mistakes FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Exam attempts access" ON exam_attempts;
    CREATE POLICY "Exam attempts access" ON exam_attempts FOR ALL USING (true) WITH CHECK (true);
END $$;
