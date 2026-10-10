-- ============================================================================
-- YUYAN — UNIFIED DICTIONARY & 10,000 PROFESSIONAL VOCABULARY SCHEMA MIGRATION
-- Project Ref: umeyobuqigbscjucxshs (PostgreSQL 17)
-- ============================================================================

-- 1. Ensure 10 Authoritative Specialized Domains
INSERT INTO public.specialized_domains (id, name_vi, name_zh, name_en, icon, description_vi, sort_order, customer_visible, publication_status)
VALUES
  ('logistics_customs', 'Logistics & Hải quan', '物流与海关', 'Logistics & Customs', 'Truck', 'Logistics, xuất nhập khẩu, kho vận và hải quan', 1, true, 'approved'),
  ('mechanical_manufacturing', 'Cơ khí & Sản xuất chế tạo', '机械与制造', 'Mechanical & Manufacturing', 'Cog', 'Cơ khí, chế tạo, sản xuất, bảo trì và chất lượng', 2, true, 'approved'),
  ('textile_footwear', 'Dệt may & Da giày', '纺织服装与鞋业', 'Textile & Footwear', 'Scissors', 'Dệt, may, thời trang, da và giày', 3, true, 'approved'),
  ('it_electronics', 'Công nghệ Thông tin & Điện tử', '信息技术与电子', 'IT & Electronics', 'Cpu', 'Phần mềm, phần cứng, mạng, điện tử và công nghệ số', 4, true, 'approved'),
  ('finance_banking_accounting', 'Tài chính, Ngân hàng & Kế toán', '金融、银行与会计', 'Finance & Accounting', 'DollarSign', 'Tài chính, ngân hàng, kế toán, thuế và kiểm toán', 5, true, 'approved'),
  ('healthcare_pharma', 'Y tế, Bệnh viện & Dược phẩm', '医疗、医院与药剂', 'Healthcare & Pharma', 'HeartPulse', 'Bệnh viện, y tế, điều dưỡng, dược và thiết bị y tế', 6, true, 'approved'),
  ('hotel_tourism_food', 'Khách sạn, Du lịch & Ẩm thực', '酒店、旅游与餐饮', 'Hospitality & Dining', 'Utensils', 'Khách sạn, du lịch, nhà hàng và dịch vụ ẩm thực', 7, true, 'approved'),
  ('architecture_construction_materials', 'Kiến trúc, Xây dựng & Vật liệu', '建筑与建材', 'Architecture & Construction', 'Building2', 'Kiến trúc, xây dựng, công trình và vật liệu', 8, true, 'approved'),
  ('legal_hr_office', 'Pháp lý, Nhân sự & Văn phòng', '法律、人力与商务', 'Legal, HR & Office', 'Scale', 'Pháp lý, nhân sự, hành chính và nghiệp vụ văn phòng', 9, true, 'approved'),
  ('daily_chemicals_lifestyle', 'Hóa mỹ phẩm & Đời sống', '日化与生活', 'Beauty & Lifestyle', 'Sparkles', 'Hóa mỹ phẩm, chăm sóc cá nhân và sản phẩm đời sống', 10, true, 'approved')
ON CONFLICT (id) DO UPDATE SET
  name_vi = EXCLUDED.name_vi,
  name_zh = EXCLUDED.name_zh,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  description_vi = EXCLUDED.description_vi,
  sort_order = EXCLUDED.sort_order;

-- 2. Ensure Specialized Categories for the 10 Domains
INSERT INTO public.specialized_categories (id, domain_id, name_vi, name_zh, sort_order, term_count, publication_status, customer_visible)
VALUES
  ('logistics_customs', 'logistics_customs', 'Logistics & Hải quan', '物流与海关', 1, 800, 'approved', true),
  ('mechanical_manufacturing', 'mechanical_manufacturing', 'Cơ khí & Sản xuất chế tạo', '机械与制造', 2, 1600, 'approved', true),
  ('textile_footwear', 'textile_footwear', 'Dệt may & Da giày', '纺织服装与鞋业', 3, 380, 'approved', true),
  ('it_electronics', 'it_electronics', 'Công nghệ Thông tin & Điện tử', '信息技术与电子', 4, 1220, 'approved', true),
  ('finance_banking_accounting', 'finance_banking_accounting', 'Tài chính, Ngân hàng & Kế toán', '金融、银行与会计', 5, 400, 'approved', true),
  ('healthcare_pharma', 'healthcare_pharma', 'Y tế, Bệnh viện & Dược phẩm', '医疗、医院与药剂', 6, 400, 'approved', true),
  ('hotel_tourism_food', 'hotel_tourism_food', 'Khách sạn, Du lịch & Ẩm thực', '酒店、旅游与餐饮', 7, 400, 'approved', true),
  ('architecture_construction_materials', 'architecture_construction_materials', 'Kiến trúc, Xây dựng & Vật liệu', '建筑与建材', 8, 800, 'approved', true),
  ('legal_hr_office', 'legal_hr_office', 'Pháp lý, Nhân sự & Văn phòng', '法律、人力与商务', 9, 2400, 'approved', true),
  ('daily_chemicals_lifestyle', 'daily_chemicals_lifestyle', 'Hóa mỹ phẩm & Đời sống', '日化与生活', 10, 1600, 'approved', true)
ON CONFLICT (id) DO UPDATE SET
  name_vi = EXCLUDED.name_vi,
  name_zh = EXCLUDED.name_zh,
  term_count = EXCLUDED.term_count;

-- 3. Update specialized_vocabulary columns & check constraints
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS example_sentence text;
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS example_pinyin text;
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS example_vietnamese text;
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS canonical_hanzi text;
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS duplicate_action text DEFAULT 'unique';
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS duplicate_group_id text;
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS duplicate_scope text;
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS example_provenance text;
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS example_review_status text;

-- Relax / drop old check constraints if they are overly restrictive
ALTER TABLE public.specialized_vocabulary DROP CONSTRAINT IF EXISTS specialized_vocabulary_publication_status_check;
ALTER TABLE public.specialized_vocabulary DROP CONSTRAINT IF EXISTS specialized_vocabulary_publish_gate_check;

ALTER TABLE public.specialized_vocabulary ADD CONSTRAINT specialized_vocabulary_pub_status_chk
  CHECK (publication_status IN ('draft', 'review_required', 'approved', 'published', 'rejected', 'archived'));

ALTER TABLE public.specialized_vocabulary ADD CONSTRAINT specialized_vocabulary_pub_gate_chk
  CHECK (publish_gate IN ('open', 'ready_for_publish', 'blocked_review_required', 'blocked_quality', 'blocked_source'));

-- Additional indexes for high performance search
CREATE INDEX IF NOT EXISTS idx_spec_vocab_pinyin ON public.specialized_vocabulary(pinyin);
CREATE INDEX IF NOT EXISTS idx_spec_vocab_vietnamese ON public.specialized_vocabulary USING gin (to_tsvector('simple', vietnamese));
CREATE INDEX IF NOT EXISTS idx_spec_vocab_subcategory ON public.specialized_vocabulary(subcategory);
CREATE INDEX IF NOT EXISTS idx_spec_vocab_dup_action ON public.specialized_vocabulary(duplicate_action);

-- 4. Learner-Facing Catalog View (Section 58)
DROP VIEW IF EXISTS public.specialized_catalog CASCADE;
CREATE VIEW public.specialized_catalog AS
SELECT *
FROM public.specialized_vocabulary
WHERE (customer_visible = true OR duplicate_action IN ('unique', 'keep_primary'));

-- 5. External Dictionary Cache Table (Section 43)
CREATE TABLE IF NOT EXISTS public.dictionary_external_cache (
    id text PRIMARY KEY,
    query text NOT NULL,
    normalized_query text NOT NULL,
    provider text NOT NULL,
    source text NOT NULL,
    response_json jsonb NOT NULL,
    source_version text,
    retrieved_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    status text DEFAULT 'active',
    error_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dict_ext_cache_query ON public.dictionary_external_cache(normalized_query);
CREATE INDEX IF NOT EXISTS idx_dict_ext_cache_prov ON public.dictionary_external_cache(provider);

ALTER TABLE public.dictionary_external_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dictionary_external_cache' AND policyname = 'Allow public read on dictionary_external_cache'
  ) THEN
    CREATE POLICY "Allow public read on dictionary_external_cache" ON public.dictionary_external_cache FOR SELECT USING (true);
  END IF;
END
$$;

-- 6. Server-Side Unified Dictionary Search RPC (Section 39)
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
    v_norm text;
    v_results jsonb;
BEGIN
    v_norm := lower(trim(p_query));
    
    -- Search across HSK vocabulary and Specialized vocabulary
    WITH hsk_matches AS (
        SELECT 
            v.id::text AS id,
            v.hanzi,
            v.pinyin,
            v.vietnamese,
            v.word_type,
            'hsk' AS source_type,
            'HSK ' || v.hsk_level AS source_label,
            v.hsk_level,
            NULL::text AS domain_id,
            NULL::text AS subcategory,
            1 AS priority
        FROM public.hsk_vocabulary v
        WHERE v.hanzi = p_query
           OR lower(v.pinyin) = v_norm
           OR lower(v.vietnamese) = v_norm
           OR v.hanzi ILIKE '%' || p_query || '%'
           OR v.pinyin ILIKE '%' || v_norm || '%'
           OR v.vietnamese ILIKE '%' || v_norm || '%'
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
             OR lower(s.pinyin) = v_norm
             OR lower(s.vietnamese) = v_norm
             OR s.hanzi ILIKE '%' || p_query || '%'
             OR s.pinyin ILIKE '%' || v_norm || '%'
             OR s.vietnamese ILIKE '%' || v_norm || '%'
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

-- Permissions & Grants
GRANT SELECT ON public.specialized_domains TO anon, authenticated;
GRANT SELECT ON public.specialized_categories TO anon, authenticated;
GRANT SELECT ON public.specialized_vocabulary TO anon, authenticated;
GRANT SELECT ON public.specialized_catalog TO anon, authenticated;
GRANT SELECT ON public.dictionary_external_cache TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_dictionary(text, int, int) TO anon, authenticated;
