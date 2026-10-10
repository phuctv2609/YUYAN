import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const anonKey = envLocal.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const supabase = createClient(url, anonKey);

async function testDictionarySearch() {
  console.log('=== TESTING UNIFIED DICTIONARY DATA SOURCES ===\n');

  // 1. Search HSK for "你好"
  const { data: hskData } = await supabase
    .from('hsk_vocabulary')
    .select('*')
    .or('hanzi.eq.你好,hanzi.ilike.%你好%')
    .limit(3);
  console.log('1. HSK matches for "你好":', hskData?.map(h => `${h.hanzi} [${h.pinyin}] - ${h.vietnamese} (HSK ${h.hsk_level})`));

  // 2. Search Professional 10,000 for "报关"
  const { data: profData } = await supabase
    .from('specialized_vocabulary')
    .select('*')
    .or('hanzi.eq.报关,hanzi.ilike.%报关%')
    .in('duplicate_action', ['unique', 'keep_primary'])
    .limit(3);
  console.log('\n2. Professional matches for "报关":', profData?.map(p => `${p.hanzi} [${p.pinyin}] - ${p.vietnamese} (${p.domain_id} / ${p.subcategory})`));

  // 3. Search Hanzi for "关"
  const { data: hanziData } = await supabase
    .from('canonical_hanzi')
    .select('*')
    .eq('char', '关')
    .limit(1);
  console.log('\n3. Canonical Hanzi match for "关":', hanziData?.map(h => `${h.char} [${h.pinyin}] - ${h.meanings?.join(', ')} (Strokes: ${h.stroke_count}, Radical: ${h.radical_number})`));

  // 4. Search Vietnamese "khai báo hải quan"
  const { data: viData } = await supabase
    .from('specialized_vocabulary')
    .select('*')
    .ilike('vietnamese', '%khai báo hải quan%')
    .limit(3);
  console.log('\n4. Vietnamese match for "khai báo hải quan":', viData?.map(v => `${v.hanzi} [${v.pinyin}] - ${v.vietnamese}`));

  // 5. Test RPC search_dictionary
  const { data: rpcData, error: rpcErr } = await supabase.rpc('search_dictionary', {
    p_query: '报关',
    p_limit: 5,
    p_offset: 0
  });
  console.log('\n5. RPC search_dictionary for "报关":', rpcData?.length, 'results. Error:', rpcErr?.message);
  if (rpcData && rpcData.length > 0) {
    console.log('Sample RPC result:', rpcData[0]);
  }
}

testDictionarySearch().catch(console.error);
