-- ============================================================================
-- YUYAN — CVDICT HIGH-SPEED QUERY OPTIMIZATION
-- Index optimization and branch-specific search logic
-- ============================================================================

SET search_path = public, pg_temp;

-- 1. Compact pinyin functional index
CREATE INDEX IF NOT EXISTS idx_dict_pinyin_compact 
ON public.dictionary_entries (replace(pinyin_normalized, ' ', ''));

-- 2. Update stats
ANALYZE public.dictionary_entries;

-- 3. High-speed branch-aware search function
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
    v_pinyin_unaccent text := translate(lower(trim(p_query)), 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü', 'aaaaeeeeiiiioooouuuuuuuuu');
    v_pinyin_compact text := replace(translate(lower(trim(p_query)), 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü', 'aaaaeeeeiiiioooouuuuuuuuu'), ' ', '');
    v_is_chinese boolean;
BEGIN
    IF v_clean = '' OR v_clean IS NULL THEN
        RETURN;
    END IF;

    -- Check if query contains Chinese characters (CJK Unified Ideographs)
    v_is_chinese := v_clean ~ '[\u4e00-\u9fa5]';

    IF v_is_chinese THEN
        -- CHINESE SEARCH BRANCH: Uses B-tree & Trigram on simplified / traditional ONLY (< 5ms)
        RETURN QUERY
        WITH matched AS (
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
                        WHEN d.simplified = v_clean THEN 1000
                        WHEN d.traditional = v_clean THEN 950
                        WHEN d.simplified LIKE (v_clean || '%') THEN 750
                        WHEN d.traditional LIKE (v_clean || '%') THEN 700
                        WHEN d.simplified LIKE ('%' || v_clean || '%') THEN 550
                        WHEN d.traditional LIKE ('%' || v_clean || '%') THEN 500
                        ELSE 100
                    END
                    - (length(d.simplified) * 2)
                )::INT as calc_score
            FROM public.dictionary_entries d
            WHERE
                d.simplified = v_clean
                OR d.traditional = v_clean
                OR d.simplified LIKE (v_clean || '%')
                OR d.traditional LIKE (v_clean || '%')
                OR (length(v_clean) >= 2 AND (d.simplified LIKE ('%' || v_clean || '%') OR d.traditional LIKE ('%' || v_clean || '%')))
        ),
        counted AS (
            SELECT COUNT(*) as cnt FROM matched
        )
        SELECT
            m.id,
            m.traditional,
            m.simplified,
            m.pinyin,
            m.pinyin_normalized,
            m.meanings_vi,
            m.source_name,
            m.source_license,
            m.quality_status,
            m.has_english_leakage,
            m.calc_score,
            c.cnt
        FROM matched m
        CROSS JOIN counted c
        ORDER BY m.calc_score DESC, length(m.simplified) ASC, m.simplified ASC
        LIMIT p_limit
        OFFSET p_offset;
    ELSE
        -- PINYIN & VIETNAMESE SEARCH BRANCH (< 25ms)
        RETURN QUERY
        WITH matched AS (
            -- 1. Pinyin matches
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
                        WHEN lower(d.pinyin) = v_norm OR replace(lower(d.pinyin), ' ', '') = v_norm_compact THEN 900
                        WHEN d.pinyin_normalized = v_pinyin_unaccent OR replace(d.pinyin_normalized, ' ', '') = v_pinyin_compact THEN 850
                        WHEN d.pinyin_normalized LIKE (v_pinyin_unaccent || '%') OR replace(d.pinyin_normalized, ' ', '') LIKE (v_pinyin_compact || '%') THEN 650
                        WHEN d.pinyin_normalized LIKE ('%' || v_pinyin_unaccent || '%') THEN 450
                        ELSE 100
                    END
                    - (length(d.simplified) * 2)
                )::INT as calc_score
            FROM public.dictionary_entries d
            WHERE
                lower(d.pinyin) = v_norm
                OR replace(lower(d.pinyin), ' ', '') = v_norm_compact
                OR d.pinyin_normalized = v_pinyin_unaccent
                OR replace(d.pinyin_normalized, ' ', '') = v_pinyin_compact
                OR d.pinyin_normalized LIKE (v_pinyin_unaccent || '%')
                OR replace(d.pinyin_normalized, ' ', '') LIKE (v_pinyin_compact || '%')
                OR (length(v_pinyin_compact) >= 3 AND d.pinyin_normalized LIKE ('%' || v_pinyin_unaccent || '%'))

            UNION

            -- 2. Vietnamese meaning matches
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
                        WHEN d.meanings_text ILIKE ('%' || v_clean || '%') THEN 350
                        ELSE 100
                    END
                    - (length(d.simplified) * 2)
                )::INT as calc_score
            FROM public.dictionary_entries d
            WHERE
                length(v_clean) >= 2
                AND d.meanings_text ILIKE ('%' || v_clean || '%')
        ),
        counted AS (
            SELECT COUNT(*) as cnt FROM matched
        )
        SELECT
            m.id,
            m.traditional,
            m.simplified,
            m.pinyin,
            m.pinyin_normalized,
            m.meanings_vi,
            m.source_name,
            m.source_license,
            m.quality_status,
            m.has_english_leakage,
            m.calc_score,
            c.cnt
        FROM matched m
        CROSS JOIN counted c
        ORDER BY m.calc_score DESC, length(m.simplified) ASC, m.simplified ASC
        LIMIT p_limit
        OFFSET p_offset;
    END IF;
END;
$$;
