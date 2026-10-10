import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

async function testCache() {
  const { data, error } = await supabase.from('ai_word_usage_cache').select('*').limit(5);
  if (error) {
    console.error('Error selecting ai_word_usage_cache:', error);
    return;
  }
  console.log('Current cache rows count:', data.length);
}

testCache();
