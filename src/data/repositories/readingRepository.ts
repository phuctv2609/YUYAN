/**
 * YUYAN Reading Repository
 * Access to the 146 reading passages, comprehension questions, and reappeared vocabulary.
 */

import { lessonRepository } from '../hsk/lessonRepository';
import { LessonReading } from '../hsk/types';

export interface ParsedReadingData {
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  vocabularyReappeared: string;
  comprehensionQuestions: string[];
  title: string;
  lessonId: string;
}

export class ReadingRepository {
  public getLessonReading(level: number, lessonNumber: number): {
    raw?: LessonReading;
    parsed?: ParsedReadingData;
  } {
    const raw = lessonRepository.getLessonReading(level, lessonNumber);
    const parsed = lessonRepository.getParsedLessonReading(level, lessonNumber);
    return { raw, parsed };
  }

  public getAll(): Array<{ level: number; lessonNumber: number; parsed?: ParsedReadingData }> {
    const results: Array<{ level: number; lessonNumber: number; parsed?: ParsedReadingData }> = [];
    const all = lessonRepository.getAllLessons();
    for (const l of all) {
      const parsed = lessonRepository.getParsedLessonReading(l.level, l.lessonNumber);
      results.push({
        level: l.level,
        lessonNumber: l.lessonNumber,
        parsed,
      });
    }
    return results;
  }
}

export const readingRepository = new ReadingRepository();
