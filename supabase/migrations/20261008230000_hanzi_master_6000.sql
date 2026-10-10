-- ============================================================================
-- YUYAN — HANZI MASTER >= 6,000 SCHEMA & SEARCH RPC
-- ============================================================================

-- 1. Ensure columns on canonical_hanzi
ALTER TABLE public.canonical_hanzi ADD COLUMN IF NOT EXISTS han_viet text;
ALTER TABLE public.canonical_hanzi ADD COLUMN IF NOT EXISTS pinyin_search text;

-- 2. Indexes for canonical_hanzi
CREATE INDEX IF NOT EXISTS idx_canonical_hanzi_han_viet ON public.canonical_hanzi(han_viet);
CREATE INDEX IF NOT EXISTS idx_canonical_hanzi_pinyin_search ON public.canonical_hanzi(pinyin_search);
CREATE INDEX IF NOT EXISTS idx_canonical_hanzi_radical_num ON public.canonical_hanzi(radical_number);
CREATE INDEX IF NOT EXISTS idx_canonical_hanzi_stroke_cnt ON public.canonical_hanzi(stroke_count);

-- 3. Server-Side RPC for Hanzi Master Explorer & Search
CREATE OR REPLACE FUNCTION public.search_hanzi_master(
    p_query text DEFAULT '',
    p_radical int DEFAULT NULL,
    p_hsk_level int DEFAULT NULL,
    p_min_strokes int DEFAULT NULL,
    p_max_strokes int DEFAULT NULL,
    p_limit int DEFAULT 48,
    p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.search_hanzi_master(text, int, int, int, int, int, int) TO anon, authenticated;
