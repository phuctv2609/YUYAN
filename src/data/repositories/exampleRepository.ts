/**
 * YUYAN Example Repository
 * Provides contextual authentic sentence examples for words and characters from the 9,178 HSK lesson sentences.
 */

import { lessonRepository } from '../hsk/lessonRepository';

export interface SentenceExample {
  id: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  level: number;
  lessonNumber: number;
  lessonTitle: string;
}

export class ExampleRepository {
  public getExamplesForWord(word: string, limit: number = 5): SentenceExample[] {
    if (!word) return [];
    const results: SentenceExample[] = [];
    const all = lessonRepository.getAllLessons();

    for (const l of all) {
      for (const s of l.lessonText) {
        if (s.hanzi.includes(word)) {
          results.push({
            id: `${l.lessonId}_s${s.index}`,
            hanzi: s.hanzi,
            pinyin: s.pinyin,
            vietnamese: s.vietnamese,
            level: l.level,
            lessonNumber: l.lessonNumber,
            lessonTitle: `HSK ${l.level} Bài ${l.lessonNumber}`,
          });
          if (results.length >= limit) return results;
        }
      }
    }
    return results;
  }

  public getExamplesForChar(char: string, limit: number = 5): SentenceExample[] {
    return this.getExamplesForWord(char, limit);
  }
}

export const exampleRepository = new ExampleRepository();
