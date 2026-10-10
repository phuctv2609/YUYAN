// scripts/audit_vietnamese_quality.mjs
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

async function runAudit() {
  console.log('Auditing Kangxi Radicals...');
  const { data: radicals, error: radErr } = await supabase
    .from('kangxi_radicals')
    .select('*')
    .order('radical_number', { ascending: true });

  if (radErr) console.error('Error radicals:', radErr);
  else {
    console.log(`Fetched ${radicals.length} radicals.`);
    const englishLeakRadicals = radicals.filter(r => {
      const txt = `${r.meaning || ''} ${r.meaning_vi || ''}`;
      return /\b(the|to|a|an|of|and|in|on|with|by|from|or)\b/i.test(txt);
    });
    console.log(`Radicals with possible English text: ${englishLeakRadicals.length}`);
    if (englishLeakRadicals.length > 0) {
      console.log('Sample leak radicals:', JSON.stringify(englishLeakRadicals.slice(0, 5), null, 2));
    }
  }

  console.log('\nAuditing Canonical Hanzi (all 6500)...');
  let offset = 0;
  let batchSize = 1000;
  let englishMeaningsCount = 0;
  let sampleEnglish = [];

  while (offset < 7000) {
    const { data: hanziBatch, error: hanziErr } = await supabase
      .from('canonical_hanzi')
      .select('char, han_viet, meanings, mnemonic, structure_name_vi')
      .range(offset, offset + batchSize - 1);

    if (hanziErr || !hanziBatch || hanziBatch.length === 0) break;

    for (const h of hanziBatch) {
      const meaningsStr = (h.meanings || []).join(' ');
      // check if any meaning contains english words like "to ", "of ", "the ", "with "
      if (/\b(to\s[a-z]|the\s|of\s|and\s|in\s|with\s|from\s|water|fire|tree|mountain|hand|mouth|door|sun|moon|gold)\b/i.test(meaningsStr)) {
        englishMeaningsCount++;
        if (sampleEnglish.length < 10) {
          sampleEnglish.push({ char: h.char, han_viet: h.han_viet, meanings: h.meanings });
        }
      }
    }
    offset += batchSize;
  }

  console.log(`Audited Canonical Hanzi: ${englishMeaningsCount} characters flagged with possible English tokens in meanings.`);
  if (sampleEnglish.length > 0) {
    console.log('Sample flagged hanzi:', JSON.stringify(sampleEnglish, null, 2));
  }
}

runAudit();
