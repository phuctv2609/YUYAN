-- 20261008233000_security_and_grammar_patterns.sql
-- 1. Fix SECURITY DEFINER search_path for search_dictionary and search_hanzi_master
-- 2. Add covering index on exam_attempts
-- 3. Create grammar_patterns table with RLS and indexes

-- 1. Hardening search_dictionary
CREATE OR REPLACE FUNCTION public.search_dictionary(p_query text, p_limit integer DEFAULT 30, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
    v_clean text;
    v_norm text;
    v_results jsonb;
BEGIN
    v_clean := lower(trim(p_query));
    v_norm := translate(v_clean, 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü', 'aaaaeeeeiiiioooouuuuuuuuu');
    v_norm := regexp_replace(v_norm, '([a-z])[1-5]', '\1', 'g');

    WITH hsk_matches AS (
        SELECT 
            v.id::text AS id,
            v.hanzi,
            v.pinyin,
            v.vietnamese,
            v.part_of_speech AS word_type,
            'hsk' AS source_type,
            'HSK ' || v.hsk_level AS source_label,
            v.hsk_level,
            NULL::text AS domain_id,
            NULL::text AS subcategory,
            1 AS priority
        FROM public.hsk_vocabulary v
        WHERE v.hanzi = p_query
           OR v.hanzi ILIKE '%' || p_query || '%'
           OR lower(v.pinyin) ILIKE '%' || v_clean || '%'
           OR translate(lower(v.pinyin), 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü', 'aaaaeeeeiiiioooouuuuuuuuu') ILIKE '%' || v_norm || '%'
           OR lower(v.vietnamese) ILIKE '%' || v_clean || '%'
        LIMIT p_limit
    ),
    spec_matches AS (
        SELECT 
            s.id::text AS id,
            s.hanzi,
            s.pinyin,
            s.vietnamese,
            s.part_of_speech AS word_type,
            'professional' AS source_type,
            'Chuyên ngành · ' || COALESCE(s.industry, d.name_vi, s.domain_id) AS source_label,
            NULL::int AS hsk_level,
            s.domain_id,
            s.subcategory,
            2 AS priority
        FROM public.specialized_vocabulary s
        LEFT JOIN public.specialized_domains d ON d.id = s.domain_id
        WHERE (s.customer_visible = true OR s.duplicate_action IN ('unique', 'keep_primary'))
          AND (
             s.hanzi = p_query
             OR s.hanzi ILIKE '%' || p_query || '%'
             OR lower(s.pinyin) ILIKE '%' || v_clean || '%'
             OR translate(lower(s.pinyin), 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü', 'aaaaeeeeiiiioooouuuuuuuuu') ILIKE '%' || v_norm || '%'
             OR lower(s.vietnamese) ILIKE '%' || v_clean || '%'
          )
        LIMIT p_limit
    ),
    combined AS (
        SELECT * FROM hsk_matches
        UNION ALL
        SELECT * FROM spec_matches
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'hanzi', c.hanzi,
            'pinyin', c.pinyin,
            'vietnamese', c.vietnamese,
            'word_type', c.word_type,
            'source_type', c.source_type,
            'source_label', c.source_label,
            'hsk_level', c.hsk_level,
            'domain_id', c.domain_id,
            'subcategory', c.subcategory
        )
    ) INTO v_results
    FROM (
        SELECT * FROM combined
        ORDER BY priority ASC, length(hanzi) ASC
        LIMIT p_limit OFFSET p_offset
    ) c;

    RETURN COALESCE(v_results, '[]'::jsonb);
END;
$function$;

-- Hardening search_hanzi_master
CREATE OR REPLACE FUNCTION public.search_hanzi_master(
    p_query text DEFAULT ''::text,
    p_radical integer DEFAULT NULL::integer,
    p_hsk_level integer DEFAULT NULL::integer,
    p_min_strokes integer DEFAULT NULL::integer,
    p_max_strokes integer DEFAULT NULL::integer,
    p_limit integer DEFAULT 48,
    p_offset integer DEFAULT 0
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
    v_clean text;
    v_norm text;
    v_total bigint;
    v_rows jsonb;
BEGIN
    v_clean := lower(trim(p_query));
    v_norm := translate(v_clean, 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü', 'aaaaeeeeiiiioooouuuuuuuuu');
    v_norm := regexp_replace(v_norm, '([a-z])[1-5]', '\1', 'g');

    -- Count total matching rows
    SELECT count(*) INTO v_total
    FROM public.canonical_hanzi h
    WHERE (
        v_clean = ''
        OR h.char = v_clean
        OR h.traditional = v_clean
        OR lower(coalesce(h.han_viet, '')) ILIKE '%' || v_clean || '%'
        OR array_to_string(h.pinyin, ' ') ILIKE '%' || v_clean || '%'
        OR lower(coalesce(h.pinyin_search, '')) ILIKE '%' || v_norm || '%'
        OR array_to_string(h.meanings, ' ') ILIKE '%' || v_clean || '%'
    )
    AND (p_radical IS NULL OR h.radical_number = p_radical)
    AND (p_hsk_level IS NULL OR p_hsk_level = ANY(h.hsk_levels))
    AND (p_min_strokes IS NULL OR h.stroke_count >= p_min_strokes)
    AND (p_max_strokes IS NULL OR h.stroke_count <= p_max_strokes);

    -- Fetch paginated results
    SELECT jsonb_agg(
        jsonb_build_object(
            'char', h.char,
            'traditional', h.traditional,
            'radical_number', h.radical_number,
            'stroke_count', h.stroke_count,
            'pinyin', h.pinyin,
            'han_viet', h.han_viet,
            'meanings', h.meanings,
            'structure', h.structure,
            'structure_name_vi', h.structure_name_vi,
            'decomposition', h.decomposition,
            'hsk_levels', h.hsk_levels,
            'vocabulary_ids', h.vocabulary_ids,
            'mnemonic', h.mnemonic
        )
    ) INTO v_rows
    FROM (
        SELECT h.*
        FROM public.canonical_hanzi h
        WHERE (
            v_clean = ''
            OR h.char = v_clean
            OR h.traditional = v_clean
            OR lower(coalesce(h.han_viet, '')) ILIKE '%' || v_clean || '%'
            OR array_to_string(h.pinyin, ' ') ILIKE '%' || v_clean || '%'
            OR lower(coalesce(h.pinyin_search, '')) ILIKE '%' || v_norm || '%'
            OR array_to_string(h.meanings, ' ') ILIKE '%' || v_clean || '%'
        )
        AND (p_radical IS NULL OR h.radical_number = p_radical)
        AND (p_hsk_level IS NULL OR p_hsk_level = ANY(h.hsk_levels))
        AND (p_min_strokes IS NULL OR h.stroke_count >= p_min_strokes)
        AND (p_max_strokes IS NULL OR h.stroke_count <= p_max_strokes)
        ORDER BY 
            CASE WHEN h.char = v_clean THEN 0 ELSE 1 END,
            CASE WHEN array_length(h.hsk_levels, 1) > 0 THEN 0 ELSE 1 END,
            h.stroke_count ASC,
            h.char ASC
        LIMIT p_limit OFFSET p_offset
    ) h;

    RETURN jsonb_build_object(
        'total', v_total,
        'limit', p_limit,
        'offset', p_offset,
        'characters', coalesce(v_rows, '[]'::jsonb)
    );
END;
$function$;

-- 2. Add covering index on exam_attempts
CREATE INDEX IF NOT EXISTS idx_exam_attempts_level_created 
ON public.exam_attempts(hsk_level, created_at DESC);

-- 3. Create grammar_patterns table
CREATE TABLE IF NOT EXISTS public.grammar_patterns (
    id TEXT PRIMARY KEY,
    hsk_level INTEGER NOT NULL CHECK (hsk_level BETWEEN 1 AND 6),
    lesson_id TEXT,
    title TEXT NOT NULL,
    pattern TEXT NOT NULL,
    explanation TEXT NOT NULL,
    structure_summary TEXT,
    examples JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_grammar_patterns_level 
ON public.grammar_patterns(hsk_level, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_grammar_patterns_lesson 
ON public.grammar_patterns(lesson_id);

ALTER TABLE public.grammar_patterns ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'grammar_patterns' 
          AND policyname = 'Allow public read on grammar_patterns'
    ) THEN
        CREATE POLICY "Allow public read on grammar_patterns" 
        ON public.grammar_patterns 
        FOR SELECT 
        USING (true);
    END IF;
END $$;
