import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const anonKey = envLocal.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const supabase = createClient(url, anonKey);

async function testRpc() {
  // 1. Search words
  const { data: searchData, error: searchErr } = await supabase.rpc('search_hsk_master_words', {
    p_framework: 'hsk2',
    p_level_code: 'old-1',
    p_list_type: 'exclusive',
    p_query: '',
    p_pos: null,
    p_radical: null,
    p_learner_id: '00000000-0000-0000-0000-000000000000',
    p_status: 'all',
    p_limit: 5,
    p_offset: 0
  });

  if (searchErr) {
    console.error('search error:', searchErr);
    return;
  }
  console.log('Search returned:', searchData?.length, 'words');
  const firstWord = searchData[0];
  console.log('First word:', firstWord?.simplified, firstWord?.id);

  // 2. Call get_hsk_word_master_detail
  const { data: detailData, error: detailErr } = await supabase.rpc('get_hsk_word_master_detail', {
    p_entry_id: firstWord.id,
    p_learner_id: '00000000-0000-0000-0000-000000000000'
  });

  if (detailErr) {
    console.error('detail error:', detailErr);
  } else {
    console.log('Detail returned successfully!');
    console.log('Keys:', Object.keys(detailData || {}));
    console.log('Entry:', detailData.entry?.simplified, detailData.entry?.meanings_vi);
  }
}

testRpc();
