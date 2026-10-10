// scripts/test_passage_pinyin.mjs
import hanzi from 'hanzi';
hanzi.start();

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

function generatePinyinForPassage(text) {
  // Split into sentences / punctuation
  const segments = hanzi.segment(text);
  const pinyinWords = [];
  for (const seg of segments) {
    if (/^[\p{P}\s\d]+$/u.test(seg)) {
      pinyinWords.push(seg);
      continue;
    }
    const py = hanzi.getPinyin(seg);
    if (py && py.length > 0) {
      // Seg might have multiple syllables e.g. "xue2 xiao4"
      const syllables = py[0].split(/\s+/).map(numToTone).join('');
      pinyinWords.push(syllables);
    } else {
      // Character by character fallback
      let sub = '';
      for (const ch of seg) {
        const cpy = hanzi.getPinyin(ch);
        sub += cpy ? numToTone(cpy[0]) : ch;
      }
      pinyinWords.push(sub);
    }
  }

  // Join nicely with punctuation
  let result = '';
  for (let i = 0; i < pinyinWords.length; i++) {
    const w = pinyinWords[i];
    if (/^[，。！？；：“”‘’（）,.!?;:]+$/.test(w)) {
      result += w + ' ';
    } else {
      if (result.length > 0 && !result.endsWith(' ') && !result.endsWith('“') && !result.endsWith('‘') && !result.endsWith('(')) {
        result += ' ';
      }
      result += w;
    }
  }
  return result.replace(/\s+([，。！？；：,.!?;:])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

const sample = "早上，安娜和大卫来到学校。他们找不到教室。林子轩和周宇航看见他们，就带他们去教室。路上，陈明远也来了，但是他来晚了。王静老师已经在教室门口等大家。安娜说：“老师，您好！”王老师笑着说：“你好。”这是一个很普通的早上，但是四个年轻人开始越来越熟悉了。";
console.log('Original:');
console.log(sample);
console.log('\nGenerated Pinyin:');
console.log(generatePinyinForPassage(sample));
