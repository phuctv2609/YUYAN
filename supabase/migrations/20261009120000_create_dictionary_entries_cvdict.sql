-- ============================================================================
-- YUYAN (语言) — CVDICT DICTIONARY SYSTEM & SEARCH ENGINE MIGRATION
-- Source: ph0ngp/CVDICT (CC-CEDICT Vietnamese translation)
-- Pinned Commit: c379d909e308343a247e51619f7839a2060a271c
-- License: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
-- Project Ref: umeyobuqigbscjucxshs (PostgreSQL 17)
-- ============================================================================

SET search_path = public, pg_temp;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Table: dictionary_entries (122,000+ entries)
CREATE TABLE IF NOT EXISTS public.dictionary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_key TEXT NOT NULL,
    traditional TEXT NOT NULL,
    simplified TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    pinyin_normalized TEXT NOT NULL,
    meanings_vi JSONB NOT NULL DEFAULT '[]'::jsonb,
    meanings_text TEXT NOT NULL DEFAULT '',
    source_name TEXT NOT NULL DEFAULT 'CVDICT',
    source_url TEXT NOT NULL DEFAULT 'https://github.com/ph0ngp/CVDICT',
    source_commit TEXT NOT NULL DEFAULT 'c379d909e308343a247e51619f7839a2060a271c',
    source_license TEXT NOT NULL DEFAULT 'CC BY-SA 4.0',
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    content_hash TEXT,
    quality_status TEXT NOT NULL DEFAULT 'verified' CHECK (quality_status IN ('verified', 'review_required', 'flagged')),
    has_english_leakage BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_dictionary_source_key UNIQUE (source_key)
);

-- 2. High performance indexing
CREATE INDEX IF NOT EXISTS idx_dict_simplified ON public.dictionary_entries(simplified);
CREATE INDEX IF NOT EXISTS idx_dict_traditional ON public.dictionary_entries(traditional);
CREATE INDEX IF NOT EXISTS idx_dict_pinyin ON public.dictionary_entries(pinyin);
CREATE INDEX IF NOT EXISTS idx_dict_pinyin_norm ON public.dictionary_entries(pinyin_normalized);

-- Trigram indexes for prefix / substring matching
CREATE INDEX IF NOT EXISTS idx_dict_simplified_trgm ON public.dictionary_entries USING GIN (simplified gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dict_traditional_trgm ON public.dictionary_entries USING GIN (traditional gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dict_pinyin_norm_trgm ON public.dictionary_entries USING GIN (pinyin_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dict_meanings_trgm ON public.dictionary_entries USING GIN (meanings_text gin_trgm_ops);

-- 3. Row Level Security (RLS)
ALTER TABLE public.dictionary_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read dictionary_entries" ON public.dictionary_entries;
CREATE POLICY "Public read dictionary_entries" ON public.dictionary_entries FOR SELECT USING (true);

-- 4. Server-Side Unified Search RPC
CREATE OR REPLACE FUNCTION public.search_cvdict_entries(
    p_query text,
    p_limit int DEFAULT 30,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    traditional TEXT,
    simplified TEXT,
    pinyin TEXT,
    pinyin_normalized TEXT,
    meanings_vi JSONB,
    source_name TEXT,
    source_license TEXT,
    quality_status TEXT,
    has_english_leakage BOOLEAN,
    score INT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean text := trim(p_query);
    v_norm text := lower(trim(p_query));
    v_norm_compact text := replace(lower(trim(p_query)), ' ', '');
BEGIN
    IF v_clean = '' OR v_clean IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH scored AS (
        SELECT
            d.id,
            d.traditional,
            d.simplified,
            d.pinyin,
            d.pinyin_normalized,
            d.meanings_vi,
            d.source_name,
            d.source_license,
            d.quality_status,
            d.has_english_leakage,
            (
                CASE
                    -- Exact match simplified (highest priority)
                    WHEN d.simplified = v_clean THEN 1000
                    -- Exact match traditional
                    WHEN d.traditional = v_clean THEN 950
                    -- Exact match pinyin with tones
                    WHEN lower(d.pinyin) = v_norm THEN 900
                    -- Exact match pinyin normalized (e.g. "ni hao" or "nihao")
                    WHEN d.pinyin_normalized = v_norm OR replace(d.pinyin_normalized, ' ', '') = v_norm_compact THEN 850
                    -- Simplified prefix match
                    WHEN d.simplified LIKE (v_clean || '%') THEN 750
                    -- Traditional prefix match
                    WHEN d.traditional LIKE (v_clean || '%') THEN 700
                    -- Pinyin normalized prefix match
                    WHEN d.pinyin_normalized LIKE (v_norm || '%') OR replace(d.pinyin_normalized, ' ', '') LIKE (v_norm_compact || '%') THEN 650
                    -- Simplified contains match
                    WHEN d.simplified LIKE ('%' || v_clean || '%') THEN 550
                    -- Traditional contains match
                    WHEN d.traditional LIKE ('%' || v_clean || '%') THEN 500
                    -- Pinyin normalized contains match
                    WHEN d.pinyin_normalized LIKE ('%' || v_norm || '%') THEN 450
                    -- Vietnamese exact word in meanings
                    WHEN d.meanings_text ILIKE ('%' || v_clean || '%') THEN 350
                    ELSE 100
                END
                - (length(d.simplified) * 2) -- prefer shorter words
            )::INT as calc_score
        FROM public.dictionary_entries d
        WHERE
            d.simplified = v_clean
            OR d.traditional = v_clean
            OR lower(d.pinyin) = v_norm
            OR d.pinyin_normalized = v_norm
            OR replace(d.pinyin_normalized, ' ', '') = v_norm_compact
            OR d.simplified LIKE (v_clean || '%')
            OR d.traditional LIKE (v_clean || '%')
            OR d.pinyin_normalized LIKE (v_norm || '%')
            OR replace(d.pinyin_normalized, ' ', '') LIKE (v_norm_compact || '%')
            OR (length(v_clean) >= 2 AND d.simplified LIKE ('%' || v_clean || '%'))
            OR (length(v_clean) >= 2 AND d.traditional LIKE ('%' || v_clean || '%'))
            OR (length(v_clean) >= 3 AND d.meanings_text ILIKE ('%' || v_clean || '%'))
    ),
    counted AS (
        SELECT COUNT(*) as cnt FROM scored
    )
    SELECT
        s.id,
        s.traditional,
        s.simplified,
        s.pinyin,
        s.pinyin_normalized,
        s.meanings_vi,
        s.source_name,
        s.source_license,
        s.quality_status,
        s.has_english_leakage,
        s.calc_score,
        c.cnt
    FROM scored s
    CROSS JOIN counted c
    ORDER BY s.calc_score DESC, length(s.simplified) ASC, s.simplified ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 5. Detail Enrichment RPC: Links to HSK vocabulary, Lesson sentences & Hanzi breakdown
CREATE OR REPLACE FUNCTION public.get_dictionary_word_detail(
    p_id uuid
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_entry record;
    v_hsk jsonb := '[]'::jsonb;
    v_lessons jsonb := '[]'::jsonb;
    v_chars jsonb := '[]'::jsonb;
BEGIN
    SELECT * INTO v_entry FROM public.dictionary_entries WHERE id = p_id;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- 1. Match HSK vocabulary by exact simplified hanzi
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', hv.id,
            'hanzi', hv.hanzi,
            'pinyin', hv.pinyin,
            'hsk_level', hv.hsk_level,
            'part_of_speech', hv.part_of_speech,
            'vietnamese', hv.vietnamese,
            'collocations', hv.collocations
        )
    )
    INTO v_hsk
    FROM public.hsk_vocabulary hv
    WHERE hv.hanzi = v_entry.simplified;

    -- 2. Match Lesson Occurrences in lesson_sentences
    SELECT jsonb_agg(
        jsonb_build_object(
            'lesson_id', hl.lesson_id,
            'level', hl.level,
            'lesson_number', hl.lesson_number,
            'lesson_title', hl.title,
            'sentence_index', ls.sentence_index,
            'hanzi', ls.hanzi,
            'pinyin', ls.pinyin,
            'vietnamese', ls.vietnamese
        )
    )
    INTO v_lessons
    FROM (
        SELECT DISTINCT ON (ls_sub.lesson_id)
            ls_sub.lesson_id,
            ls_sub.sentence_index,
            ls_sub.hanzi,
            ls_sub.pinyin,
            ls_sub.vietnamese
        FROM public.lesson_sentences ls_sub
        WHERE ls_sub.hanzi LIKE ('%' || v_entry.simplified || '%')
        LIMIT 6
    ) ls
    JOIN public.hsk_lessons hl ON ls.lesson_id = hl.lesson_id;

    -- 3. Character breakdown from canonical_hanzi
    SELECT jsonb_agg(
        jsonb_build_object(
            'char', ch.char,
            'traditional', ch.traditional,
            'stroke_count', ch.stroke_count,
            'radical_number', ch.radical_number,
            'radical_char', kr.char,
            'radical_name_vi', kr.name_vi,
            'pinyin', ch.pinyin,
            'meanings', ch.meanings,
            'structure_name_vi', ch.structure_name_vi
        )
    )
    INTO v_chars
    FROM (
        SELECT regexp_split_to_table(v_entry.simplified, '') AS ch_char
    ) t
    JOIN public.canonical_hanzi ch ON ch.char = t.ch_char
    LEFT JOIN public.kangxi_radicals kr ON ch.radical_number = kr.radical_number;

    RETURN jsonb_build_object(
        'entry', row_to_json(v_entry),
        'hsk_matches', COALESCE(v_hsk, '[]'::jsonb),
        'lesson_occurrences', COALESCE(v_lessons, '[]'::jsonb),
        'hanzi_breakdown', COALESCE(v_chars, '[]'::jsonb)
    );
END;
$$;
