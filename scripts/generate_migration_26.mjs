import fs from 'fs';
import readline from 'readline';

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function buildMigration() {
  const industriesMeta = JSON.parse(fs.readFileSync('scripts/industries_meta_26.json', 'utf-8'));
  const industryMetaMap = new Map();
  industriesMeta.forEach((item, idx) => {
    industryMetaMap.set(item.name_vi, { ...item, sort_order: idx + 1 });
  });

  const rl = readline.createInterface({
    input: fs.createReadStream('C:/Users/Loan/Downloads/yuyan_10000_tu_chuyen_nganh.csv'),
    crlfDelay: Infinity
  });

  const categoryCounts = new Map(); // key: domain_id + ':::' + subcat -> count
  let isHeader = true;
  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    const parts = line.split(',');
    const industryName = parts[6]?.trim();
    const subcat = parts[7]?.trim();
    if (!industryName) continue;
    const meta = industryMetaMap.get(industryName);
    if (!meta) {
      console.error('Unknown industry:', industryName);
      continue;
    }
    const key = meta.slug + ':::' + subcat;
    categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
  }

  let sql = `-- ============================================================================
-- YUYAN — REBUILD 26 REAL INDUSTRIES AND CATEGORIES (10,000 PROFESSIONAL TERMS)
-- Source: C:\\Users\\Loan\\Downloads\\yuyan_10000_tu_chuyen_nganh.csv
-- ============================================================================

-- 1. Ensure columns on specialized_vocabulary
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.specialized_vocabulary ADD COLUMN IF NOT EXISTS subcategory text;

-- 2. Clean existing specialized_vocabulary, categories, and domains cleanly
DELETE FROM public.specialized_vocabulary;
DELETE FROM public.specialized_categories;
DELETE FROM public.specialized_domains;

-- 3. Insert 26 Authoritative Real Industries
INSERT INTO public.specialized_domains (id, name_vi, name_zh, name_en, icon, description_vi, sort_order, customer_visible, publication_status)
VALUES
`;

  const domainRows = industriesMeta.map((m, idx) => {
    return `  ('${m.slug}', '${m.name_vi}', '${m.name_zh}', '${m.name_en}', '${m.icon}', '${m.desc.replace(/'/g, "''")}', ${idx + 1}, true, 'approved')`;
  }).join(',\n');
  sql += domainRows + ';\n\n';

  sql += `-- 4. Insert Categories per Industry\nINSERT INTO public.specialized_categories (id, domain_id, name_vi, name_zh, sort_order, term_count, publication_status, customer_visible)\nVALUES\n`;

  const catRows = [];
  const categoryMap = {}; // mapping key "domain_id:::subcat" -> catId
  const usedCatIds = new Set();
  let catSort = 1;

  for (const [key, count] of categoryCounts) {
    const [domainId, subcat] = key.split(':::');
    let catId = domainId + '_' + slugify(subcat);
    if (usedCatIds.has(catId)) {
      let counter = 2;
      while (usedCatIds.has(`${catId}_${counter}`)) {
        counter++;
      }
      catId = `${catId}_${counter}`;
    }
    usedCatIds.add(catId);
    categoryMap[key] = catId;

    catRows.push(`  ('${catId}', '${domainId}', '${subcat.replace(/'/g, "''")}', '${subcat.replace(/'/g, "''")}', ${catSort++}, ${count}, 'approved', true)`);
  }
  sql += catRows.join(',\n') + ';\n\n';

  sql += `-- 5. Create / Update indexes for high-speed server pagination
CREATE INDEX IF NOT EXISTS idx_spec_vocab_industry ON public.specialized_vocabulary(industry);
CREATE INDEX IF NOT EXISTS idx_spec_vocab_domain_id ON public.specialized_vocabulary(domain_id);
CREATE INDEX IF NOT EXISTS idx_spec_vocab_subcat ON public.specialized_vocabulary(subcategory);
CREATE INDEX IF NOT EXISTS idx_spec_vocab_cat_id ON public.specialized_vocabulary(category_id);

-- 6. Update search_dictionary RPC to support 26 industries
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
    v_norm := translate(v_clean, 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü', 'aaaaeeeeiiiioooouuuuuuuuu');
    v_norm := regexp_replace(v_norm, '([a-z])[1-5]', '\\1', 'g');

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
$$;
`;

  fs.writeFileSync('supabase/migrations/20261008220000_rebuild_26_industries_10k.sql', sql);
  fs.writeFileSync('scripts/category_map_26.json', JSON.stringify(categoryMap, null, 2));
  console.log('Migration generated! Total categories:', catRows.length, 'Unique category IDs:', usedCatIds.size);
}

buildMigration();
