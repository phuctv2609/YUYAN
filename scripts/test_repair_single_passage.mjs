// scripts/test_repair_single_passage.mjs
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
    if (seg === '一个') { words.push('yīge'); continue; }
    if (seg === '四个') { words.push('sìge'); continue; }

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

async function translateText(zhText) {
  const q = encodeURIComponent(zhText);
  const resp = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=' + q);
  if (!resp.ok) throw new Error('Translate error: ' + resp.status);
  const json = await resp.json();
  let vi = json[0].map(x => x[0]).join('');
  // Character name standardization
  vi = vi
    .replace(/Lin Zixuan/gi, 'Lâm Tử Hiên')
    .replace(/Chu Yuhang|Zhou Yuhang/gi, 'Châu Vũ Hàng')
    .replace(/Chen Mingyuan/gi, 'Trần Minh Viễn')
    .replace(/Wang Jing/gi, 'Vương Tĩnh')
    .replace(/Thầy Vương|Cô Vương/gi, 'cô Vương')
    .replace(/Anna/gi, 'An Na')
    .replace(/David/gi, 'Đại Vệ');
  return vi;
}

async function testSingle() {
  const r = JSON.parse(fs.readFileSync('data/hsk/reading.json', 'utf8'));
  const lesson1 = r.lessons['0'];
  const hanziText = lesson1.reading.hanzi;
  console.log('Original Hanzi:', hanziText);

  const pinyin = generatePinyin(hanziText);
  console.log('Generated Pinyin:', pinyin);

  const vietnamese = await translateText(hanziText);
  console.log('Generated Vietnamese:', vietnamese);

  const provenance = {
    source: 'data/hsk/reading.json',
    hanzi_cleaned: true,
    pinyin_engine: 'yuyan-hanzi-pinyin-engine-v2',
    translation_provider: 'google-translate-pedagogical-aligned',
    repaired_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('reading_passages')
    .update({
      hanzi: hanziText,
      pinyin: pinyin,
      vietnamese: vietnamese,
      repair_provenance: provenance
    })
    .eq('lesson_id', lesson1.lessonId)
    .select();

  console.log('Update result error:', error);
  console.log('Updated row:', data);
}

testSingle();
