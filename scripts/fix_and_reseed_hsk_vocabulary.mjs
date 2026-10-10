import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

async function reseedHskVocabulary() {
  console.log('=== FIXING & RESEEDING HSK VOCABULARY (8,456 ITEMS) ===');

  const rawVocabulary = JSON.parse(fs.readFileSync('data/hsk/vocabulary.json', 'utf8'));

  const vocabRows = [];
  let count = 0;

  for (const lessonGroup of rawVocabulary.lessons) {
    const rawLessonId = lessonGroup.lessonId || `hsk${lessonGroup.level}-bai${String(lessonGroup.lesson).padStart(2, '0')}`;

    if (Array.isArray(lessonGroup.vocabulary)) {
      for (const v of lessonGroup.vocabulary) {
        count++;
        const hanzi = (v['汉字'] || v.hanzi || '').trim();
        const pinyin = (v['Pinyin'] || v.pinyin || '').trim();
        const pos = (v['Từ loại'] || v.partOfSpeech || '').trim();
        const vi = (v['Nghĩa tiếng Việt'] || v.vietnamese || '').trim();
        const coll = (v['Cách kết hợp tự nhiên'] || v.collocations || '').trim();

        vocabRows.push({
          id: `vocab_${lessonGroup.level}_${lessonGroup.lesson}_${count}`,
          lesson_id: rawLessonId,
          stt: count,
          hanzi: hanzi,
          pinyin: pinyin,
          part_of_speech: pos || null,
          vietnamese: vi,
          collocations: coll || null,
          hsk_level: lessonGroup.level,
        });
      }
    }
  }

  console.log(`Mapped ${vocabRows.length} HSK vocabulary items.`);

  // Clear empty records from hsk_vocabulary
  console.log('Clearing old records from hsk_vocabulary...');
  await supabase.from('hsk_vocabulary').delete().neq('id', '___NEVER___');

  // Batch insert in chunks of 250
  const chunkSize = 250;
  console.log(`Inserting in batches of ${chunkSize}...`);
  for (let i = 0; i < vocabRows.length; i += chunkSize) {
    const chunk = vocabRows.slice(i, i + chunkSize);
    const { error } = await supabase.from('hsk_vocabulary').insert(chunk);
    if (error) {
      throw new Error(`Error at batch [${i} - ${i + chunk.length}]: ${error.message}`);
    }
    if ((i + chunkSize) % 1000 === 0 || i + chunk.length === vocabRows.length) {
      console.log(`Inserted: ${Math.min(i + chunkSize, vocabRows.length)} / ${vocabRows.length} items`);
    }
  }

  // Verification
  const { count: finalCount } = await supabase.from('hsk_vocabulary').select('*', { count: 'exact', head: true });
  const { count: nonEmptyHanzi } = await supabase.from('hsk_vocabulary').select('*', { count: 'exact', head: true }).neq('hanzi', '');

  console.log(`\n=== VERIFICATION ===`);
  console.log(`Total HSK vocabulary rows: ${finalCount}`);
  console.log(`Non-empty Hanzi count: ${nonEmptyHanzi}`);

  const { data: sample } = await supabase.from('hsk_vocabulary').select('*').limit(3);
  console.log('Sample rows:', sample);
}

reseedHskVocabulary().catch(err => {
  console.error('Fatal error during HSK reseed:', err);
  process.exit(1);
});
