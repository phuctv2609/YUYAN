-- ============================================================================
-- YUYAN (语言) — COMPLETE HSK MASTER VOCABULARY SCHEMA (HSK 2.0 & HSK 3.0)
-- Source: drkameleon/complete-hsk-vocabulary (Commit 7ac65bf1a6387d35f1ade478906172a19311c7f9)
-- Pinned Version: v1.4 (MIT License)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. HSK MASTER VOCABULARY ENTRIES
CREATE TABLE IF NOT EXISTS public.hsk_master_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simplified VARCHAR(100) NOT NULL,
    traditional VARCHAR(100),
    pinyin VARCHAR(150) NOT NULL,
    pinyin_numeric VARCHAR(150),
    radical VARCHAR(20),
    frequency INT,
    pos TEXT[] DEFAULT '{}',
    pos_vi TEXT[] DEFAULT '{}',
    classifiers TEXT[] DEFAULT '{}',
    meanings_en JSONB NOT NULL DEFAULT '[]'::jsonb,
    meanings_vi JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    review_status VARCHAR(50) NOT NULL DEFAULT 'verified' CHECK (review_status IN ('verified', 'review_required')),
    source_commit VARCHAR(100) NOT NULL DEFAULT '7ac65bf1a6387d35f1ade478906172a19311c7f9',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes on hsk_master_entries
CREATE INDEX IF NOT EXISTS idx_hsk_master_simp ON public.hsk_master_entries(simplified);
CREATE INDEX IF NOT EXISTS idx_hsk_master_trad ON public.hsk_master_entries(traditional);
CREATE INDEX IF NOT EXISTS idx_hsk_master_simp_trgm ON public.hsk_master_entries USING GIN (simplified gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_hsk_master_trad_trgm ON public.hsk_master_entries USING GIN (traditional gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_hsk_master_pinyin ON public.hsk_master_entries(pinyin);
CREATE INDEX IF NOT EXISTS idx_hsk_master_pinyin_trgm ON public.hsk_master_entries USING GIN (pinyin gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_hsk_master_radical ON public.hsk_master_entries(radical);
CREATE INDEX IF NOT EXISTS idx_hsk_master_freq ON public.hsk_master_entries(frequency);
CREATE INDEX IF NOT EXISTS idx_hsk_master_review ON public.hsk_master_entries(review_status);

-- 2. HSK FRAMEWORK MEMBERSHIPS (Many-to-Many level mappings)
CREATE TABLE IF NOT EXISTS public.hsk_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES public.hsk_master_entries(id) ON DELETE CASCADE,
    simplified VARCHAR(100) NOT NULL,
    framework VARCHAR(50) NOT NULL CHECK (framework IN ('hsk2', 'hsk3', 'hsk3_2021')),
    level_code VARCHAR(50) NOT NULL,
    level_number INT NOT NULL CHECK (level_number BETWEEN 1 AND 7),
    is_exclusive BOOLEAN NOT NULL DEFAULT TRUE,
    is_inclusive BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hsk_mem_lookup ON public.hsk_memberships(framework, level_code, is_exclusive);
CREATE INDEX IF NOT EXISTS idx_hsk_mem_inc ON public.hsk_memberships(framework, level_code, is_inclusive);
CREATE INDEX IF NOT EXISTS idx_hsk_mem_entry ON public.hsk_memberships(entry_id);
CREATE INDEX IF NOT EXISTS idx_hsk_mem_simp ON public.hsk_memberships(simplified);

-- 3. LEARNER VOCABULARY STATUS & PROGRESS
CREATE TABLE IF NOT EXISTS public.hsk_learner_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id VARCHAR(100) NOT NULL,
    entry_id UUID NOT NULL REFERENCES public.hsk_master_entries(id) ON DELETE CASCADE,
    simplified VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'learning' CHECK (status IN ('new', 'learning', 'learned', 'review')),
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_learner_hsk_entry UNIQUE (learner_id, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_hsk_lp_learner ON public.hsk_learner_progress(learner_id, status);
CREATE INDEX IF NOT EXISTS idx_hsk_lp_entry ON public.hsk_learner_progress(entry_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hsk_master_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsk_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsk_learner_progress ENABLE ROW LEVEL SECURITY;

-- Read policies for public access
DROP POLICY IF EXISTS "Public read hsk_master_entries" ON public.hsk_master_entries;
CREATE POLICY "Public read hsk_master_entries" ON public.hsk_master_entries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read hsk_memberships" ON public.hsk_memberships;
CREATE POLICY "Public read hsk_memberships" ON public.hsk_memberships FOR SELECT USING (true);

DROP POLICY IF EXISTS "Learner manage own progress" ON public.hsk_learner_progress;
CREATE POLICY "Learner manage own progress" ON public.hsk_learner_progress FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. RPC SEARCH HSK MASTER WORDS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_hsk_master_words(
    p_framework VARCHAR DEFAULT 'all',
    p_level_code VARCHAR DEFAULT 'all',
    p_list_type VARCHAR DEFAULT 'exclusive',
    p_query VARCHAR DEFAULT NULL,
    p_pos VARCHAR DEFAULT NULL,
    p_radical VARCHAR DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_learner_id VARCHAR DEFAULT NULL,
    p_limit INT DEFAULT 30,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    simplified VARCHAR,
    traditional VARCHAR,
    pinyin VARCHAR,
    pinyin_numeric VARCHAR,
    radical VARCHAR,
    frequency INT,
    pos TEXT[],
    pos_vi TEXT[],
    classifiers TEXT[],
    meanings_en JSONB,
    meanings_vi JSONB,
    confidence NUMERIC,
    review_status VARCHAR,
    levels_summary JSONB,
    learner_status VARCHAR,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_query VARCHAR := TRIM(COALESCE(p_query, ''));
    v_has_query BOOLEAN := (LENGTH(v_clean_query) > 0);
    v_clean_pos VARCHAR := TRIM(COALESCE(p_pos, ''));
    v_has_pos BOOLEAN := (LENGTH(v_clean_pos) > 0 AND v_clean_pos <> 'all');
    v_clean_rad VARCHAR := TRIM(COALESCE(p_radical, ''));
    v_has_rad BOOLEAN := (LENGTH(v_clean_rad) > 0 AND v_clean_rad <> 'all');
    v_clean_status VARCHAR := TRIM(COALESCE(p_status, ''));
    v_has_status BOOLEAN := (LENGTH(v_clean_status) > 0 AND v_clean_status <> 'all');
    v_is_chinese BOOLEAN := (v_has_query AND v_clean_query ~ '[\u4e00-\u9fa5]');
BEGIN
    RETURN QUERY
    WITH filtered_entries AS (
        SELECT DISTINCT e.id
        FROM public.hsk_master_entries e
        LEFT JOIN public.hsk_memberships m ON m.entry_id = e.id
        LEFT JOIN public.hsk_learner_progress lp ON lp.entry_id = e.id AND lp.learner_id = p_learner_id
        WHERE
            -- Framework filter
            (p_framework = 'all' OR m.framework = p_framework)
            -- Level filter
            AND (p_level_code = 'all' OR m.level_code = p_level_code)
            -- List type (exclusive vs inclusive)
            AND (
                p_list_type = 'all'
                OR (p_list_type = 'exclusive' AND m.is_exclusive = TRUE)
                OR (p_list_type = 'inclusive' AND m.is_inclusive = TRUE)
            )
            -- POS filter
            AND (NOT v_has_pos OR v_clean_pos = ANY(e.pos))
            -- Radical filter
            AND (NOT v_has_rad OR e.radical = v_clean_rad)
            -- Learner status filter
            AND (NOT v_has_status OR COALESCE(lp.status, 'new') = v_clean_status)
            -- Search query
            AND (
                NOT v_has_query
                OR (
                    CASE
                        WHEN v_is_chinese THEN
                            e.simplified = v_clean_query
                            OR e.traditional = v_clean_query
                            OR e.simplified ILIKE '%' || v_clean_query || '%'
                            OR e.traditional ILIKE '%' || v_clean_query || '%'
                        ELSE
                            e.pinyin ILIKE '%' || v_clean_query || '%'
                            OR e.pinyin_numeric ILIKE '%' || v_clean_query || '%'
                            OR e.meanings_vi::text ILIKE '%' || v_clean_query || '%'
                    END
                )
            )
    ),
    counted AS (
        SELECT COUNT(*)::BIGINT AS full_count FROM filtered_entries
    ),
    paged AS (
        SELECT fe.id
        FROM filtered_entries fe
        JOIN public.hsk_master_entries me ON me.id = fe.id
        ORDER BY
            CASE
                WHEN v_has_query AND me.simplified = v_clean_query THEN 1
                WHEN v_has_query AND me.traditional = v_clean_query THEN 2
                WHEN v_has_query AND me.simplified ILIKE v_clean_query || '%' THEN 3
                ELSE 10
            END,
            me.frequency ASC NULLS LAST,
            me.simplified ASC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT
        e.id,
        e.simplified,
        e.traditional,
        e.pinyin,
        e.pinyin_numeric,
        e.radical,
        e.frequency,
        e.pos,
        e.pos_vi,
        e.classifiers,
        e.meanings_en,
        e.meanings_vi,
        e.confidence,
        e.review_status,
        (
            SELECT jsonb_agg(jsonb_build_object(
                'framework', m.framework,
                'level_code', m.level_code,
                'level_number', m.level_number,
                'is_exclusive', m.is_exclusive
            ))
            FROM public.hsk_memberships m
            WHERE m.entry_id = e.id
        ) AS levels_summary,
        COALESCE(lp.status, 'new')::VARCHAR AS learner_status,
        c.full_count AS total_count
    FROM paged p
    JOIN public.hsk_master_entries e ON e.id = p.id
    CROSS JOIN counted c
    LEFT JOIN public.hsk_learner_progress lp ON lp.entry_id = e.id AND lp.learner_id = p_learner_id
    ORDER BY
        CASE
            WHEN v_has_query AND e.simplified = v_clean_query THEN 1
            WHEN v_has_query AND e.traditional = v_clean_query THEN 2
            WHEN v_has_query AND e.simplified ILIKE v_clean_query || '%' THEN 3
            ELSE 10
        END,
        e.frequency ASC NULLS LAST,
        e.simplified ASC;
END;
$$;

-- ============================================================================
-- 5. RPC GET HSK WORD DETAIL WITH LESSON OCCURRENCES & CVDICT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_hsk_word_master_detail(
    p_entry_id UUID,
    p_learner_id VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_entry RECORD;
    v_memberships JSONB;
    v_lesson_occurrences JSONB;
    v_cvdict_matches JSONB;
    v_hanzi_breakdown JSONB;
    v_learner_status VARCHAR := 'new';
BEGIN
    -- 1. Fetch entry
    SELECT * INTO v_entry
    FROM public.hsk_master_entries
    WHERE id = p_entry_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- 2. Fetch memberships
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'framework', framework,
        'level_code', level_code,
        'level_number', level_number,
        'is_exclusive', is_exclusive,
        'is_inclusive', is_inclusive
    )), '[]'::jsonb)
    INTO v_memberships
    FROM public.hsk_memberships
    WHERE entry_id = p_entry_id;

    -- 3. Fetch learner status
    IF p_learner_id IS NOT NULL THEN
        SELECT status INTO v_learner_status
        FROM public.hsk_learner_progress
        WHERE entry_id = p_entry_id AND learner_id = p_learner_id;
    END IF;

    -- 4. Fetch real lesson occurrences from lesson_sentences (Protected Core read-only)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'lesson_id', ls.lesson_id,
        'level', hl.level,
        'lesson_number', hl.lesson_number,
        'lesson_title', hl.title,
        'sentence_index', ls.sentence_index,
        'hanzi', ls.hanzi,
        'pinyin', ls.pinyin,
        'vietnamese', ls.vietnamese
    )), '[]'::jsonb)
    INTO v_lesson_occurrences
    FROM public.lesson_sentences ls
    JOIN public.hsk_lessons hl ON hl.lesson_id = ls.lesson_id
    WHERE ls.hanzi ILIKE '%' || v_entry.simplified || '%'
    LIMIT 6;

    -- 5. Fetch related CVDICT definitions
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', de.id,
        'simplified', de.simplified,
        'traditional', de.traditional,
        'pinyin', de.pinyin,
        'meanings_vi', de.meanings_vi,
        'source_license', de.source_license
    )), '[]'::jsonb)
    INTO v_cvdict_matches
    FROM public.dictionary_entries de
    WHERE de.simplified = v_entry.simplified
    LIMIT 3;

    -- 6. Constituent characters from canonical_hanzi
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'char', ch.char,
        'traditional', ch.traditional,
        'stroke_count', ch.stroke_count,
        'radical_number', ch.radical_number,
        'radical_char', kr.char,
        'radical_name_vi', kr.name_vi,
        'pinyin', ch.pinyin,
        'meanings', ch.meanings,
        'structure_name_vi', ch.structure_name_vi
    )), '[]'::jsonb)
    INTO v_hanzi_breakdown
    FROM public.canonical_hanzi ch
    LEFT JOIN public.kangxi_radicals kr ON kr.radical_number = ch.radical_number
    WHERE ch.char = ANY(regexp_split_to_array(v_entry.simplified, ''));

    RETURN jsonb_build_object(
        'entry', jsonb_build_object(
            'id', v_entry.id,
            'simplified', v_entry.simplified,
            'traditional', v_entry.traditional,
            'pinyin', v_entry.pinyin,
            'pinyin_numeric', v_entry.pinyin_numeric,
            'radical', v_entry.radical,
            'frequency', v_entry.frequency,
            'pos', v_entry.pos,
            'pos_vi', v_entry.pos_vi,
            'classifiers', v_entry.classifiers,
            'meanings_en', v_entry.meanings_en,
            'meanings_vi', v_entry.meanings_vi,
            'confidence', v_entry.confidence,
            'review_status', v_entry.review_status,
            'source_commit', v_entry.source_commit
        ),
        'memberships', v_memberships,
        'learner_status', COALESCE(v_learner_status, 'new'),
        'lesson_occurrences', v_lesson_occurrences,
        'cvdict_matches', v_cvdict_matches,
        'hanzi_breakdown', v_hanzi_breakdown
    );
END;
$$;

-- ============================================================================
-- 6. RPC UPDATE LEARNER PROGRESS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_hsk_learner_word_status(
    p_learner_id VARCHAR,
    p_entry_id UUID,
    p_simplified VARCHAR,
    p_status VARCHAR,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.hsk_learner_progress (learner_id, entry_id, simplified, status, notes, updated_at)
    VALUES (p_learner_id, p_entry_id, p_simplified, p_status, p_notes, NOW())
    ON CONFLICT (learner_id, entry_id)
    DO UPDATE SET
        status = EXCLUDED.status,
        notes = COALESCE(EXCLUDED.notes, public.hsk_learner_progress.notes),
        updated_at = NOW();

    RETURN jsonb_build_object('success', true, 'learner_id', p_learner_id, 'status', p_status);
END;
$$;
