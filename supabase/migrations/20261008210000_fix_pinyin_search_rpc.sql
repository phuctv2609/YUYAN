-- Drop existing overloaded functions
DROP FUNCTION IF EXISTS public.search_dictionary(text, integer);
DROP FUNCTION IF EXISTS public.search_dictionary(text, integer, integer);

-- Create unified, tone-tolerant search_dictionary RPC
CREATE OR REPLACE FUNCTION public.search_dictionary(
    p_query text,
    p_limit int DEFAULT 30,
    p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean text;
    v_norm text;
    v_results jsonb;
BEGIN
    v_clean := lower(trim(p_query));
    -- Translate tones into unaccented ASCII letters
    v_norm := translate(v_clean, 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü', 'aaaaeeeeiiiioooouuuuuuuuu');
    -- Strip tone numbers (1-5)
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
            'Chuyên ngành · ' || COALESCE(d.name_vi, s.domain_id) AS source_label,
            NULL::int AS hsk_level,
            s.domain_id,
            s.subcategory,
            2 AS priority
        FROM public.specialized_vocabulary s
        LEFT JOIN public.specialized_domains d ON d.id = s.domain_id
        WHERE s.duplicate_action IN ('unique', 'keep_primary')
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
$$;
