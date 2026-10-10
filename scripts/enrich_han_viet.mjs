import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import hanzi from 'hanzi';

hanzi.start();

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

async function run() {
  console.log('Enriching Han-Viet readings for all 6,500 characters...');
  let kViMap = {};
  if (fs.existsSync('scratch/unihan/kVietnamese.json')) {
    kViMap = JSON.parse(fs.readFileSync('scratch/unihan/kVietnamese.json', 'utf8'));
  }

  // Load all canonical_hanzi
  let allChars = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from('canonical_hanzi').select('char, traditional, han_viet').range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allChars.push(...data);
    page++;
  }
  console.log(`Loaded ${allChars.length} characters.`);

  const updates = [];
  for (const c of allChars) {
    if (c.han_viet) continue;
    let hv = null;
    if (kViMap[c.char] && kViMap[c.char].length > 0) {
      hv = kViMap[c.char][0];
    } else {
      const defs = hanzi.definitionLookup(c.char) || [];
      const tradFromDefs = defs[0]?.traditional;
      if (c.traditional && kViMap[c.traditional] && kViMap[c.traditional].length > 0) {
        hv = kViMap[c.traditional][0];
      } else if (tradFromDefs && kViMap[tradFromDefs] && kViMap[tradFromDefs].length > 0) {
        hv = kViMap[tradFromDefs][0];
      }
    }
    if (hv) {
      updates.push({ char: c.char, han_viet: hv.toLowerCase().trim() });
    }
  }

  console.log(`Found ${updates.length} characters to update with Han-Viet!`);
  for (let i = 0; i < updates.length; i += 200) {
    const chunk = updates.slice(i, i + 200);
    for (const item of chunk) {
      await supabase.from('canonical_hanzi').update({ han_viet: item.han_viet }).eq('char', item.char);
    }
    console.log(`Updated ${Math.min(i + 200, updates.length)} / ${updates.length}...`);
  }

  // Verify '学'
  const { data: xue } = await supabase.from('canonical_hanzi').select('char, han_viet').eq('char', '学').single();
  console.log('Verified 学:', xue);
}

run().catch(console.error);
