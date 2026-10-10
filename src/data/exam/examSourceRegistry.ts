/**
 * YUYAN — Centralized HSK Data Provider Registry & Provenance Tracking
 * Tracks all official, open dataset, and licensed mock exam sources for HSK 2.0 & HSK 3.0.
 */

export type SourceType =
  | 'official_portal'
  | 'official_download'
  | 'open_dataset'
  | 'community_resource'
  | 'licensed_mock';

export type HskFrameworkVersion = 'hsk2' | 'hsk3' | 'both';

export interface ExamSourceProvider {
  sourceId: string;
  providerName: string;
  sourceUrl: string;
  sourceType: SourceType;
  hskVersion: HskFrameworkVersion;
  supportedLevels: number[];
  supportedQuestionTypes: Array<
    | 'listening_single'
    | 'listening_group'
    | 'listening_true_false'
    | 'reading_single'
    | 'reading_passage'
    | 'reading_fill'
    | 'reading_order'
    | 'writing_prompt'
    | 'writing_order'
    | 'speaking_prompt'
    | 'translation_prompt'
  >;
  hasAudio: boolean;
  hasAnswerKeys: boolean;
  hasTranscripts: boolean;
  license: string;
  attribution: string;
  hasRestApi: boolean;
  apiNotes: string;
  lastSync: string;
  lastValidationResult: 'passed' | 'warning' | 'pending';
  availabilityStatus: 'active' | 'rate_limited' | 'offline';
}

export interface QuestionProvenance {
  source_id: string;
  source_url: string;
  source_type: SourceType;
  hsk_version: 'hsk2' | 'hsk3';
  hsk_level: number;
  exam_id: string;
  section: 'listening' | 'reading' | 'writing' | 'speaking' | 'translation';
  license: string;
  attribution: string;
  imported_at: string;
  validation_status: 'verified' | 'provisional' | 'flagged';
}

export const HSK_SOURCE_REGISTRY: Record<string, ExamSourceProvider> = {
  'cti-official-download': {
    sourceId: 'cti-official-download',
    providerName: 'Chinese Testing International (CTI) — Official Download Portal',
    sourceUrl: 'https://admin.chinesetest.cn/godownload.do',
    sourceType: 'official_download',
    hskVersion: 'both',
    supportedLevels: [1, 2, 3, 4, 5, 6],
    supportedQuestionTypes: [
      'listening_single',
      'listening_group',
      'reading_single',
      'reading_passage',
      'reading_fill',
      'writing_prompt',
      'writing_order',
    ],
    hasAudio: true,
    hasAnswerKeys: true,
    hasTranscripts: true,
    license: 'Official Public Syllabus & Educational Reference',
    attribution: 'Chinese Testing International / Ministry of Education PRC',
    hasRestApi: false,
    apiNotes: 'No public REST API endpoint. Provides downloadable sample PDFs, answer keys, and MP3 audio packages.',
    lastSync: '2026-10-10T16:00:00Z',
    lastValidationResult: 'passed',
    availabilityStatus: 'active',
  },

  'cti-hsk79-sample': {
    sourceId: 'cti-hsk79-sample',
    providerName: 'Chinese Testing International — Official HSK 7–9 Sample Paper',
    sourceUrl: 'https://download.chinesetest.cn/newhsk-site/model/HSK7-9.pdf',
    sourceType: 'official_download',
    hskVersion: 'hsk3',
    supportedLevels: [7, 8, 9],
    supportedQuestionTypes: [
      'listening_group',
      'reading_passage',
      'writing_prompt',
      'speaking_prompt',
      'translation_prompt',
    ],
    hasAudio: true,
    hasAnswerKeys: true,
    hasTranscripts: true,
    license: 'National Syllabus Public Model Standard (GF0025-2021)',
    attribution: 'National Language Commission / CTI — Standard GF0025-2021',
    hasRestApi: false,
    apiNotes: 'Official model examination paper for integrated Advanced Band 7–9 (210 minutes, 98 questions). Does not offer subdivided individual level papers.',
    lastSync: '2026-10-10T16:00:00Z',
    lastValidationResult: 'passed',
    availabilityStatus: 'active',
  },

  'saymei-zhongdex': {
    sourceId: 'saymei-zhongdex',
    providerName: 'Zhongdex Graded Lexicon & Sentences (SayMei)',
    sourceUrl: 'https://github.com/saymei/zhongdex',
    sourceType: 'open_dataset',
    hskVersion: 'hsk3',
    supportedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    supportedQuestionTypes: ['reading_single', 'reading_fill', 'translation_prompt'],
    hasAudio: false,
    hasAnswerKeys: true,
    hasTranscripts: false,
    license: 'Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
    attribution: 'SayMei (zhongdex) / CC-CEDICT & HSK 3.0 Word List',
    hasRestApi: true,
    apiNotes: 'Available via GitHub Raw structured JSON/CSV data files. Does not host raw MP3 clips.',
    lastSync: '2026-10-10T16:30:00Z',
    lastValidationResult: 'passed',
    availabilityStatus: 'active',
  },

  'mandarin-zone-hsk4': {
    sourceId: 'mandarin-zone-hsk4',
    providerName: 'Mandarin Zone HSK 4 Mock Examinations (via InAnskr / HSK4Level-Test)',
    sourceUrl: 'https://github.com/InAnskr/HSK4Level-Test',
    sourceType: 'licensed_mock',
    hskVersion: 'hsk2',
    supportedLevels: [4],
    supportedQuestionTypes: [
      'listening_single',
      'listening_true_false',
      'reading_single',
      'reading_passage',
      'reading_order',
      'reading_fill',
      'writing_order',
    ],
    hasAudio: true,
    hasAnswerKeys: true,
    hasTranscripts: true,
    license: 'Open Educational Resource / Attribution',
    attribution: 'Mandarin Zone (mandarinzone.com) curated by InAnskr',
    hasRestApi: true,
    apiNotes: 'Available via GitHub Raw JSON test sets (12 complete examination papers).',
    lastSync: '2026-10-10T16:40:00Z',
    lastValidationResult: 'passed',
    availabilityStatus: 'active',
  },

  'make-dream-clear-hsk4': {
    sourceId: 'make-dream-clear-hsk4',
    providerName: 'HSK 4 Mock Exam & Confusables (Make-dream-clear)',
    sourceUrl: 'https://github.com/Make-dream-clear/hsk4-mock-exam',
    sourceType: 'community_resource',
    hskVersion: 'hsk2',
    supportedLevels: [4],
    supportedQuestionTypes: [
      'listening_single',
      'reading_single',
      'reading_order',
      'reading_fill',
      'writing_order',
    ],
    hasAudio: false,
    hasAnswerKeys: true,
    hasTranscripts: true,
    license: 'MIT License',
    attribution: 'Make-dream-clear HSK 4 Mock Project',
    hasRestApi: true,
    apiNotes: 'Available via GitHub Raw JSON test sets (19 mock exam datasets and trap collections).',
    lastSync: '2026-10-10T16:45:00Z',
    lastValidationResult: 'passed',
    availabilityStatus: 'active',
  },

  'yuyan-curated-standard': {
    sourceId: 'yuyan-curated-standard',
    providerName: 'YUYAN Curated Benchmark Examination Bank',
    sourceUrl: 'https://yuyan.app/curated/exams',
    sourceType: 'official_portal',
    hskVersion: 'both',
    supportedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    supportedQuestionTypes: [
      'listening_single',
      'listening_group',
      'reading_single',
      'reading_passage',
      'reading_fill',
      'reading_order',
      'writing_prompt',
      'writing_order',
      'speaking_prompt',
      'translation_prompt',
    ],
    hasAudio: true,
    hasAnswerKeys: true,
    hasTranscripts: true,
    license: 'YUYAN Educational License',
    attribution: 'YUYAN Academic Curriculum Team based on Hanban 2015 & GF0025-2021',
    hasRestApi: true,
    apiNotes: 'Internal verified examination bank with real Vietnamese annotations and pedagogical explanations.',
    lastSync: '2026-10-10T16:50:00Z',
    lastValidationResult: 'passed',
    availabilityStatus: 'active',
  },
};

export function getExamSource(sourceId: string): ExamSourceProvider | undefined {
  return HSK_SOURCE_REGISTRY[sourceId];
}

export function getAllExamSources(): ExamSourceProvider[] {
  return Object.values(HSK_SOURCE_REGISTRY);
}

export function getSourcesByVersionAndLevel(
  version: 'hsk2' | 'hsk3',
  level: number
): ExamSourceProvider[] {
  return Object.values(HSK_SOURCE_REGISTRY).filter((s) => {
    const versionMatch = s.hskVersion === 'both' || s.hskVersion === version;
    const levelMatch = s.supportedLevels.includes(level);
    return versionMatch && levelMatch;
  });
}
