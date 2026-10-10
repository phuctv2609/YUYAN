import rawDataset from '../../../data/hsk/lessons.json';
import rawVocabulary from '../../../data/hsk/vocabulary.json';
import rawReading from '../../../data/hsk/reading.json';
import {
  HskDataset,
  Lesson,
  LessonDatasetMeta,
  LessonFilter,
  LessonVocabulary,
  RawVocabularyItem,
  LessonReading,
  LessonReadingData,
} from './types.ts';

const dataset = rawDataset as unknown as HskDataset;
const lessons: Lesson[] = dataset.lessons || [];

const vocabData = rawVocabulary as unknown as { source: string; lessons: LessonVocabulary[] };
const readingData = rawReading as unknown as { source: string; lessons: LessonReading[] };

export function makeLessonKey(level: number, lessonNumber: number): string {
  return `hsk${level}-bai${String(lessonNumber).padStart(2, '0')}`;
}

export function parseReadingData(raw: LessonReadingData): {
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  vocabularyReappeared: string;
  comprehensionQuestions: string[];
} {
  const hanzi = raw.hanzi || '';
  const rawPinyin = raw.pinyin || '';
  let vietnamese = raw.vietnamese || '';
  let vocabularyReappeared = raw.vocabularyReappeared || '';
  const comprehensionQuestions = raw.comprehensionQuestions || [];

  let cleanPinyin = rawPinyin;
  if (!vietnamese && rawPinyin) {
    const lines = rawPinyin.split('\n');
    const pinyinLines: string[] = [];
    const vnLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('十八、') || trimmed.includes('Từ của bài xuất hiện lại')) {
        if (!vocabularyReappeared) {
          vocabularyReappeared = trimmed;
        }
        continue;
      }
      if (/[à-ỹá-ýđ]/i.test(trimmed)) {
        vnLines.push(trimmed);
      } else {
        pinyinLines.push(trimmed);
      }
    }

    if (vnLines.length > 0) {
      vietnamese = vnLines.join('\n\n');
      cleanPinyin = pinyinLines.join('\n\n');
    }
  }

  return {
    hanzi,
    pinyin: cleanPinyin,
    vietnamese,
    vocabularyReappeared,
    comprehensionQuestions,
  };
}

export class LessonRepository {
  private static instance: LessonRepository;
  private readonly lessonsMapById: Map<string, Lesson>;
  private readonly lessonsByLevel: Map<number, Lesson[]>;
  private readonly vocabularyMap: Map<string, LessonVocabulary>;
  private readonly readingMap: Map<string, LessonReading>;

  private constructor() {
    this.lessonsMapById = new Map();
    this.lessonsByLevel = new Map();
    this.vocabularyMap = new Map();
    this.readingMap = new Map();

    for (const lesson of lessons) {
      this.lessonsMapById.set(lesson.lessonId, lesson);

      if (!this.lessonsByLevel.has(lesson.level)) {
        this.lessonsByLevel.set(lesson.level, []);
      }
      this.lessonsByLevel.get(lesson.level)!.push(lesson);
    }

    // Index vocabulary
    if (vocabData && Array.isArray(vocabData.lessons)) {
      for (const item of vocabData.lessons) {
        const key = item.lessonId || makeLessonKey(item.level, item.lesson);
        this.vocabularyMap.set(key, item);
      }
    }

    // Index reading
    if (readingData && Array.isArray(readingData.lessons)) {
      for (const item of readingData.lessons) {
        const key = item.lessonId || makeLessonKey(item.level, item.lesson);
        this.readingMap.set(key, item);
      }
    }

    // Ensure sorted by lessonNumber in each level
    for (const lvlLessons of this.lessonsByLevel.values()) {
      lvlLessons.sort((a, b) => a.lessonNumber - b.lessonNumber);
    }
  }

  public static getInstance(): LessonRepository {
    if (!LessonRepository.instance) {
      LessonRepository.instance = new LessonRepository();
    }
    return LessonRepository.instance;
  }

  public getMeta(): LessonDatasetMeta {
    return dataset.meta;
  }

  public getAllLessons(): Lesson[] {
    return [...lessons];
  }

  public getLessonsByLevel(level: number): Lesson[] {
    return this.lessonsByLevel.get(level) || [];
  }

  public getLessonById(lessonId: string): Lesson | undefined {
    return this.lessonsMapById.get(lessonId);
  }

  public getLesson(level: number, lessonNumber: number): Lesson | undefined {
    const lvlLessons = this.lessonsByLevel.get(level);
    if (!lvlLessons) return undefined;
    return lvlLessons.find((l) => l.lessonNumber === lessonNumber);
  }

  public getAdjacentLessons(lessonId: string): {
    previous?: Lesson;
    next?: Lesson;
  } {
    const current = this.lessonsMapById.get(lessonId);
    if (!current) return {};

    const lvlLessons = this.lessonsByLevel.get(current.level) || [];
    const currentIndex = lvlLessons.findIndex((l) => l.lessonId === lessonId);

    let previous: Lesson | undefined;
    if (currentIndex > 0) {
      previous = lvlLessons[currentIndex - 1];
    } else if (current.level > 1) {
      // Cross-level previous: last lesson of previous level
      const prevLvlLessons = this.lessonsByLevel.get(current.level - 1) || [];
      if (prevLvlLessons.length > 0) {
        previous = prevLvlLessons[prevLvlLessons.length - 1];
      }
    }

    let next: Lesson | undefined;
    if (currentIndex >= 0 && currentIndex < lvlLessons.length - 1) {
      next = lvlLessons[currentIndex + 1];
    } else if (current.level < 6) {
      // Cross-level next: first lesson of next level
      const nextLvlLessons = this.lessonsByLevel.get(current.level + 1) || [];
      if (nextLvlLessons.length > 0) {
        next = nextLvlLessons[0];
      }
    }

    return { previous, next };
  }

  public getLevelStats(): { level: number; totalLessons: number; alignedCount: number }[] {
    const stats: { level: number; totalLessons: number; alignedCount: number }[] = [];
    for (let lvl = 1; lvl <= 6; lvl++) {
      const lvlLessons = this.lessonsByLevel.get(lvl) || [];
      const aligned = lvlLessons.filter((l) => l.sourceIntegrity?.alignmentStatus === 'aligned').length;
      stats.push({
        level: lvl,
        totalLessons: lvlLessons.length,
        alignedCount: aligned,
      });
    }
    return stats;
  }

  public filterLessons(filter: LessonFilter): Lesson[] {
    let result = lessons;

    if (filter.level !== undefined) {
      result = result.filter((l) => l.level === filter.level);
    }

    if (filter.lessonNumber !== undefined) {
      result = result.filter((l) => l.lessonNumber === filter.lessonNumber);
    }

    if (filter.query && filter.query.trim()) {
      const q = filter.query.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.lessonId.toLowerCase().includes(q) ||
          l.lessonText.some(
            (s) =>
              s.hanzi.toLowerCase().includes(q) ||
              s.pinyin.toLowerCase().includes(q) ||
              s.vietnamese.toLowerCase().includes(q)
          )
      );
    }

    return result;
  }

  public getLessonVocabulary(level: number, lessonNumber: number): LessonVocabulary | undefined {
    const key = makeLessonKey(level, lessonNumber);
    return this.vocabularyMap.get(key);
  }

  public getLessonVocabularyById(lessonId: string): LessonVocabulary | undefined {
    return this.vocabularyMap.get(lessonId);
  }

  public getLessonReading(level: number, lessonNumber: number): LessonReading | undefined {
    const key = makeLessonKey(level, lessonNumber);
    return this.readingMap.get(key);
  }

  public getLessonReadingById(lessonId: string): LessonReading | undefined {
    return this.readingMap.get(lessonId);
  }

  public getParsedLessonReading(level: number, lessonNumber: number): {
    hanzi: string;
    pinyin: string;
    vietnamese: string;
    vocabularyReappeared: string;
    comprehensionQuestions: string[];
    title: string;
    lessonId: string;
  } | undefined {
    const item = this.getLessonReading(level, lessonNumber);
    if (!item || !item.reading) return undefined;
    const parsed = parseReadingData(item.reading);
    return {
      ...parsed,
      title: item.title,
      lessonId: item.lessonId,
    };
  }

  public searchVocabulary(
    query: string,
    level?: number
  ): Array<{
    item: RawVocabularyItem;
    lessonId: string;
    level: number;
    lessonNumber: number;
    lessonTitle: string;
  }> {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: Array<{
      item: RawVocabularyItem;
      lessonId: string;
      level: number;
      lessonNumber: number;
      lessonTitle: string;
    }> = [];

    for (const lessonVocab of this.vocabularyMap.values()) {
      if (level !== undefined && lessonVocab.level !== level) continue;

      for (const item of lessonVocab.vocabulary) {
        const hanzi = (item['汉字'] || '').toLowerCase();
        const pinyin = (item['Pinyin'] || '').toLowerCase();
        const meaning = (item['Nghĩa tiếng Việt'] || '').toLowerCase();
        const collocation = (item['Cách kết hợp tự nhiên'] || item['Cụm từ cố định / collocation'] || '').toLowerCase();

        if (
          hanzi.includes(q) ||
          pinyin.includes(q) ||
          meaning.includes(q) ||
          collocation.includes(q)
        ) {
          results.push({
            item,
            lessonId: lessonVocab.lessonId,
            level: lessonVocab.level,
            lessonNumber: lessonVocab.lesson,
            lessonTitle: lessonVocab.title,
          });
        }
      }
    }

    return results;
  }

  public getPracticeSentences(level?: number, limit = 50): Array<{
    id: string;
    hanzi: string;
    pinyin: string;
    vietnamese: string;
    level: number;
    lessonTitle: string;
  }> {
    const list: Array<{
      id: string;
      hanzi: string;
      pinyin: string;
      vietnamese: string;
      level: number;
      lessonTitle: string;
    }> = [];

    const targetLessons = level !== undefined ? this.getLessonsByLevel(level) : this.getAllLessons();

    for (const l of targetLessons) {
      if (!Array.isArray(l.lessonText)) continue;
      for (let i = 0; i < l.lessonText.length; i++) {
        const s = l.lessonText[i];
        if (s.hanzi && s.vietnamese) {
          list.push({
            id: `${l.lessonId}-s${i + 1}`,
            hanzi: s.hanzi,
            pinyin: s.pinyin || '',
            vietnamese: s.vietnamese,
            level: l.level,
            lessonTitle: l.title,
          });
          if (list.length >= limit) return list;
        }
      }
    }

    return list;
  }
}

export const lessonRepository = LessonRepository.getInstance();
