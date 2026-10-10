-- Migration: Fix get_hsk_word_master_detail lesson occurrences and hanzi joins
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

    -- 4. Fetch real lesson occurrences with subquery LIMIT 6 (fast & lightweight)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'lesson_id', sub.lesson_id,
        'level', sub.level,
        'lesson_number', sub.lesson_number,
        'lesson_title', sub.lesson_title,
        'sentence_index', sub.sentence_index,
        'hanzi', sub.hanzi,
        'pinyin', sub.pinyin,
        'vietnamese', sub.vietnamese
    )), '[]'::jsonb)
    INTO v_lesson_occurrences
    FROM (
        SELECT 
            ls.lesson_id,
            hl.level,
            hl.lesson_number,
            hl.title AS lesson_title,
            ls.sentence_index,
            ls.hanzi,
            ls.pinyin,
            ls.vietnamese
        FROM public.lesson_sentences ls
        JOIN public.hsk_lessons hl ON hl.lesson_id = ls.lesson_id
        WHERE ls.hanzi ILIKE '%' || v_entry.simplified || '%'
        ORDER BY hl.level ASC, hl.lesson_number ASC, ls.sentence_index ASC
        LIMIT 6
    ) sub;

    -- 5. Fetch related CVDICT definitions with subquery LIMIT 3
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', sub_cv.id,
        'simplified', sub_cv.simplified,
        'traditional', sub_cv.traditional,
        'pinyin', sub_cv.pinyin,
        'meanings_vi', sub_cv.meanings_vi,
        'source_license', sub_cv.source_license
    )), '[]'::jsonb)
    INTO v_cvdict_matches
    FROM (
        SELECT de.id, de.simplified, de.traditional, de.pinyin, de.meanings_vi, de.source_license
        FROM public.dictionary_entries de
        WHERE de.simplified = v_entry.simplified
        LIMIT 3
    ) sub_cv;

    -- 6. Constituent characters from canonical_hanzi + kangxi_radicals
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'char', ch.char,
        'traditional', ch.traditional,
        'stroke_count', ch.stroke_count,
        'radical_number', ch.radical_number,
        'radical_char', kr.char,
        'radical_name_vi', kr.name_vi,
        'pinyin', ch.pinyin,
        'han_viet', ch.han_viet,
        'meanings', ch.meanings,
        'structure_name_vi', ch.structure_name_vi
    )), '[]'::jsonb)
    INTO v_hanzi_breakdown
    FROM public.canonical_hanzi ch
    LEFT JOIN public.kangxi_radicals kr ON kr.radical_number = ch.radical_number
    WHERE ch.char = ANY(regexp_split_to_array(v_entry.simplified, ''));

    -- Assemble full master detail payload
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
