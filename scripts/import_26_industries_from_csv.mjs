import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Parse CSV with quotes support
function parseCSV(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      if (currentRow.length > 1 || currentRow[0] !== '') {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1 || currentRow[0] !== '') {
      rows.push(currentRow);
    }
  }

  return rows;
}

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

async function run() {
  console.log('=== IMPORTING 10,000 REAL PROFESSIONAL RECORDS FROM CSV ===');
  const csvPath = 'C:/Users/Loan/Downloads/yuyan_10000_tu_chuyen_nganh.csv';
  console.log('Reading CSV:', csvPath);
  const raw = fs.readFileSync(csvPath, 'utf8');
  const allRows = parseCSV(raw);

  const header = allRows[0];
  const colIndex = {};
  header.forEach((name, idx) => {
    colIndex[name.trim()] = idx;
  });

  const categoryMap = JSON.parse(fs.readFileSync('scripts/category_map_26.json', 'utf-8'));
  const industriesMeta = JSON.parse(fs.readFileSync('scripts/industries_meta_26.json', 'utf-8'));
  const industrySlugMap = new Map();
  industriesMeta.forEach(m => industrySlugMap.set(m.name_vi, m.slug));

  const records = [];
  for (let i = 1; i < allRows.length; i++) {
    const row = allRows[i];
    if (!row || row.length < 5) continue;

    const id = row[colIndex['id']]?.trim();
    const hanzi = row[colIndex['hanzi']]?.trim();
    const pinyin = row[colIndex['pinyin']]?.trim();
    const wordType = row[colIndex['word_type']]?.trim() || '专业词组';
    const vietnamese = row[colIndex['vietnamese']]?.trim();
    const hanViet = row[colIndex['han_viet']]?.trim() || null;
    const industry = row[colIndex['industry']]?.trim();
    const subcategory = row[colIndex['subcategory']]?.trim();
    const level = row[colIndex['level']]?.trim() || 'Chuyên ngành';
    const entryType = row[colIndex['entry_type']]?.trim() || 'professional_collocation';
    const exampleZh = row[colIndex['example_sentence']]?.trim() || null;
    const examplePy = row[colIndex['example_pinyin']]?.trim() || null;
    const exampleVi = row[colIndex['example_vietnamese']]?.trim() || null;
    const collocationsRaw = row[colIndex['collocations']]?.trim() || '';
    const synonymsRaw = row[colIndex['synonyms']]?.trim() || '';
    const antonymsRaw = row[colIndex['antonyms']]?.trim() || '';
    const relatedTermsRaw = row[colIndex['related_terms']]?.trim() || '';
    const freqRaw = row[colIndex['frequency']]?.trim() || '1';
    const tagsRaw = row[colIndex['tags']]?.trim() || '';

    const domainId = industrySlugMap.get(industry);
    if (!domainId) {
      console.error(`Unknown industry at row ${i}: "${industry}"`);
      continue;
    }
    const catKey = `${domainId}:::${subcategory}`;
    const categoryId = categoryMap[catKey];
    if (!categoryId) {
      console.error(`Missing categoryId for: "${catKey}"`);
      continue;
    }

    const collocations = collocationsRaw ? collocationsRaw.split(/[;,]/).map(s => s.trim()).filter(Boolean) : [];
    const synonyms = synonymsRaw ? synonymsRaw.split(/[;,]/).map(s => s.trim()).filter(Boolean) : [];
    const antonyms = antonymsRaw ? antonymsRaw.split(/[;,]/).map(s => s.trim()).filter(Boolean) : [];
    const relatedTerms = relatedTermsRaw ? relatedTermsRaw.split(/[;,]/).map(s => s.trim()).filter(Boolean) : [];
    const tags = tagsRaw ? tagsRaw.split(/[;,]/).map(s => s.trim()).filter(Boolean) : [];

    records.push({
      id,
      category_id: categoryId,
      domain_id: domainId,
      industry,
      subcategory,
      hanzi,
      pinyin,
      vietnamese,
      han_viet: hanViet,
      traditional: hanzi,
      part_of_speech: wordType,
      definition_vi: vietnamese,
      sample_sentence_zh: exampleZh,
      sample_sentence_pinyin: examplePy,
      sample_sentence_vi: exampleVi,
      example_sentence: exampleZh,
      example_pinyin: examplePy,
      example_vietnamese: exampleVi,
      collocations,
      synonyms,
      antonyms,
      related_terms: relatedTerms,
      tags,
      frequency_rank: parseInt(freqRaw, 10) || 1,
      level,
      entry_type: entryType,
      source: 'Yuyan Professional Vocabulary 10000',
      source_version: '2.0.0',
      source_record_id: id,
      publication_status: 'approved',
      customer_visible: true,
      publish_gate: 'open',
      duplicate_action: 'unique',
      canonical_hanzi: hanzi
    });
  }

  console.log(`Parsed ${records.length} records ready for insertion.`);
  if (records.length !== 10000) {
    throw new Error(`Expected 10,000 records, got ${records.length}`);
  }

  // Insert in batches of 250
  const batchSize = 250;
  console.log(`Inserting in batches of ${batchSize}...`);
  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);
    const { error } = await supabase.from('specialized_vocabulary').insert(chunk);
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
      throw error;
    }
    const percent = Math.min(100, Math.round(((i + chunk.length) / records.length) * 100));
    console.log(`Progress: ${i + chunk.length} / ${records.length} (${percent}%)`);
  }

  console.log('✅ Successfully imported 10,000 records into specialized_vocabulary!');

  // Verify total count
  const { count, error: countErr } = await supabase.from('specialized_vocabulary').select('*', { count: 'exact', head: true });
  console.log('Final specialized_vocabulary count:', count, 'error:', countErr?.message);
}

run().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
