import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envLocal.match(/VITE_SUPABASE_URL=(.+)/);
const adminLocal = fs.existsSync('.env.admin.local') ? fs.readFileSync('.env.admin.local', 'utf-8') : '';
const adminMatch = adminLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const url = urlMatch[1].trim();
const key = adminMatch[1].trim();
const supabase = createClient(url, key);

async function importSpecialized() {
  console.log('=== IMPORTING SPECIALIZED VOCABULARY TO SUPABASE ===');

  const domains = JSON.parse(fs.readFileSync('scratch/specialized_domains.json', 'utf-8'));
  const categories = JSON.parse(fs.readFileSync('scratch/specialized_categories.json', 'utf-8'));
  const vocabulary = JSON.parse(fs.readFileSync('scratch/specialized_vocabulary_cleaned.json', 'utf-8'));

  // 1. Upsert Domains
  console.log(`Upserting ${domains.length} specialized domains...`);
  const { error: domainError } = await supabase.from('specialized_domains').upsert(domains);
  if (domainError) {
    throw new Error(`Domain upsert error: ${domainError.message}`);
  }
  console.log('Domains successfully imported!');

  // 2. Update term_count in categories
  const catCountMap = new Map();
  for (const v of vocabulary) {
    catCountMap.set(v.category_id, (catCountMap.get(v.category_id) || 0) + 1);
  }
  for (const c of categories) {
    c.term_count = catCountMap.get(c.id) || 0;
  }

  // 3. Upsert Categories
  console.log(`Upserting ${categories.length} specialized categories...`);
  const { error: catError } = await supabase.from('specialized_categories').upsert(categories);
  if (catError) {
    throw new Error(`Category upsert error: ${catError.message}`);
  }
  console.log('Categories successfully imported!');

  // 4. Batch Upsert Vocabulary (in chunks of 200)
  console.log(`Upserting ${vocabulary.length} specialized vocabulary items in chunks...`);
  const chunkSize = 200;
  for (let i = 0; i < vocabulary.length; i += chunkSize) {
    const chunk = vocabulary.slice(i, i + chunkSize);
    const { error: vocabError } = await supabase.from('specialized_vocabulary').upsert(chunk);
    if (vocabError) {
      throw new Error(`Vocab upsert error at index ${i}: ${vocabError.message}`);
    }
    console.log(`- Upserted items ${i + 1} to ${Math.min(i + chunkSize, vocabulary.length)}`);
  }

  console.log('All specialized vocabulary successfully imported to Supabase!');
}

importSpecialized().catch(err => {
  console.error('Fatal error during specialized import:', err);
  process.exit(1);
});
