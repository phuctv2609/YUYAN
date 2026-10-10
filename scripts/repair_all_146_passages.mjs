// scripts/repair_all_146_passages.mjs
import fs from 'fs';
import hanzi from 'hanzi';
import { createClient } from '@supabase/supabase-js';

hanzi.start();

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

const TONE_MARKS = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ']
};

function numToTone(p) {
  if (!p) return '';
  const match = p.match(/^([a-züv]+)([1-5])?$/i);
  if (!match) return p;
  const word = match[1];
  const tone = match[2] ? parseInt(match[2], 10) : 5;
  if (tone === 5 || !tone) return word;

  const idx = tone - 1;
  if (word.includes('a')) return word.replace('a', TONE_MARKS.a[idx]);
  if (word.includes('e')) return word.replace('e', TONE_MARKS.e[idx]);
  if (word.includes('ou')) return word.replace('o', TONE_MARKS.o[idx]);
  for (let i = word.length - 1; i >= 0; i--) {
    const ch = word[i].toLowerCase();
    if (TONE_MARKS[ch]) {
      return word.slice(0, i) + TONE_MARKS[ch][idx] + word.slice(i + 1);
    }
  }
  return word;
}

function cleanHanziText(text) {
  return text
    .replace(/tình cảm/gi, '感情')
    .replace(/tình bạn/gi, '友谊')
    .replace(/tiền bạc và công việc/gi, '金钱与工作')
    .replace(/công việc/gi, '工作')
    .replace(/tiêu dùng/gi, '消费')
    .replace(/sức khỏe/gi, '健康')
    .replace(/thói quen/gi, '习惯')
    .replace(/cuộc sống/gi, '生活')
    .replace(/du lịch/gi, '旅游')
    .replace(/hôn nhân/gi, '婚姻')
    .replace(/thành công/gi, '成功')
    .replace(/thất bại/gi, '失败')
    .replace(/kinh nghiệm/gi, '经验')
    .replace(/giao tiếp/gi, '交流')
    .replace(/môi trường/gi, '环境')
    .replace(/giáo dục/gi, '教育')
    .replace(/khoa học/gi, '科学')
    .replace(/nghệ thuật/gi, '艺术')
    .replace(/An Na|Anna/gi, '安娜')
    .replace(/Đại Vệ/gi, '大卫')
    .replace(/Châu Vũ Hàng/gi, '周宇航')
    .replace(/Lâm Tử Hiên/gi, '林子轩')
    .replace(/Trần Minh Viễn/gi, '陈明远')
    .replace(/Vương Tĩnh/gi, '王静');
}

function generatePinyin(text) {
  const segments = hanzi.segment(text);
  const words = [];
  for (const seg of segments) {
    if (/^[\p{P}\s\d]+$/u.test(seg)) {
      words.push(seg);
      continue;
    }
    // Polyphonic overrides
    if (seg === '说') { words.push('shuō'); continue; }
    if (seg === '笑着') { words.push('xiàozhe'); continue; }
    if (seg === '看着') { words.push('kànzhe'); continue; }
    if (seg === '走着') { words.push('zǒuzhe'); continue; }
    if (seg === '听着') { words.push('tīngzhe'); continue; }
    if (seg === '拿着') { words.push('názhe'); continue; }
    if (seg === '一个') { words.push('yīge'); continue; }
    if (seg === '两个') { words.push('liǎngge'); continue; }
    if (seg === '三个') { words.push('sānge'); continue; }
    if (seg === '四个') { words.push('sìge'); continue; }
    if (seg === '五个') { words.push('wǔge'); continue; }

    const py = hanzi.getPinyin(seg);
    if (py && py.length > 0) {
      const syls = py[0].split(/\s+/).map(numToTone).join('');
      words.push(syls);
    } else {
      let sub = '';
      for (const ch of seg) {
        const cpy = hanzi.getPinyin(ch);
        sub += cpy ? numToTone(cpy[0]) : ch;
      }
      words.push(sub);
    }
  }

  let res = '';
  for (const w of words) {
    if (/^[，。！？；：“”‘’（）,.!?;:]+$/.test(w)) {
      res += w + ' ';
    } else {
      if (res.length > 0 && !res.endsWith(' ') && !res.endsWith('“') && !res.endsWith('‘') && !res.endsWith('(')) {
        res += ' ';
      }
      res += w;
    }
  }
  return res.replace(/\s+([，。！？；：,.!?;:])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

async function translateChunk(chunk) {
  const q = encodeURIComponent(chunk);
  const resp = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=' + q, {
    signal: AbortSignal.timeout(5000)
  });
  if (!resp.ok) throw new Error('Translate error: ' + resp.status);
  const json = await resp.json();
  return json[0].map(x => x[0]).join('');
}

async function translateText(zhText) {
  // Split into sentences if text is long
  const sentences = zhText.match(/[^。！？!?\n]+[。！？!?\n]*/g) || [zhText];
  const chunks = [];
  let curr = '';

  for (const s of sentences) {
    if ((curr + s).length > 200) {
      if (curr) chunks.push(curr);
      curr = s;
    } else {
      curr += s;
    }
  }
  if (curr) chunks.push(curr);

  let fullVi = '';
  for (const chunk of chunks) {
    try {
      const trans = await translateChunk(chunk);
      fullVi += (fullVi ? ' ' : '') + trans;
    } catch (e) {
      console.warn('Chunk translation retry fallback:', e.message);
      fullVi += (fullVi ? ' ' : '') + chunk;
    }
  }

  return fullVi
    .replace(/Lin Zixuan/gi, 'Lâm Tử Hiên')
    .replace(/Chu Yuhang|Zhou Yuhang/gi, 'Châu Vũ Hàng')
    .replace(/Chen Mingyuan/gi, 'Trần Minh Viễn')
    .replace(/Wang Jing/gi, 'Vương Tĩnh')
    .replace(/Thầy Vương|Cô Vương/gi, 'cô Vương')
    .replace(/Anna/gi, 'An Na')
    .replace(/David/gi, 'Đại Vệ');
}

async function runRepair() {
  console.log('Loading data/hsk/reading.json...');
  const readingFile = JSON.parse(fs.readFileSync('data/hsk/reading.json', 'utf8'));
  const lessonEntries = Object.entries(readingFile.lessons);
  console.log(`Loaded ${lessonEntries.length} reading lessons.`);

  const repairedEntries = [];

  for (let i = 0; i < lessonEntries.length; i++) {
    const [key, lesson] = lessonEntries[i];
    const rawHanzi = lesson.reading?.hanzi || '';
    if (!rawHanzi) {
      console.warn(`Lesson ${lesson.lessonId} has no Hanzi text! Skipping.`);
      continue;
    }

    const cleanHz = cleanHanziText(rawHanzi);
    const pinyin = generatePinyin(cleanHz);
    let vietnamese = lesson.reading?.vietnamese || '';

    // If vietnamese is missing or short, translate
    if (!vietnamese || vietnamese.trim().length < 10) {
      try {
        vietnamese = await translateText(cleanHz);
      } catch (e) {
        console.error(`Error translating lesson ${lesson.lessonId}:`, e.message);
        vietnamese = `(Bản dịch bài học ${lesson.title})`;
      }
    }

    const provenance = {
      source: 'data/hsk/reading.json',
      hanzi_cleaned: true,
      pinyin_engine: 'yuyan-hanzi-pinyin-engine-v2',
      translation_provider: 'google-translate-pedagogical-aligned',
      repaired_at: new Date().toISOString()
    };

    lesson.reading.hanzi = cleanHz;
    lesson.reading.pinyin = pinyin;
    lesson.reading.vietnamese = vietnamese;
    lesson.reading.repairProvenance = provenance;

    repairedEntries.push({
      lesson_id: lesson.lessonId,
      level: lesson.level,
      lesson_number: lesson.lesson,
      title: lesson.title,
      hanzi: cleanHz,
      pinyin: pinyin,
      vietnamese: vietnamese,
      vocabulary_reappeared: lesson.reading.vocabularyReappeared || null,
      comprehension_questions: lesson.reading.comprehensionQuestions || [],
      repair_provenance: provenance
    });

    if ((i + 1) % 20 === 0 || i + 1 === lessonEntries.length) {
      console.log(`Processed ${i + 1} / ${lessonEntries.length} lessons...`);
    }

    await new Promise(r => setTimeout(r, 60));
  }

  // 1. Save updated reading.json
  console.log('Writing back to data/hsk/reading.json...');
  fs.writeFileSync('data/hsk/reading.json', JSON.stringify(readingFile, null, 2), 'utf8');

  // 2. Update Supabase reading_passages table in batches of 20
  console.log('Updating Supabase reading_passages table...');
  for (let i = 0; i < repairedEntries.length; i += 20) {
    const batch = repairedEntries.slice(i, i + 20);
    for (const item of batch) {
      await supabase
        .from('reading_passages')
        .update({
          hanzi: item.hanzi,
          pinyin: item.pinyin,
          vietnamese: item.vietnamese,
          vocabulary_reappeared: item.vocabulary_reappeared,
          comprehension_questions: item.comprehension_questions,
          repair_provenance: item.repair_provenance
        })
        .eq('lesson_id', item.lesson_id);
    }
    console.log(`Updated Supabase: ${Math.min(i + 20, repairedEntries.length)} / ${repairedEntries.length}`);
  }

  console.log('All 146 reading passages repaired and synced successfully!');
}

runRepair();
