import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const anonKey = envLocal.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

// Test using standard ANON key to verify public RLS and RPC access!
const supabase = createClient(url, anonKey);

const TEST_QUERIES = [
  '你好',
  '学习',
  'xuéxí',
  'zhongguo',
  '中国',
  '中國',
  'xin chào',
  'học tập'
];

async function runTests() {
  console.log('=== TESTING CVDICT SEARCH RPC (ANON ACCESS) ===\n');

  for (const q of TEST_QUERIES) {
    const t0 = Date.now();
    const { data, error } = await supabase.rpc('search_cvdict_entries', {
      p_query: q,
      p_limit: 5,
      p_offset: 0
    });
    const latency = Date.now() - t0;

    if (error) {
      console.error(`✖ Query "${q}" failed:`, error.message);
      continue;
    }

    console.log(`▶ Query: "${q}" (${latency}ms) — Total matches: ${data?.[0]?.total_count || 0}`);
    if (data && data.length > 0) {
      data.forEach((item, idx) => {
        console.log(`  ${idx + 1}. [${item.simplified} | ${item.traditional}] ${item.pinyin} (Score: ${item.score})`);
        console.log(`     Meanings: ${item.meanings_vi.slice(0, 3).join(' / ')}`);
      });

      // Test detail RPC on first item
      if (q === '你好' || q === '学习') {
        const { data: detail, error: detailErr } = await supabase.rpc('get_dictionary_word_detail', {
          p_id: data[0].id
        });
        if (detailErr) {
          console.error(`  Detail error:`, detailErr.message);
        } else {
          console.log(`  -> Detail for "${data[0].simplified}":`);
          console.log(`     HSK matches:`, detail.hsk_matches?.length || 0);
          console.log(`     Lesson occurrences:`, detail.lesson_occurrences?.length || 0);
          console.log(`     Hanzi breakdown:`, detail.hanzi_breakdown?.map(c => `${c.char} (${c.meanings?.[0] || ''})`).join(', '));
        }
      }
    } else {
      console.log('  No results found.');
    }
    console.log('');
  }
}

runTests().catch(console.error);
