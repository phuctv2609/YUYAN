import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Read env variables
const envLocal = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envLocal.match(/VITE_SUPABASE_URL=(.+)/);
const adminLocal = fs.existsSync('.env.admin.local') ? fs.readFileSync('.env.admin.local', 'utf-8') : '';
const adminMatch = adminLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

if (!urlMatch || !adminMatch) {
  throw new Error('Missing Supabase URL or SERVICE_ROLE_KEY in .env files');
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = adminMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  const headerLine = lines[0].replace(/^\uFEFF/, '').trim();
  const headers = splitCsvLine(headerLine);
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCsvLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    records.push(obj);
  }
  return records;
}

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

async function run() {
  console.log('=== YUYAN PROFESSIONAL VOCABULARY v2 INGESTION ===');
  
  // 1. Process and Ingest Categories
  const catCsvPath = 'data/professional/yuyan_professional_categories_v2.csv';
  const catCsvRaw = fs.readFileSync(catCsvPath, 'utf-8');
  const catRecords = parseCsv(catCsvRaw);
  console.log(`Parsed ${catRecords.length} professional categories from CSV`);
  
  const categoriesToUpsert = catRecords.map(c => ({
    id: c.id,
    name_vi: c.name_vi,
    name_zh: c.name_zh,
    description: c.description || null,
    icon: c.icon || null,
    sort_order: parseInt(c.sort_order, 10) || 0,
    term_count: parseInt(c.term_count, 10) || 0,
    source_term_count: parseInt(c.source_term_count, 10) || 0,
    customer_visible: c.customer_visible === 'true' || c.customer_visible === true,
    data_quality_gate: c.data_quality_gate || 'review_required',
    status: c.status || 'active',
  }));

  console.log('Upserting professional categories into Supabase...');
  const { error: catError } = await supabase.from('professional_categories').upsert(categoriesToUpsert);
  if (catError) {
    throw new Error(`Category upsert error: ${catError.message}`);
  }
  console.log(`Successfully upserted ${categoriesToUpsert.length} categories.`);

  // 2. Read and Validate JSON (10,000 records)
  const jsonPath = 'data/professional/yuyan_professional_vocabulary_10000_v2.json';
  const jsonRaw = fs.readFileSync(jsonPath, 'utf-8');
  const rawVocab = JSON.parse(jsonRaw);

  console.log(`Read ${rawVocab.length} records from JSON file`);
  if (rawVocab.length !== 10000) {
    throw new Error(`FATAL: Expected exactly 10,000 records, but found ${rawVocab.length}. STOPPING!`);
  }

  // 3. Transform to database schema
  const vocabularyToUpsert = rawVocab.map(r => ({
    id: r.id,
    hanzi: r.hanzi,
    pinyin: r.pinyin,
    word_type: r.word_type || null,
    vietnamese: r.vietnamese,
    han_viet: r.han_viet || null,
    category_id: r.category_id,
    category_vi: r.category_vi || null,
    category_zh: r.category_zh || null,
    subcategory: r.subcategory || null,
    level: r.level || null,
    entry_type: r.entry_type || null,
    example_sentence: r.example_sentence || null,
    example_pinyin: r.example_pinyin || null,
    example_vietnamese: r.example_vietnamese || null,
    collocations: r.collocations || null,
    synonyms: r.synonyms || null,
    antonyms: r.antonyms || null,
    related_terms: r.related_terms || null,
    audio: r.audio || null,
    frequency: r.frequency ? parseFloat(r.frequency) : null,
    tags: r.tags || null,
    icon: r.icon || null,
    duplicate_hanzi: r.duplicate_hanzi === 'true' || r.duplicate_hanzi === true,
    canonical_hanzi: r.canonical_hanzi || null,
    status: r.status || 'review_required',
    source: r.source || null,
    version: r.version || null,
    example_provenance: r.example_provenance || null,
    example_review_status: r.example_review_status || null,
    quality_flags: r.quality_flags || null,
    customer_visible: r.customer_visible === 'true' || r.customer_visible === true,
    publish_gate: r.publish_gate || 'blocked_review_required',
    duplicate_group_id: r.duplicate_group_id || null,
    duplicate_scope: r.duplicate_scope || null,
    duplicate_action: r.duplicate_action || 'unique',
  }));

  // 4. Batch upsert in chunks of 250
  const chunkSize = 250;
  console.log(`Starting batch upsert of ${vocabularyToUpsert.length} items (chunk size: ${chunkSize})...`);
  
  for (let i = 0; i < vocabularyToUpsert.length; i += chunkSize) {
    const chunk = vocabularyToUpsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('professional_vocabulary').upsert(chunk);
    if (error) {
      throw new Error(`Batch upsert error at range [${i} - ${i + chunk.length}]: ${error.message}`);
    }
    if ((i + chunkSize) % 1000 === 0 || i + chunk.length === vocabularyToUpsert.length) {
      console.log(`Progress: Ingested ${Math.min(i + chunkSize, vocabularyToUpsert.length)} / ${vocabularyToUpsert.length} records`);
    }
  }

  // 5. Verification queries
  const { count: catCount, error: catVerifyErr } = await supabase.from('professional_categories').select('*', { count: 'exact', head: true });
  if (catVerifyErr) throw catVerifyErr;

  const { count: vocabCount, error: vocabVerifyErr } = await supabase.from('professional_vocabulary').select('*', { count: 'exact', head: true });
  if (vocabVerifyErr) throw vocabVerifyErr;

  console.log('=== VERIFICATION SUMMARY ===');
  console.log(`professional_categories count in Supabase: ${catCount} (expected: 10)`);
  console.log(`professional_vocabulary count in Supabase: ${vocabCount} (expected: 10000)`);

  if (vocabCount !== 10000) {
    throw new Error(`Discrepancy detected: Supabase count is ${vocabCount}, expected 10000!`);
  }

  console.log('SUCCESS: All 10,000 professional vocabulary records verified in Supabase!');
}

run().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
