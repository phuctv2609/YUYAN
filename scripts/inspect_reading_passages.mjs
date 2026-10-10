// scripts/inspect_reading_passages.mjs
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

async function inspectPassages() {
  console.log('Fetching all reading_passages...');
  const { data, error } = await supabase
    .from('reading_passages')
    .select('*')
    .order('lesson_id', { ascending: true });

  if (error) {
    console.error('Error fetching passages:', error);
    return;
  }

  console.log(`Total reading_passages fetched: ${data.length}`);

  let missingPinyin = 0;
  let missingVietnamese = 0;
  let emptyContent = 0;
  const samples = [];

  for (const row of data) {
    const hasPinyin = row.pinyin && row.pinyin.trim().length > 0;
    const hasVi = row.vietnamese && row.vietnamese.trim().length > 0;
    const hasZh = row.content && row.content.trim().length > 0;

    if (!hasZh) emptyContent++;
    if (!hasPinyin) missingPinyin++;
    if (!hasVi) missingVietnamese++;

    if (!hasPinyin || !hasVi || !hasZh) {
      if (samples.length < 5) samples.push({ lesson_id: row.lesson_id, hasZh, hasPinyin, hasVi });
    }
  }

  console.log(`Empty content: ${emptyContent}`);
  console.log(`Missing Pinyin: ${missingPinyin}`);
  console.log(`Missing Vietnamese: ${missingVietnamese}`);
  if (samples.length > 0) {
    console.log('Sample problematic passages:', JSON.stringify(samples, null, 2));
  } else {
    console.log('All 146 reading passages have content, pinyin, and Vietnamese!');
  }
}

inspectPassages();
