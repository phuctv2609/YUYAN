// Pinyin conversion & normalization utilities for CVDICT

const VOWEL_TONES = {
  a: ['a', 'ā', 'á', 'ǎ', 'à', 'a'],
  e: ['e', 'ē', 'é', 'ě', 'è', 'e'],
  o: ['o', 'ō', 'ó', 'ǒ', 'ò', 'o'],
  i: ['i', 'ī', 'í', 'ǐ', 'ì', 'i'],
  u: ['u', 'ū', 'ú', 'ǔ', 'ù', 'u'],
  v: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
};

// Convert a single syllable with tone number (e.g. "ni3", "xue2", "lu:3") to tone mark ("nǐ", "xué", "lǚ")
export function syllableNumberToMark(syllable) {
  if (!syllable) return '';
  let s = syllable.trim();
  s = s.replace(/u:/g, 'ü').replace(/v/g, 'ü');

  const toneMatch = s.match(/[1-5]$/);
  if (!toneMatch) return s;

  const tone = parseInt(toneMatch[0], 10);
  s = s.slice(0, -1);

  // Find vowel to put tone mark on
  // Rule 1: 'a' or 'e' takes tone
  if (s.includes('a')) {
    return s.replace('a', VOWEL_TONES.a[tone]);
  }
  if (s.includes('A')) {
    return s.replace('A', VOWEL_TONES.a[tone].toUpperCase());
  }
  if (s.includes('e')) {
    return s.replace('e', VOWEL_TONES.e[tone]);
  }
  if (s.includes('E')) {
    return s.replace('E', VOWEL_TONES.e[tone].toUpperCase());
  }
  // Rule 2: 'ou' -> 'o' takes tone
  if (s.includes('ou')) {
    return s.replace('o', VOWEL_TONES.o[tone]);
  }
  if (s.includes('OU') || s.includes('Ou')) {
    return s.replace(/o/i, (m) => m === 'O' ? VOWEL_TONES.o[tone].toUpperCase() : VOWEL_TONES.o[tone]);
  }
  // Rule 3: last vowel takes tone
  const vowels = ['i', 'u', 'o', 'ü', 'I', 'U', 'O', 'Ü'];
  let lastVowelIdx = -1;
  for (let i = s.length - 1; i >= 0; i--) {
    if (vowels.includes(s[i])) {
      lastVowelIdx = i;
      break;
    }
  }

  if (lastVowelIdx !== -1) {
    const char = s[lastVowelIdx];
    const lower = char.toLowerCase();
    const isUpper = char !== lower;
    const toneVowel = VOWEL_TONES[lower] ? VOWEL_TONES[lower][tone] : char;
    return s.slice(0, lastVowelIdx) + (isUpper ? toneVowel.toUpperCase() : toneVowel) + s.slice(lastVowelIdx + 1);
  }

  return s;
}

// Convert full pinyin with numbers to marked pinyin (e.g. "ni3 hao3" -> "nǐ hǎo")
export function pinyinNumberToMark(pinyinStr) {
  if (!pinyinStr) return '';
  return pinyinStr
    .split(/\s+/)
    .map(syllableNumberToMark)
    .join(' ');
}

// Normalize pinyin for searching (e.g. "Nǐ hǎo" -> "ni hao", and remove punctuation/tones)
export function normalizePinyin(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove combining diacritics
    .replace(/[0-9]/g, '')           // remove tone numbers if any
    .replace(/u:/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/v/g, 'u')
    .replace(/[^a-z\s]/g, '')        // keep only a-z and spaces
    .replace(/\s+/g, ' ')
    .trim();
}
