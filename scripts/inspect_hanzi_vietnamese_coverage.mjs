// scripts/inspect_hanzi_vietnamese_coverage.mjs
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

async function checkCoverage() {
  console.log('Fetching all 6,500 canonical_hanzi...');
  let allChars = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from('canonical_hanzi').select('char, han_viet, meanings, stroke_count').range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allChars.push(...data);
    page++;
  }
  console.log(`Loaded ${allChars.length} characters.`);

  // Load HSK vocab mapping
  const { data: hskVocab } = await supabase.from('hsk_vocabulary').select('hanzi, vietnamese');
  const hskMap = new Map();
  for (const v of (hskVocab || [])) {
    if (v.hanzi && !hskMap.has(v.hanzi)) {
      hskMap.set(v.hanzi, v.vietnamese);
    }
  }

  // Load Specialized vocab mapping
  const { data: specVocab } = await supabase.from('specialized_vocabulary').select('hanzi, vietnamese');
  const specMap = new Map();
  for (const v of (specVocab || [])) {
    if (v.hanzi && !specMap.has(v.hanzi)) {
      specMap.set(v.hanzi, v.vietnamese);
    }
  }

  let hasHsk = 0;
  let hasSpec = 0;
  let hasHanViet = 0;
  let pureEnglishMeanings = 0;

  for (const c of allChars) {
    if (c.han_viet) hasHanViet++;
    if (hskMap.has(c.char)) hasHsk++;
    else if (specMap.has(c.char)) hasSpec++;

    const mStr = (c.meanings || []).join(' ');
    // Check if meanings has English phrases
    if (/^[a-zA-Z\s;,./'()\-]+$/.test(mStr.trim()) && mStr.trim().length > 0) {
      pureEnglishMeanings++;
    }
  }

  console.log(`Han-Viet present: ${hasHanViet} / ${allChars.length}`);
  console.log(`Single char in HSK vocab: ${hasHsk}`);
  console.log(`Single char in Specialized vocab: ${hasSpec}`);
  console.log(`Characters with purely English meanings: ${pureEnglishMeanings}`);
}

checkCoverage();
