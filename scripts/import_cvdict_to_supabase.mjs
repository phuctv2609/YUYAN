import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { pinyinNumberToMark, normalizePinyin } from './pinyin_utils.mjs';

const CVDICT_PATH = path.resolve('data/cvdict/CVDICT.u8');
const META_PATH = path.resolve('data/cvdict/cvdict_meta.json');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();

const supabase = createClient(url, adminKey, {
  auth: { persistSession: false }
});

const ENGLISH_LEAKAGE_REGEX = /\b(the|and|for|with|that|this|from|which|variant of|see also|used in|CL:|abbr\. for|also written as|same as|surname|prefix|suffix|dynasty|county in|city in|province in|mountain in|river in|district in|ancient name|transliteration of)\b/i;

async function runImport() {
  console.log('=== STARTING CVDICT IMPORT TO SUPABASE ===');
  const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));

  // First, verify table exists
  const { error: testErr } = await supabase.from('dictionary_entries').select('id').limit(1);
  if (testErr) {
    throw new Error(`dictionary_entries table check failed: ${testErr.message}`);
  }

  const fileStream = fs.createReadStream(CVDICT_PATH, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const BATCH_SIZE = 1000;
  let batch = [];
  let totalImported = 0;
  let lineCount = 0;
  const seenKeys = new Set();
  const startTime = Date.now();

  async function flushBatch(records) {
    if (records.length === 0) return;
    let attempts = 0;
    while (attempts < 3) {
      try {
        const { error } = await supabase
          .from('dictionary_entries')
          .upsert(records, { onConflict: 'source_key' });
        if (error) throw error;
        return;
      } catch (err) {
        attempts++;
        console.warn(`Retry attempt ${attempts} for batch of ${records.length} items: ${err.message}`);
        await new Promise(r => setTimeout(r, 1000 * attempts));
        if (attempts >= 3) throw err;
      }
    }
  }

  for await (const line of rl) {
    lineCount++;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^(\S+)\s+(\S+)\s+\[+(.+?)\]+\s*\/(.+)\/$/);
    if (!match) continue;

    const traditional = match[1];
    const simplified = match[2];
    const pinyinRaw = match[3].replace(/[\[\]]/g, '').trim();
    const rawMeaningsStr = match[4];

    const pinyinMarked = pinyinNumberToMark(pinyinRaw);
    const pinyinNorm = normalizePinyin(pinyinMarked);

    const meaningsList = rawMeaningsStr
      .split('/')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    if (meaningsList.length === 0) continue;

    const sourceKey = `${traditional}:${simplified}:${pinyinMarked}`;
    if (seenKeys.has(sourceKey)) continue;
    seenKeys.add(sourceKey);

    let hasLeakage = false;
    for (const m of meaningsList) {
      if (ENGLISH_LEAKAGE_REGEX.test(m)) {
        hasLeakage = true;
        break;
      }
    }

    const meaningsText = meaningsList.join('; ');

    batch.push({
      source_key: sourceKey,
      traditional,
      simplified,
      pinyin: pinyinMarked,
      pinyin_normalized: pinyinNorm,
      meanings_vi: meaningsList,
      meanings_text: meaningsText,
      source_name: 'CVDICT',
      source_url: 'https://github.com/ph0ngp/CVDICT',
      source_commit: meta.pinned_commit,
      source_license: 'CC BY-SA 4.0',
      quality_status: hasLeakage ? 'review_required' : 'verified',
      has_english_leakage: hasLeakage
    });

    if (batch.length >= BATCH_SIZE) {
      await flushBatch(batch);
      totalImported += batch.length;
      batch = [];
      if (totalImported % 10000 === 0 || totalImported >= 120000) {
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (totalImported / (Date.now() - startTime) * 1000).toFixed(0);
        console.log(`  Imported ${totalImported.toLocaleString()} / 122,595 entries (${rate} entries/sec, ${elapsedSec}s)...`);
      }
    }
  }

  if (batch.length > 0) {
    await flushBatch(batch);
    totalImported += batch.length;
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nImport finished in ${durationSec} seconds. Total batch inserted: ${totalImported.toLocaleString()}`);

  // Query actual total row count in Supabase
  const { count, error: countErr } = await supabase
    .from('dictionary_entries')
    .select('*', { count: 'exact', head: true });

  if (countErr) throw countErr;

  console.log(`======================================================`);
  console.log(`SUPABASE VERIFICATION:`);
  console.log(`TOTAL ROWS IN dictionary_entries: ${count.toLocaleString()}`);
  console.log(`MATCH EXPECTED (~122,595)? ${count >= 122000 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`======================================================\n`);
}

runImport().catch(err => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
