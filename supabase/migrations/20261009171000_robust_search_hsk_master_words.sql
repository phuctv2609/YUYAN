-- Migration: Make search_hsk_master_words handle NULLs and 'all' filters robustly
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
    v_is_all_levels BOOLEAN := (p_level_code IS NULL OR p_level_code = 'all' OR p_level_code = '');
    v_is_all_frameworks BOOLEAN := (p_framework IS NULL OR p_framework = 'all' OR p_framework = '');
BEGIN
    RETURN QUERY
    WITH filtered_entries AS (
        SELECT DISTINCT e.id
        FROM public.hsk_master_entries e
        LEFT JOIN public.hsk_memberships m ON m.entry_id = e.id
        LEFT JOIN public.hsk_learner_progress lp ON lp.entry_id = e.id AND lp.learner_id = p_learner_id
        WHERE
            -- Framework filter
            (v_is_all_frameworks OR m.framework = p_framework)
            -- Level filter
            AND (v_is_all_levels OR m.level_code = p_level_code)
            -- List type filter (only active when scoping to a specific level)
            AND (
                v_is_all_levels
                OR p_list_type IS NULL
                OR p_list_type = 'all'
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
