/**
 * YUYAN Audio System Utilities
 * Canonical Mandarin Phonetics, Hūdùyīn (呼读音), and Speech Text Normalization.
 * Prevents browser TTS from reading isolated consonants/vowels as English alphabet letters.
 */

/**
 * Canonical Mandarin Hūdùyīn (呼读音) for all 21 initials + y, w.
 * In Chinese phonetics, consonants cannot be spoken in isolation without their canonical reading vowel.
 */
export const MANDARIN_INITIALS_HUDUYIN: Record<string, string> = {
  b: '玻', // bō (双唇不送气清塞音)
  p: '坡', // pō (双唇送气清塞音)
  m: '摸', // mō (双唇鼻音)
  f: '佛', // fó (唇齿清擦音)
  d: '得', // dé (舌尖中不送气清塞音)
  t: '特', // tè (舌尖中送气清塞音)
  n: '讷', // nè (舌尖中鼻音)
  l: '勒', // lè (舌尖中边音)
  g: '哥', // gē (舌面后不送气清塞音)
  k: '科', // kē (舌面后送气清塞音)
  h: '喝', // hē (舌面后清擦音)
  j: '基', // jī (舌面前不送气清塞擦音)
  q: '期', // qī (舌面前送气清塞擦音)
  x: '西', // xī (舌面前清擦音)
  zh: '知', // zhī (舌尖后不送气清塞擦音 / 翘舌)
  ch: '吃', // chī (舌尖后送气清塞擦音 / 翘舌)
  sh: '诗', // shī (舌尖后清擦音 / 翘舌)
  r: '日', // rì (舌尖后浊擦音 / 翘舌)
  z: '资', // zī (舌尖前不送气清塞擦音 / 平舌)
  c: '疵', // cī (舌尖前送气清塞擦音 / 平舌)
  s: '思', // sī (舌尖前清擦音 / 平舌)
  y: '衣', // yī (零声母)
  w: '乌', // wū (零声母)
};

/**
 * Canonical Mandarin Finals (韵母) mapping to representative Hanzi characters
 * Ensures full standard pronunciation across 36 finals + retroflex er.
 */
export const MANDARIN_FINALS_MAPPING: Record<string, string> = {
  // Đơn vận mẫu (Single finals)
  a: '啊',
  o: '哦',
  e: '鹅',
  i: '衣',
  u: '乌',
  ü: '迂',
  v: '迂',
  er: '儿',

  // Phức vận mẫu (Compound finals)
  ai: '哀',
  ei: '欸',
  ui: '威',
  ao: '熬',
  ou: '欧',
  iu: '优',
  ie: '椰',
  üe: '约',
  ve: '约',

  // Tỷ vận mẫu tiền (Front nasal finals)
  an: '安',
  en: '恩',
  in: '因',
  un: '温',
  ün: '晕',
  vn: '晕',

  // Tỷ vận mẫu hậu (Back nasal finals)
  ang: '昂',
  eng: '亨',
  ing: '英',
  ong: '轰',

  // Tề xỉ hô & Hợp khẩu hô phức tạp
  ia: '呀',
  iao: '腰',
  ian: '烟',
  iang: '央',
  iong: '雍',
  ua: '蛙',
  uo: '窝',
  uai: '歪',
  uan: '弯',
  uang: '汪',
  ueng: '翁',
  üan: '冤',
  van: '冤',
};

/**
 * Canonical Syllable-with-tone to Hanzi lookup for pronunciation labs and minimal pairs.
 */
export const MANDARIN_SYLLABLES_MAPPING: Record<string, string> = {
  // Ma tones
  mā: '妈',
  má: '麻',
  mǎ: '马',
  mà: '骂',
  ma: '吗',
  ma1: '妈',
  ma2: '麻',
  ma3: '马',
  ma4: '骂',

  // Ba / Pa
  bā: '八',
  bá: '拔',
  bǎ: '把',
  bà: '爸',
  ba: '吧',
  pā: '趴',
  pá: '爬',
  pǎ: '跑',
  pà: '怕',
  pa: '怕',

  // Da / Ta
  dā: '搭',
  dá: '答',
  dǎ: '打',
  dà: '大',
  tā: '他',
  tá: '台',
  tǎ: '塔',
  tà: '踏',

  // Na / La
  nā: '南',
  ná: '拿',
  nǎ: '哪',
  nà: '那',
  lā: '拉',
  lá: '划',
  lǎ: '喇',
  là: '辣',

  // Ga / Ka / Ha
  gē: '哥',
  gé: '格',
  gě: '葛',
  gè: '个',
  kē: '棵',
  ké: '咳',
  kě: '渴',
  kè: '课',
  hē: '喝',
  hé: '和',
  hě: '何',
  hè: '贺',

  // Ji / Qi / Xi
  jī: '鸡',
  jí: '急',
  jǐ: '几',
  jì: '记',
  qī: '七',
  qí: '齐',
  qǐ: '起',
  qì: '气',
  xī: '西',
  xí: '习',
  xǐ: '喜',
  xì: '戏',

  // Zhi / Chi / Shi / Ri
  zhī: '知',
  zhí: '直',
  zhǐ: '指',
  zhì: '志',
  chī: '吃',
  chí: '迟',
  chǐ: '尺',
  chì: '翅',
  shī: '诗',
  shí: '十',
  shǐ: '史',
  shì: '是',
  rì: '日',

  // Zi / Ci / Si
  zī: '资',
  zí: '子',
  zǐ: '紫',
  zì: '字',
  cī: '疵',
  cí: '词',
  cǐ: '此',
  cì: '次',
  sī: '思',
  sí: '斯',
  sǐ: '死',
  sì: '四',

  // Numbers and common high-frequency words/syllables
  nǐ: '你',
  hǎo: '好',
  xiè: '谢',
  xièxie: '谢谢',
  zài: '在',
  jiàn: '见',
  zàijiàn: '再见',
  yī: '一',
  èr: '二',
  sān: '三',
  wǔ: '五',
  liù: '六',
  jiǔ: '九',
  zhōng: '中',
  guó: '国',
  rén: '人',
  xué: '学',
  shēng: '生',
  lǎoshī: '老师',
  shuǐ: '水',
  chá: '茶',
  mǐfàn: '米饭',
};

/**
 * Verify whether a string contains Hanzi characters
 */
export function containsHanzi(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Clean and normalize Chinese text for TTS speech synthesis.
 * Strips English annotations, IPA brackets, and extraneous punctuation.
 */
export function sanitizeChineseSpeechText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\s*\([^)]*\)/g, '') // remove (pinyin) or (notes)
    .replace(/\s*\[[^\]]*\]/g, '') // remove [notes]
    .replace(/["'“”‘’]/g, '')
    .trim();
}

/**
 * Resolves any phonetic unit (initial, final, tone contour, syllable) or pinyin string
 * into standard Mandarin Chinese speech text.
 * Strictly guarantees that pure Latin consonants/finals are never sent as raw English letters to TTS.
 */
export function resolveMandarinPhoneticText(text: string, entityType?: string): string {
  if (!text) return '';
  const sanitized = sanitizeChineseSpeechText(text);

  // 1. If text already contains Chinese Hanzi, use it directly!
  if (containsHanzi(sanitized)) {
    return sanitized;
  }

  // 2. Normalize input for phonetic lookup
  const cleanKey = sanitized.toLowerCase().trim().replace(/[/\\()[\]]/g, '');

  // 3. Explicit or inferred Initial (声母) lookup
  if (entityType === 'initial' || cleanKey in MANDARIN_INITIALS_HUDUYIN) {
    if (MANDARIN_INITIALS_HUDUYIN[cleanKey]) {
      return MANDARIN_INITIALS_HUDUYIN[cleanKey];
    }
  }

  // 4. Explicit or inferred Final (韵母) lookup
  if (entityType === 'final' || cleanKey in MANDARIN_FINALS_MAPPING) {
    if (MANDARIN_FINALS_MAPPING[cleanKey]) {
      return MANDARIN_FINALS_MAPPING[cleanKey];
    }
  }

  // 5. Explicit syllable with tone lookup
  if (cleanKey in MANDARIN_SYLLABLES_MAPPING) {
    return MANDARIN_SYLLABLES_MAPPING[cleanKey];
  }

  // 6. Look for tone-stripped base final if entityType is final
  const strippedKey = cleanKey
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[1-5]/g, '');

  if (entityType === 'final' && MANDARIN_FINALS_MAPPING[strippedKey]) {
    return MANDARIN_FINALS_MAPPING[strippedKey];
  }

  if (entityType === 'initial' && MANDARIN_INITIALS_HUDUYIN[strippedKey]) {
    return MANDARIN_INITIALS_HUDUYIN[strippedKey];
  }

  // 7. Fallback: if single letter and matches initial/final, prefer Hūdùyīn
  if (MANDARIN_INITIALS_HUDUYIN[strippedKey]) {
    return MANDARIN_INITIALS_HUDUYIN[strippedKey];
  }
  if (MANDARIN_FINALS_MAPPING[strippedKey]) {
    return MANDARIN_FINALS_MAPPING[strippedKey];
  }

  return sanitized;
}

export function generateAudioCacheKey(
  text: string,
  lang: string = 'zh-CN',
  voice: string = 'default',
  rate: number = 1.0,
  pitch: number = 1.0
): string {
  const normalized = `${text.trim()}|${lang}|${voice}|${rate.toFixed(2)}|${pitch.toFixed(2)}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `yuyan_audio_${Math.abs(hash).toString(36)}`;
}
