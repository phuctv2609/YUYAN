import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

async function run() {
  const { data, error } = await supabase.from('hsk_master_entries').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Columns:', Object.keys(data[0] || {}));
  console.log('Sample row:', JSON.stringify(data[0], null, 2));
}

run();
