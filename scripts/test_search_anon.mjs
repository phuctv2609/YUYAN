import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const anonKey = envLocal.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const supabase = createClient(url, anonKey);

async function test() {
  const originalQuery = 'hải quan';
  const { data, error } = await supabase
    .from('specialized_vocabulary')
    .select('*')
    .or(`vietnamese.ilike.%${originalQuery}%,definition_vi.ilike.%${originalQuery}%,subcategory.ilike.%${originalQuery}%`)
    .limit(5);

  console.log('Direct query for "hải quan":', data?.length, 'error:', error?.message);
  if (data && data.length > 0) {
    console.log('Sample match:', data[0].hanzi, data[0].vietnamese, data[0].industry, data[0].subcategory);
  }

  // Also test RPC search_dictionary
  const { data: rpcData, error: rpcError } = await supabase.rpc('search_dictionary', {
    p_query: 'hải quan',
    p_limit: 5,
    p_offset: 0
  });
  console.log('RPC search_dictionary for "hải quan":', rpcData?.length, 'error:', rpcError?.message);
  if (rpcData && rpcData.length > 0) {
    console.log('Sample RPC result:', rpcData[0]);
  }
}

test();
