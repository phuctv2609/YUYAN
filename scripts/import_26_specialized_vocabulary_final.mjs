import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env.local', 'utf8');
const url = envText.match(/VITE_SUPABASE_URL=["']?([^"'\r\n]+)/)[1];
const adminText = fs.existsSync('.env.admin.local') ? fs.readFileSync('.env.admin.local', 'utf8') : '';
const serviceKey = adminText.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\r\n]+)/)[1];

const supabase = createClient(url, serviceKey);

async function run() {
  console.log('=== YUYAN — SAFE IDEMPOTENT IMPORT: 10,000 RECORDS INTO specialized_vocabulary ===');

  // 1. Validate preconditions
  const { count: domainCount } = await supabase.from('specialized_domains').select('*', { count: 'exact', head: true });
  const { count: categoryCount } = await supabase.from('specialized_categories').select('*', { count: 'exact', head: true });
  console.log(`Preconditions: domains = ${domainCount} (expected 26), categories = ${categoryCount} (expected 500)`);
  if (domainCount !== 26 || categoryCount !== 500) {
    throw new Error(`Invalid preconditions: expected 26 domains and 500 categories, found ${domainCount} and ${categoryCount}`);
  }

  // 2. Read source data
  const raw = fs.readFileSync('data/professional/yuyan_professional_vocabulary_10000_v2.json', 'utf8');
  const items = JSON.parse(raw);
  if (items.length !== 10000) {
    throw new Error(`Expected exactly 10,000 items, got ${items.length}`);
  }

  const industriesMeta = JSON.parse(fs.readFileSync('scripts/industries_meta_26.json', 'utf8'));
  const categoryMap = JSON.parse(fs.readFileSync('scripts/category_map_26.json', 'utf8'));

  // Read categories from migration SQL to get the contiguous domain order and counts
  const sql = fs.readFileSync('supabase/migrations/20261008220000_rebuild_26_industries_10k.sql', 'utf8');
  const catMatches = [...sql.matchAll(/\('([a-z0-9_]+)',\s*'([a-z0-9_]+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+)/g)];

  const domainTermCounts = new Map();
  for (const m of catMatches) {
    const domId = m[2];
    const count = parseInt(m[6], 10);
    domainTermCounts.set(domId, (domainTermCounts.get(domId) || 0) + count);
  }

  // 3. Transform and map items
  const mappedRecords = [];
  let itemIdx = 0;

  for (const [domId, expectedCount] of domainTermCounts.entries()) {
    const domMeta = industriesMeta.find(m => m.slug === domId);
    const domIndustryName = domMeta?.name_vi || domId;
    const domainItems = items.slice(itemIdx, itemIdx + expectedCount);

    for (const it of domainItems) {
      const key = `${domId}:::${it.subcategory}`;
      const categoryId = categoryMap[key];
      if (!categoryId) {
        throw new Error(`Missing category mapping for key: "${key}" at item ${it.id}`);
      }

      // Arrays parsing
      let coll = [];
      if (it.collocations && it.collocations.trim()) {
        coll = it.collocations.split(/[;,]/).map(s => s.trim()).filter(Boolean);
      }
      let syn = [];
      if (it.synonyms && it.synonyms.trim()) {
        syn = it.synonyms.split(/[;,]/).map(s => s.trim()).filter(Boolean);
      }
      let ant = [];
      if (it.antonyms && it.antonyms.trim()) {
        ant = it.antonyms.split(/[;,]/).map(s => s.trim()).filter(Boolean);
      }
      let rel = [];
      if (it.related_terms && it.related_terms.trim()) {
        rel = it.related_terms.split(/[;,]/).map(s => s.trim()).filter(Boolean);
      }
      let tgs = [];
      if (it.tags && it.tags.trim()) {
        tgs = it.tags.split(/[;,]/).map(s => s.trim()).filter(Boolean);
      }
      let qf = [];
      if (it.quality_flags && it.quality_flags.trim()) {
        qf = it.quality_flags.split(';').map(s => s.trim()).filter(Boolean);
      }

      mappedRecords.push({
        id: it.id,
        category_id: categoryId,
        domain_id: domId,
        industry: domIndustryName,
        subcategory: it.subcategory,
        hanzi: it.hanzi,
        pinyin: it.pinyin,
        vietnamese: it.vietnamese,
        han_viet: it.han_viet || null,
        traditional: it.canonical_hanzi || it.hanzi,
        canonical_hanzi: it.canonical_hanzi || it.hanzi,
        part_of_speech: it.word_type || 'Chuyên ngành',
        definition_vi: it.vietnamese,
        sample_sentence_zh: it.example_sentence || null,
        sample_sentence_pinyin: it.example_pinyin || null,
        sample_sentence_vi: it.example_vietnamese || null,
        example_sentence: it.example_sentence || null,
        example_pinyin: it.example_pinyin || null,
        example_vietnamese: it.example_vietnamese || null,
        collocations: coll,
        synonyms: syn,
        antonyms: ant,
        related_terms: rel,
        tags: tgs,
        quality_flags: qf,
        frequency_rank: parseInt(it.frequency, 10) || 1,
        level: it.level || 'Chuyên ngành',
        entry_type: it.entry_type || 'professional_collocation',
        source: 'Yuyan Professional Vocabulary 10000',
        source_version: '2.0.0',
        source_record_id: it.id,
        publication_status: 'approved',
        customer_visible: true,
        publish_gate: 'open',
        review_required: it.status === 'review_required',
        duplicate_action: it.duplicate_action || 'unique',
        is_duplicate_secondary: it.duplicate_action === 'retain_source_duplicate_hidden',
        example_provenance: it.example_provenance || null,
        example_review_status: it.example_review_status || null,
      });
    }

    itemIdx += expectedCount;
  }

  console.log(`Mapped total ${mappedRecords.length} records across 26 domains.`);
  if (mappedRecords.length !== 10000) {
    throw new Error(`Assertion failed: expected 10,000 mapped records, got ${mappedRecords.length}`);
  }

  // 4. Batch upsert in chunks of 250
  const chunkSize = 250;
  console.log(`Inserting in batches of ${chunkSize}...`);
  for (let i = 0; i < mappedRecords.length; i += chunkSize) {
    const chunk = mappedRecords.slice(i, i + chunkSize);
    const { error: insErr } = await supabase.from('specialized_vocabulary').upsert(chunk, { onConflict: 'id' });
    if (insErr) {
      throw new Error(`Upsert error at chunk [${i} .. ${i + chunk.length}]: ${insErr.message}`);
    }
    const pct = Math.min(100, Math.round(((i + chunk.length) / mappedRecords.length) * 100));
    console.log(`Progress: ${i + chunk.length} / ${mappedRecords.length} (${pct}%)`);
  }

  // 5. Verification
  const { count: finalCount, error: cntErr } = await supabase.from('specialized_vocabulary').select('*', { count: 'exact', head: true });
  if (cntErr) throw cntErr;
  console.log(`\n=== VERIFICATION: Total in specialized_vocabulary: ${finalCount} ===`);
  if (finalCount !== 10000) {
    throw new Error(`Count verification failed: found ${finalCount}, expected 10,000!`);
  }

  // Update term_count in specialized_domains to exact verified counts
  for (const [domId, count] of domainTermCounts.entries()) {
    await supabase.from('specialized_domains').update({ term_count: count }).eq('id', domId);
  }
  console.log('Updated term_count on all specialized_domains.');

  // Test sample queries (Văn phòng - doanh nghiệp / hành chính)
  const { data: vpTest, count: vpCount } = await supabase
    .from('specialized_vocabulary')
    .select('id, hanzi, pinyin, vietnamese, subcategory', { count: 'exact' })
    .eq('domain_id', 'van_phong_doanh_nghiep')
    .eq('category_id', 'van_phong_doanh_nghiep_hanh_chinh');

  console.log(`\nSample test for "van_phong_doanh_nghiep" + "hành chính": count = ${vpCount}`);
  console.log('Sample rows:', vpTest?.slice(0, 3));

  console.log('\nSUCCESS! Specialized vocabulary imported and verified perfectly.');
}

run().catch(err => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
