/**
 * YUYAN — Authoritative HSK Grammar Schema
 * Explicitly separates HSK 2.0 (Hanban 2015) and HSK 3.0 (GF0025-2021).
 */

export type HskVersion = 'hsk2' | 'hsk3';
export type SyllabusEdition = 'GF0025-2021' | 'Hanban-2015' | 'YUYAN-Curated';

export interface GrammarExample {
  hanzi: string;
  pinyin?: string;
  vietnamese?: string;
  source?: string;
}

export interface CommonMistake {
  wrong: string;
  correct: string;
  reason: string;
}

export interface GrammarExercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface NormalizedGrammarPoint {
  id: string;
  hskVersion: HskVersion;
  syllabusEdition: SyllabusEdition;
  sourceLevel: string; // 'HSK1'..'HSK6' or 'HSK7-9'
  normalizedLevel: number; // 1..6 or 7 for Band 7-9
  bandLabel: string;
  pattern: string;
  title: string;
  category: string;
  subCategory?: string;
  detailNote?: string;
  positivePattern?: string;
  negativePattern?: string;
  interrogativePattern?: string;
  explanation: string;
  structureSummary?: string;
  examples: GrammarExample[];
  commonMistakes?: CommonMistake[];
  practiceExercises?: GrammarExercise[];
  notes?: string;
  sourceUrl: string;
  sourceRevision: string;
  verificationStatus: 'verified_official_source' | 'verified_curated' | 'source_imported';
}
