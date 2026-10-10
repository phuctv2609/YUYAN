/**
 * YUYAN — Dictionary Query Normalizer
 * Handles Chinese, Pinyin (with tones, without tones, tone numbers), Vietnamese, and English queries.
 */

import { QueryType, DictionaryQuery, DictionaryFilter } from './dictionaryTypes';

const TONE_MAP: Record<string, string> = {
  ā: 'a', á: 'a', ǎ: 'a', à: 'a',
  ē: 'e', é: 'e', ě: 'e', è: 'e',
  ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
  ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
  ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
  ǖ: 'u', ǘ: 'u', ǚ: 'u', ǜ: 'u', ü: 'u',
  Ā: 'A', Á: 'A', Ǎ: 'A', À: 'A',
  Ē: 'E', É: 'E', Ě: 'E', È: 'E',
  Ī: 'I', Í: 'I', Ǐ: 'I', Ì: 'I',
  Ō: 'O', Ó: 'O', Ǒ: 'O', Ò: 'O',
  Ū: 'U', Ú: 'U', Ǔ: 'U', Ù: 'U',
  Ǖ: 'U', Ǘ: 'U', Ǚ: 'U', Ǜ: 'U', Ü: 'U',
};

const VIETNAMESE_ACCENTS_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const CHINESE_CHAR_REGEX = /[\u4e00-\u9fa5]/;

/**
 * Strips Pinyin diacritics and numbered tones
 * e.g., "bàoguān" -> "baoguan", "bao4guan1" -> "baoguan"
 */
export function stripPinyinTones(text: string): string {
  let cleaned = text;
  // Replace tone letters
  for (const [accented, plain] of Object.entries(TONE_MAP)) {
    if (cleaned.includes(accented)) {
      cleaned = cleaned.split(accented).join(plain);
    }
  }
  // Strip numbered tones (1-5 anywhere in syllable string)
  cleaned = cleaned.replace(/([a-zA-Z])[1-5]/g, '$1');
  return cleaned.trim().toLowerCase();
}

/**
 * Detects query language/type
 */
export function detectQueryType(query: string): QueryType {
  const trimmed = query.trim();
  if (!trimmed) return 'chinese';

  if (CHINESE_CHAR_REGEX.test(trimmed)) {
    return 'chinese';
  }

  if (VIETNAMESE_ACCENTS_REGEX.test(trimmed)) {
    return 'vietnamese';
  }

  // Check if string contains pinyin tone marks
  const hasPinyinTones = Object.keys(TONE_MAP).some(ch => trimmed.includes(ch));
  const hasToneNumbers = /[a-zA-Z][1-5]\b/.test(trimmed);

  if (hasPinyinTones || hasToneNumbers) {
    return 'pinyin';
  }

  // English or plain Latin text (could be pinyin without tone or English/Vietnamese without accents)
  return 'mixed';
}

/**
 * Creates normalized DictionaryQuery object
 */
export function createDictionaryQuery(
  rawQuery: string,
  filter?: DictionaryFilter,
  limit: number = 30,
  offset: number = 0,
  signal?: AbortSignal
): DictionaryQuery {
  const trimmed = rawQuery.trim();
  const normalized = stripPinyinTones(trimmed);
  const qType = detectQueryType(trimmed);

  return {
    originalQuery: trimmed,
    normalizedQuery: normalized,
    queryType: qType,
    filter,
    limit,
    offset,
    signal,
  };
}
