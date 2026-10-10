export interface Sentence {
  index: number;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}

export interface LessonSection {
  number?: string;
  title: string;
  items?: string[];
  subSections?: Array<{
    title: string;
    items?: string[];
  }>;
}

export interface SourceIntegrity {
  hanziCount: number;
  pinyinCount: number;
  vietnameseCount: number;
  alignmentStatus: 'aligned' | 'needs_review';
}

export interface Lesson {
  lessonId: string;
  level: number;
  lessonNumber: number;
  title: string;
  sourceFile: string;
  sourcePath?: string;
  paragraphCount?: number;
  sections?: LessonSection[];
  lessonText: Sentence[];
  sourceIntegrity?: SourceIntegrity;
}

export interface LessonDatasetMeta {
  sourceArchive: string;
  lessonCount: number;
  levels: Record<string, number>;
  authority: string;
}

export interface HskDataset {
  meta: LessonDatasetMeta;
  lessons: Lesson[];
}

export interface LessonFilter {
  level?: number;
  lessonNumber?: number;
  query?: string;
}

export interface RawVocabularyItem {
  '汉字': string;
  'Pinyin': string;
  'Từ loại': string;
  'Nghĩa tiếng Việt': string;
  'Cách kết hợp tự nhiên'?: string;
  'STT'?: number | string;
  'Sắc thái'?: string;
  'Cụm từ cố định / collocation'?: string;
}

export interface LessonVocabulary {
  level: number;
  lesson: number;
  lessonId: string;
  title: string;
  sourceFile?: string;
  vocabulary: RawVocabularyItem[];
}

export interface LessonReadingData {
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  vocabularyReappeared?: string;
  comprehensionQuestions?: string[];
}

export interface LessonReading {
  level: number;
  lesson: number;
  lessonId: string;
  title: string;
  sourceFile?: string;
  reading: LessonReadingData;
}
