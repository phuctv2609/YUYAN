/**
 * YUYAN Real Chinese Dictionary Repository
 * Unified search across Simplified, Traditional, Pinyin (with/without tones), Vietnamese & English definitions.
 * Synthesizes words, constituent characters, radicals, stroke counts, examples, and HSK lessons into canonical cards.
 */

import { vocabularyRepository, EnrichedVocabularyItem } from './vocabularyRepository';
import { hanziRepository } from './hanziRepository';
import { radicalRepository } from './radicalRepository';
import { lessonRepository } from '../hsk/lessonRepository';
import { CanonicalHanzi } from '../models/hanzi';
import { CanonicalRadical } from '../models/radical';

export interface DictionaryEntry {
  id: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  pinyinClean: string;
  vietnameseMeaning: string;
  partOfSpeech: string;
  hskLevel?: number;
  lessonKey?: string;
  lessonTitle?: string;
  characters: Array<{
    char: string;
    hanzi?: CanonicalHanzi;
    radical?: CanonicalRadical;
  }>;
  collocation?: string;
  examples: Array<{
    sentenceId: string;
    hanzi: string;
    pinyin: string;
    vietnamese: string;
    lessonTitle: string;
  }>;
  relatedWords: string[];
}

// Remove tone diacritics from Pinyin for flexible searching
function stripPinyinTones(pinyin: string): string {
  return pinyin
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[1-5]/g, '')
    .toLowerCase()
    .replace(/ü/g, 'u')
    .trim();
}

export class DictionaryRepository {
  public search(query: string, levelFilter?: number): DictionaryEntry[] {
    const rawQ = query.trim().toLowerCase();
    if (!rawQ) return [];

    const cleanQ = stripPinyinTones(rawQ);

    // 1. Search vocabulary items
    let vocabMatches = vocabularyRepository.search({
      query: rawQ,
      hskLevel: levelFilter,
    });

    // If query looks like alphabetic pinyin and results are few, attempt toneless match
    if (vocabMatches.length < 5 && /^[a-z\s]+$/i.test(cleanQ)) {
      const extra = vocabularyRepository.getAll().filter((item) => {
        if (levelFilter !== undefined && item.hskLevel !== levelFilter) return false;
        const stripped = stripPinyinTones(item['Pinyin'] || '').toLowerCase().replace(/\s+/g, '');
        const target = cleanQ.replace(/\s+/g, '');
        return stripped.includes(target);
      });
      vocabMatches = [...vocabMatches, ...extra];
    }

    const entries: DictionaryEntry[] = [];
    const seenWords = new Set<string>();

    for (const item of vocabMatches) {
      const word = item['汉字'] || '';
      if (!word || seenWords.has(word)) continue;
      seenWords.add(word);

      const entry = this.buildDictionaryEntry(item);
      entries.push(entry);

      if (entries.length >= 40) break;
    }

    // 2. If single character or no matches, check Hanzi repository
    if (rawQ.length === 1 && /[\u4e00-\u9fa5]/.test(rawQ)) {
      const charEntity = hanziRepository.getByChar(rawQ);
      if (charEntity && !seenWords.has(charEntity.char)) {
        entries.unshift(this.buildCharDictionaryEntry(charEntity));
      }
    }

    return entries;
  }

  public getByWord(word: string): DictionaryEntry | undefined {
    const items = vocabularyRepository.getByWord(word);
    if (items.length > 0) {
      return this.buildDictionaryEntry(items[0]);
    }
    const charEntity = hanziRepository.getByChar(word);
    if (charEntity) {
      return this.buildCharDictionaryEntry(charEntity);
    }
    return undefined;
  }

  private buildDictionaryEntry(item: EnrichedVocabularyItem): DictionaryEntry {
    const word = item['汉字'] || '';
    const pinyin = item['Pinyin'] || '';

    // Break down constituent characters
    const characters = [];
    for (const ch of word) {
      if (/[\u4e00-\u9fa5]/.test(ch)) {
        const hanzi = hanziRepository.getByChar(ch);
        const radical = hanzi ? radicalRepository.getByNumber(hanzi.radicalNumber) : undefined;
        characters.push({ char: ch, hanzi, radical });
      }
    }

    // Find sentence examples from lessons
    const examples = [];
    const allLessons = lessonRepository.getAllLessons();
    for (const l of allLessons) {
      for (const s of l.lessonText) {
        if (s.hanzi.includes(word)) {
          examples.push({
            sentenceId: `${l.lessonId}_s${s.index}`,
            hanzi: s.hanzi,
            pinyin: s.pinyin,
            vietnamese: s.vietnamese,
            lessonTitle: `HSK ${l.level} Bài ${l.lessonNumber}`,
          });
          if (examples.length >= 3) break;
        }
      }
      if (examples.length >= 3) break;
    }

    // Related words sharing characters
    const related = new Set<string>();
    for (const ch of word) {
      const sharing = vocabularyRepository.getWordsContainingChar(ch);
      for (const sw of sharing) {
        const swHanzi = sw['汉字'] || '';
        if (swHanzi !== word && swHanzi.length <= 4) {
          related.add(swHanzi);
        }
        if (related.size >= 8) break;
      }
      if (related.size >= 8) break;
    }

    return {
      id: item.id,
      simplified: word,
      traditional: word, // Canonical form
      pinyin,
      pinyinClean: stripPinyinTones(pinyin),
      vietnameseMeaning: item['Nghĩa tiếng Việt'] || '',
      partOfSpeech: item['Từ loại'] || '',
      hskLevel: item.hskLevel,
      lessonKey: item.lessonKey,
      lessonTitle: `HSK ${item.hskLevel} Bài ${item.lessonNumber}`,
      characters,
      collocation: item['Cách kết hợp tự nhiên'] || item['Cụm từ cố định / collocation'] || '',
      examples,
      relatedWords: Array.from(related),
    };
  }

  private buildCharDictionaryEntry(charEntity: CanonicalHanzi): DictionaryEntry {
    const radical = radicalRepository.getByNumber(charEntity.radicalNumber);

    return {
      id: `char_${charEntity.char}`,
      simplified: charEntity.char,
      traditional: charEntity.traditional,
      pinyin: charEntity.pinyin.join(', '),
      pinyinClean: stripPinyinTones(charEntity.pinyin[0] || ''),
      vietnameseMeaning: charEntity.meanings.join('; '),
      partOfSpeech: 'Chữ Hán (Tự)',
      hskLevel: charEntity.hskLevels[0],
      characters: [{ char: charEntity.char, hanzi: charEntity, radical }],
      examples: [],
      relatedWords: charEntity.vocabularyIds.slice(0, 8),
    };
  }
}

export const dictionaryRepository = new DictionaryRepository();
