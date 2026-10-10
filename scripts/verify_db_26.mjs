import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

async function verifyCounts() {
  const industriesMeta = JSON.parse(fs.readFileSync('scripts/industries_meta_26.json', 'utf-8'));
  console.log('Verifying all 26 industries in specialized_vocabulary:');
  let total = 0;
  for (const ind of industriesMeta) {
    const { count, error } = await supabase
      .from('specialized_vocabulary')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', ind.slug);
    console.log(`  - ${ind.name_vi} (${ind.slug}): ${count} terms`);
    total += count;
  }
  console.log(`Total across all 26 industries: ${total}`);

  // Also update term_count in specialized_domains if desired
  for (const ind of industriesMeta) {
    const { count } = await supabase
      .from('specialized_vocabulary')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', ind.slug);
    await supabase.from('specialized_domains').update({ term_count: count }).eq('id', ind.slug);
  }

  // Test RPC search_dictionary
  const { data: rpcRes, error: rpcErr } = await supabase.rpc('search_dictionary', {
    p_query: 'hải quan',
    p_limit: 5,
    p_offset: 0
  });
  console.log('Test search_dictionary for "hải quan":', rpcRes?.length, 'results. First:', rpcRes?.[0]);
}

verifyCounts();
