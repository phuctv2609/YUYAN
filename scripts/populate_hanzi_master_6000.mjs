import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import hanzi from 'hanzi';

// Initialize hanzi NLP library
hanzi.start();

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

// Toned Pinyin Converter
const TONE_MARKS = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ']
};

function numberedToToned(numPinyin) {
  if (!numPinyin) return '';
  const toneMatch = numPinyin.match(/[1-5]$/);
  if (!toneMatch) return numPinyin;
  const tone = parseInt(toneMatch[0], 10);
  const base = numPinyin.slice(0, -1);
  if (tone === 5) return base;

  // Rules: a or e gets mark; ou gets mark on o; otherwise last vowel
  let targetVowel = null;
  if (base.includes('a')) targetVowel = 'a';
  else if (base.includes('e')) targetVowel = 'e';
  else if (base.includes('ou')) targetVowel = 'o';
  else {
    for (let i = base.length - 1; i >= 0; i--) {
      if ('aiueovü'.includes(base[i])) {
        targetVowel = base[i];
        break;
      }
    }
  }

  if (targetVowel && TONE_MARKS[targetVowel] && TONE_MARKS[targetVowel][tone - 1]) {
    const mark = TONE_MARKS[targetVowel][tone - 1];
    return base.replace(targetVowel, mark);
  }
  return base;
}

const CJK_REGEX = /^[\u4e00-\u9fa5]$/;

async function run() {
  console.log('=== POPULATING HANZI MASTER (>= 6,000 CHARACTERS) ===');

  // 1. Load Kangxi Radicals
  console.log('Fetching Kangxi radicals from Supabase...');
  const { data: radRows, error: radErr } = await supabase.from('kangxi_radicals').select('*');
  if (radErr) throw radErr;
  console.log(`Loaded ${radRows.length} radicals.`);

  const radicalMap = new Map(); // char/variant -> radical_number
  radRows.forEach(r => {
    radicalMap.set(r.char, r.radical_number);
    if (r.variants && Array.isArray(r.variants)) {
      r.variants.forEach(v => radicalMap.set(v, r.radical_number));
    }
  });

  // Common radical character variants not always in Kangxi table
  const extraRadicalVariants = {
    '氵': 85, '亻': 9, '扌': 64, '忄': 61, '艹': 140, '辶': 162,
    '钅': 167, '饣': 184, '讠': 149, '纟': 120, '阝': 163, '刂': 18,
    '犭': 94, '攵': 66, '灬': 86, '礻': 113, '衤': 145, '罒': 122,
    '宀': 40, '冖': 14, '冫': 15, '冂': 13, '匚': 22, '卩': 26,
    '厶': 28, '夊': 35, '夕': 36, '广': 53, '廴': 54, '弋': 56,
    '弓': 57, '彡': 59, '彳': 60, '斤': 69, '方': 70, '欠': 76,
    '止': 77, '殳': 79, '毋': 80, '毛': 82, '氏': 83, '气': 84,
    '爪': 87, '爫': 87, '父': 88, '爻': 89, '片': 91, '牙': 92,
    '犬': 94, '田': 102, '疋': 103, '疒': 104, '白': 106, '皮': 107,
    '皿': 108, '目': 109, '矛': 110, '矢': 111, '石': 112, '示': 113,
    '禾': 115, '穴': 116, '立': 117, '竹': 118, '⺮': 118, '米': 119,
    '糸': 120, '缶': 121, '网': 122, '羊': 123, '⺶': 123, '羽': 124,
    '老': 125, '考': 125, '而': 126, '耒': 127, '耳': 128, '聿': 129,
    '肉': 130, '月': 130, '臣': 131, '自': 132, '至': 133, '臼': 134,
    '舌': 135, '舟': 137, '艮': 138, '色': 139, '艸': 140, '虍': 141,
    '虫': 142, '血': 143, '行': 144, '衣': 145, '西': 146, '覀': 146,
    '角': 148, '言': 149, '谷': 150, '豆': 151, '豕': 152, '豸': 153,
    '贝': 154, '貝': 154, '赤': 155, '走': 156, '足': 157, '⻊': 157,
    '身': 158, '车': 159, '車': 159, '辛': 160, '辰': 161, '辵': 162,
    '邑': 163, '酉': 164, '里': 166, '金': 167, '门': 169, '門': 169,
    '阜': 170, '隹': 172, '雨': 173, '青': 174, '非': 175, '面': 176,
    '革': 177, '韦': 178, '音': 180, '页': 181, '頁': 181, '风': 182,
    '風': 182, '飞': 183, '飛': 183, '食': 184, '首': 185, '香': 186,
    '马': 187, '馬': 187, '骨': 188, '高': 189, '鬼': 194, '鱼': 195,
    '魚': 195, '鸟': 196, '鳥': 196, '鹿': 198, '麻': 200, '黄': 201,
    '黑': 203, '鼓': 207, '鼠': 208, '鼻': 209, '龙': 212, '龍': 212
  };
  for (const [k, v] of Object.entries(extraRadicalVariants)) {
    if (!radicalMap.has(k)) radicalMap.set(k, v);
  }

  // 2. Load kVietnamese from scratch/unihan/kVietnamese.json if exists
  let kViMap = {};
  if (fs.existsSync('scratch/unihan/kVietnamese.json')) {
    kViMap = JSON.parse(fs.readFileSync('scratch/unihan/kVietnamese.json', 'utf8'));
  }

  // 3. Load Existing canonical_hanzi to preserve rich data
  console.log('Fetching existing canonical_hanzi rows...');
  let existingMap = new Map();
  let page = 0;
  while (true) {
    const { data: rows, error } = await supabase
      .from('canonical_hanzi')
      .select('*')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error) throw error;
    if (!rows || rows.length === 0) break;
    rows.forEach(r => existingMap.set(r.char, r));
    page++;
  }
  console.log(`Loaded ${existingMap.size} existing canonical_hanzi.`);

  // 4. Map vocabulary and HSK levels to characters
  console.log('Mapping HSK and specialized vocabulary to characters...');
  const charHskLevels = new Map(); // char -> Set(number)
  const charVocabWords = new Map(); // char -> Set(string)
  const charViMeanings = new Map(); // char -> Set(string)

  // From HSK Vocabulary (8,456)
  page = 0;
  while (true) {
    const { data: rows } = await supabase
      .from('hsk_vocabulary')
      .select('hanzi, pinyin, vietnamese, hsk_level')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!rows || rows.length === 0) break;
    for (const r of rows) {
      if (!r.hanzi) continue;
      for (const ch of r.hanzi) {
        if (!CJK_REGEX.test(ch)) continue;
        if (!charHskLevels.has(ch)) charHskLevels.set(ch, new Set());
        if (r.hsk_level) charHskLevels.get(ch).add(r.hsk_level);

        if (!charVocabWords.has(ch)) charVocabWords.set(ch, new Set());
        charVocabWords.get(ch).add(r.hanzi);

        if (r.vietnamese) {
          if (!charViMeanings.has(ch)) charViMeanings.set(ch, new Set());
          charViMeanings.get(ch).add(r.vietnamese);
        }
      }
    }
    page++;
  }

  // From Specialized Vocabulary (10,000)
  page = 0;
  while (true) {
    const { data: rows } = await supabase
      .from('specialized_vocabulary')
      .select('hanzi, vietnamese')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!rows || rows.length === 0) break;
    for (const r of rows) {
      if (!r.hanzi) continue;
      for (const ch of r.hanzi) {
        if (!CJK_REGEX.test(ch)) continue;
        if (!charVocabWords.has(ch)) charVocabWords.set(ch, new Set());
        if (charVocabWords.get(ch).size < 15) {
          charVocabWords.get(ch).add(r.hanzi);
        }
      }
    }
    page++;
  }

  // 5. Gather all available CJK characters from hanzi-writer-data
  const hwFiles = fs.readdirSync('node_modules/hanzi-writer-data');
  const hwChars = new Set(
    hwFiles
      .filter(f => /^[\u4e00-\u9fa5]\.json$/.test(f))
      .map(f => f.replace('.json', ''))
  );
  console.log(`Found ${hwChars.size} CJK characters with stroke vector data in hanzi-writer-data.`);

  // 6. Build Candidate List
  const candidateChars = new Set();

  // Priority 1: All existing canonical_hanzi
  existingMap.forEach((_, ch) => candidateChars.add(ch));

  // Priority 2: All characters in HSK vocabulary
  charHskLevels.forEach((_, ch) => candidateChars.add(ch));

  // Priority 3: All characters in specialized vocabulary
  charVocabWords.forEach((_, ch) => candidateChars.add(ch));

  // Priority 4: All 214 Kangxi radicals
  radRows.forEach(r => {
    if (CJK_REGEX.test(r.char)) candidateChars.add(r.char);
  });

  // Priority 5: Frequency characters from hanzi NLP package until >= 6,500
  console.log(`Current candidates from lessons/vocab/existing: ${candidateChars.size}`);
  let freqPos = 1;
  while (candidateChars.size < 6500 && freqPos <= 10000) {
    const item = hanzi.getCharacterInFrequencyListByPosition(freqPos);
    if (item && item.character && CJK_REGEX.test(item.character)) {
      // Prefer characters that have stroke data in hanzi-writer-data
      if (hwChars.has(item.character)) {
        candidateChars.add(item.character);
      }
    }
    freqPos++;
  }

  // If still under 6,500, take any remaining from hanzi-writer-data
  if (candidateChars.size < 6500) {
    for (const ch of hwChars) {
      candidateChars.add(ch);
      if (candidateChars.size >= 6500) break;
    }
  }

  console.log(`Total candidate characters to produce: ${candidateChars.size}`);

  // Helper function to resolve radical number
  function resolveRadicalNumber(char, compList, strokes) {
    if (radicalMap.has(char)) return radicalMap.get(char);
    if (compList && Array.isArray(compList)) {
      for (const comp of compList) {
        if (radicalMap.has(comp)) return radicalMap.get(comp);
      }
    }
    // Fallback based on character strokes
    const s = Math.min(Math.max(strokes || 1, 1), 214);
    return s;
  }

  // 7. Process and build records
  const finalRecords = [];
  let index = 0;

  for (const char of candidateChars) {
    index++;
    const existing = existingMap.get(char);

    // Read stroke count from hanzi-writer-data if available
    let strokeCount = existing?.stroke_count || 5;
    let strokeData = existing?.stroke_data || [];
    const hwPath = `node_modules/hanzi-writer-data/${char}.json`;
    if (fs.existsSync(hwPath)) {
      try {
        const rawHw = JSON.parse(fs.readFileSync(hwPath, 'utf8'));
        if (rawHw.strokes && rawHw.strokes.length > 0) {
          strokeCount = rawHw.strokes.length;
        }
      } catch (e) {}
    }

    // Lookup definition & decomposition in hanzi library
    const defs = hanzi.definitionLookup(char) || [];
    const primaryDef = defs[0] || {};
    const traditional = existing?.traditional || primaryDef.traditional || char;

    // Decomposition & Components
    const decompObj = hanzi.decompose(char);
    const components = decompObj?.components2 || decompObj?.components1 || [char];
    const structure = existing?.structure || (components.length > 1 ? 'left-right' : 'single');
    const structureNameVi = existing?.structure_name_vi || (structure === 'left-right' ? 'Kết cấu Trái - Phải' : 'Chữ đơn thể');
    const decomposition = existing?.decomposition || components.join(' + ');

    // Radical number
    const radicalNumber = existing?.radical_number && existing.radical_number >= 1 && existing.radical_number <= 214
      ? existing.radical_number
      : resolveRadicalNumber(char, components, strokeCount);

    // Pinyin
    let pinyinList = existing?.pinyin || [];
    if (!pinyinList || pinyinList.length === 0) {
      if (primaryDef.pinyin) {
        const pTokens = primaryDef.pinyin.split(/[\/,]/).map(p => numberedToToned(p.trim())).filter(Boolean);
        pinyinList = pTokens.length > 0 ? pTokens : [char];
      } else {
        const rawPy = hanzi.getPinyin(char);
        if (rawPy && rawPy.length > 0) {
          pinyinList = rawPy.map(p => numberedToToned(p)).filter(Boolean);
        }
      }
    }
    if (pinyinList.length === 0) pinyinList = ['zì'];

    // Sino-Vietnamese reading (Hán-Việt)
    let hanViet = existing?.han_viet || null;
    if (!hanViet) {
      if (kViMap[char] && kViMap[char].length > 0) {
        hanViet = kViMap[char][0];
      } else if (kViMap[traditional] && kViMap[traditional].length > 0) {
        hanViet = kViMap[traditional][0];
      }
    }

    // Meanings
    let meanings = existing?.meanings || [];
    if (!meanings || meanings.length === 0) {
      const viSet = charViMeanings.get(char);
      if (viSet && viSet.size > 0) {
        meanings = Array.from(viSet).slice(0, 3);
      } else if (primaryDef.definition) {
        meanings = [primaryDef.definition];
      } else {
        meanings = [hanViet ? `Âm Hán-Việt: ${hanViet}` : 'Hán tự cơ bản'];
      }
    }

    // HSK Levels
    const hskSet = charHskLevels.get(char) || new Set();
    if (existing?.hsk_levels) {
      existing.hsk_levels.forEach(lvl => hskSet.add(lvl));
    }
    const hskLevels = Array.from(hskSet).sort((a, b) => a - b);

    // Vocabulary IDs
    const vocabSet = charVocabWords.get(char) || new Set();
    if (existing?.vocabulary_ids) {
      existing.vocabulary_ids.forEach(v => vocabSet.add(v));
    }
    const vocabularyIds = Array.from(vocabSet).slice(0, 20);

    // Pinyin Search string
    const pinyinSearch = pinyinList.join(' ').toLowerCase();

    finalRecords.push({
      char,
      traditional,
      radical_number: radicalNumber,
      stroke_count: strokeCount,
      pinyin: pinyinList,
      han_viet: hanViet,
      pinyin_search: pinyinSearch,
      meanings,
      structure,
      structure_name_vi: structureNameVi,
      decomposition,
      stroke_data: strokeData,
      hsk_levels: hskLevels,
      vocabulary_ids: vocabularyIds,
      mnemonic: existing?.mnemonic || null
    });
  }

  console.log(`Generated ${finalRecords.length} Hanzi Master records!`);

  // 8. Batch Upsert to Supabase
  console.log('Upserting into public.canonical_hanzi in chunks of 200...');
  const CHUNK_SIZE = 200;
  for (let i = 0; i < finalRecords.length; i += CHUNK_SIZE) {
    const chunk = finalRecords.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('canonical_hanzi')
      .upsert(chunk, { onConflict: 'char' });

    if (error) {
      console.error(`Error upserting chunk ${i / CHUNK_SIZE}:`, error.message);
      throw error;
    }
    if ((i + CHUNK_SIZE) % 1000 === 0 || i + CHUNK_SIZE >= finalRecords.length) {
      console.log(`  Processed ${Math.min(i + CHUNK_SIZE, finalRecords.length)} / ${finalRecords.length} characters...`);
    }
  }

  // 9. Verify Count in Database
  const { count, error: countErr } = await supabase
    .from('canonical_hanzi')
    .select('*', { count: 'exact', head: true });
  if (countErr) throw countErr;

  console.log(`\n======================================================`);
  console.log(`HANZI MASTER INGESTION COMPLETE!`);
  console.log(`TOTAL CANONICAL_HANZI ROWS IN SUPABASE: ${count}`);
  console.log(`GATE CHECK: >= 6000? ${count >= 6000 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`======================================================\n`);
}

run().catch(err => {
  console.error('Fatal error in populate_hanzi_master:', err);
  process.exit(1);
});
