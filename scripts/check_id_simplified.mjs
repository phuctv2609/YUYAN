import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

async function check() {
  const { data, error } = await supabase.from('hsk_master_entries').select('id, simplified').limit(5);
  console.log('Sample rows:', data);
  // Check if there are any duplicate simplified words
  const { count, error: countErr } = await supabase.from('hsk_master_entries').select('*', { count: 'exact', head: true });
  console.log('Total count:', count);
}

check();
