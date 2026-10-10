-- ============================================================================
-- YUYAN (语言) - SPECIALIZED VOCABULARY & LESSON EXERCISES SCHEMA
-- Project Ref: umeyobuqigbscjucxshs
-- PostgreSQL 17 / Supabase
-- ============================================================================

-- 1. SPECIALIZED DOMAINS (Lĩnh vực chuyên ngành)
CREATE TABLE IF NOT EXISTS public.specialized_domains (
    id VARCHAR(50) PRIMARY KEY,
    name_vi VARCHAR(100) NOT NULL,
    name_zh VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    icon VARCHAR(50) DEFAULT 'Briefcase',
    description_vi TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SPECIALIZED CATEGORIES (Chủ đề chi tiết)
CREATE TABLE IF NOT EXISTS public.specialized_categories (
    id VARCHAR(100) PRIMARY KEY,
    domain_id VARCHAR(50) NOT NULL REFERENCES public.specialized_domains(id) ON DELETE CASCADE,
    name_vi VARCHAR(150) NOT NULL,
    name_zh VARCHAR(150) NOT NULL,
    source_url TEXT,
    description_vi TEXT,
    term_count INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SPECIALIZED VOCABULARY (Từ vựng chuyên ngành)
CREATE TABLE IF NOT EXISTS public.specialized_vocabulary (
    id VARCHAR(150) PRIMARY KEY,
    category_id VARCHAR(100) NOT NULL REFERENCES public.specialized_categories(id) ON DELETE CASCADE,
    domain_id VARCHAR(50) NOT NULL REFERENCES public.specialized_domains(id) ON DELETE CASCADE,
    hanzi VARCHAR(100) NOT NULL,
    pinyin VARCHAR(150) NOT NULL,
    vietnamese TEXT NOT NULL,
    traditional VARCHAR(100),
    part_of_speech VARCHAR(50),
    definition_vi TEXT,
    sample_sentence_zh TEXT,
    sample_sentence_pinyin TEXT,
    sample_sentence_vi TEXT,
    collocations JSONB DEFAULT '[]'::jsonb,
    frequency_rank INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Specialized Vocabulary
CREATE INDEX IF NOT EXISTS idx_spec_vocab_cat ON public.specialized_vocabulary(category_id);
CREATE INDEX IF NOT EXISTS idx_spec_vocab_domain ON public.specialized_vocabulary(domain_id);
CREATE INDEX IF NOT EXISTS idx_spec_vocab_hanzi_trgm ON public.specialized_vocabulary USING gin (hanzi gin_trgm_ops);

-- 4. LESSON EXERCISES (Bài tập luyện tập tương tác theo bài học HSK)
CREATE TABLE IF NOT EXISTS public.lesson_exercises (
    id VARCHAR(100) PRIMARY KEY,
    lesson_id VARCHAR(50) NOT NULL REFERENCES public.hsk_lessons(lesson_id) ON DELETE CASCADE,
    level INT NOT NULL REFERENCES public.hsk_levels(level) ON DELETE CASCADE,
    exercise_type VARCHAR(50) NOT NULL, -- 'vocabulary_meaning', 'pinyin_matching', 'fill_blank', 'sentence_order', 'listening_comprehension'
    question_prompt_zh TEXT NOT NULL,
    question_prompt_pinyin TEXT,
    question_prompt_vi TEXT,
    audio_text TEXT,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answer TEXT NOT NULL,
    explanation_vi TEXT,
    difficulty_level INT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Lesson Exercises
CREATE INDEX IF NOT EXISTS idx_lesson_ex_lesson ON public.lesson_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_ex_level ON public.lesson_exercises(level);
CREATE INDEX IF NOT EXISTS idx_lesson_ex_type ON public.lesson_exercises(exercise_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.specialized_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialized_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialized_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_exercises ENABLE ROW LEVEL SECURITY;

-- Public read access for curriculum and terminology data
DROP POLICY IF EXISTS "Public can view specialized domains" ON public.specialized_domains;
CREATE POLICY "Public can view specialized domains" ON public.specialized_domains FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view specialized categories" ON public.specialized_categories;
CREATE POLICY "Public can view specialized categories" ON public.specialized_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view specialized vocabulary" ON public.specialized_vocabulary;
CREATE POLICY "Public can view specialized vocabulary" ON public.specialized_vocabulary FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view lesson exercises" ON public.lesson_exercises;
CREATE POLICY "Public can view lesson exercises" ON public.lesson_exercises FOR SELECT USING (true);
