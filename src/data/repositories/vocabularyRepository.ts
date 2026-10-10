/**
 * YUYAN Vocabulary Repository
 * Data access abstraction for authoritative HSK Vocabulary (8,456 items).
 */

import rawVocabulary from '../../../data/hsk/vocabulary.json';
import { LessonVocabulary, RawVocabularyItem } from '../hsk/types';

export interface VocabularyFilterOptions {
  query?: string;
  hskLevel?: number;
  lessonNumber?: number;
  partOfSpeech?: string;
}

export interface EnrichedVocabularyItem extends RawVocabularyItem {
  id: string;
  hskLevel: number;
  lessonNumber: number;
  lessonKey: string;
}

export class VocabularyRepository {
  private lessons: LessonVocabulary[] = [];
  private allItems: EnrichedVocabularyItem[] = [];
  private byLessonKey: Map<string, EnrichedVocabularyItem[]> = new Map();
  private byHanzi: Map<string, EnrichedVocabularyItem[]> = new Map();

  constructor() {
    const raw = rawVocabulary as unknown as { source: string; lessons: LessonVocabulary[] };
    this.lessons = raw.lessons || [];

    for (const l of this.lessons) {
      const lessonNum = l.lesson;
      const lessonKey = `hsk${l.level}-bai${lessonNum}`;
      const items: EnrichedVocabularyItem[] = [];

      for (const item of l.vocabulary || []) {
        const enriched: EnrichedVocabularyItem = {
          ...item,
          id: `vocab_${l.level}_${lessonNum}_${item['STT'] || item['汉字']}`,
          hskLevel: l.level,
          lessonNumber: lessonNum,
          lessonKey,
        };
        items.push(enriched);
        this.allItems.push(enriched);

        const word = item['汉字'] || '';
        if (!this.byHanzi.has(word)) {
          this.byHanzi.set(word, []);
        }
        this.byHanzi.get(word)!.push(enriched);
      }

      this.byLessonKey.set(lessonKey, items);
    }
  }

  public getAll(): EnrichedVocabularyItem[] {
    return [...this.allItems];
  }

  public getByLesson(level: number, lessonNumber: number): EnrichedVocabularyItem[] {
    const key = `hsk${level}-bai${lessonNumber}`;
    return this.byLessonKey.get(key) || [];
  }

  public getByWord(word: string): EnrichedVocabularyItem[] {
    return this.byHanzi.get(word) || [];
  }

  public getWordsContainingChar(char: string): EnrichedVocabularyItem[] {
    return this.allItems.filter((item) => (item['汉字'] || '').includes(char));
  }

  public search(options: VocabularyFilterOptions): EnrichedVocabularyItem[] {
    const q = (options.query || '').trim().toLowerCase();

    return this.allItems.filter((item) => {
      if (options.hskLevel !== undefined && item.hskLevel !== options.hskLevel) {
        return false;
      }
      if (options.lessonNumber !== undefined && item.lessonNumber !== options.lessonNumber) {
        return false;
      }
      if (options.partOfSpeech && item['Từ loại']?.trim() !== options.partOfSpeech) {
        return false;
      }

      if (!q) return true;

      const hanzi = (item['汉字'] || '').toLowerCase();
      const pinyin = (item['Pinyin'] || '').toLowerCase();
      const meaning = (item['Nghĩa tiếng Việt'] || '').toLowerCase();
      const collocation = (item['Cách kết hợp tự nhiên'] || item['Cụm từ cố định / collocation'] || '').toLowerCase();

      return (
        hanzi.includes(q) ||
        pinyin.includes(q) ||
        meaning.includes(q) ||
        collocation.includes(q)
      );
    });
  }
}

export const vocabularyRepository = new VocabularyRepository();
