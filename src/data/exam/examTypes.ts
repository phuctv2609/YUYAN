/**
 * YUYAN — Canonical Types & Interfaces for HSK Examination Engine
 * Strict separation between HSK 2.0 (Levels 1–6) and HSK 3.0 (Levels 1–9).
 */

import { QuestionProvenance, SourceType } from './examSourceRegistry';

export type HskExamVersion = 'hsk2' | 'hsk3';

export type ExamSectionId = 'listening' | 'reading' | 'writing' | 'speaking' | 'translation';

export type ExamQuestionType =
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
  | 'translation_prompt';

export interface ExamQuestion {
  id: number;
  paperId: string;
  hskVersion: HskExamVersion;
  hskLevel: number;
  section: ExamSectionId;
  type: ExamQuestionType;
  question: string;
  passageText?: string;
  passageTitle?: string;
  audioPrompt?: string;
  audioUrl?: string;
  transcript?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  provenance: QuestionProvenance;
}

export interface ExamSectionConfig {
  id: ExamSectionId;
  title: string;
  questionCount: number;
  durationMinutes: number;
  maxScore: number;
}

export interface ExamPaperMetadata {
  paperId: string;
  hskVersion: HskExamVersion;
  level: number;
  sourceId: string;
  providerName?: string;
  titleZh: string;
  titleVi: string;
  syllabusStandard: string;
  sourceUrl: string;
  sourceRevision: string;
  sourceType?: SourceType;
  license: string;
  classification: 'official_sample' | 'authorized_mock' | 'yuyan_standard_mock';
  verificationStatus: 'verified' | 'provisional';
  durationMinutes: number;
  totalQuestions: number;
  maxScore: number;
  passingScore: number;
  hasVerifiedAnswerKey: boolean;
  hasListeningAudio: boolean;
  hasTranscript: boolean;
  sections: ExamSectionConfig[];
}

export interface ExamAttemptRecord {
  id?: string;
  userId: string;
  paperId: string;
  hskVersion: HskExamVersion;
  hskLevel: number;
  score: number;
  sectionScores?: Record<ExamSectionId, number>;
  totalQuestions: number;
  timeSpentSeconds: number;
  answers: Record<number, number>;
  passed: boolean;
  mode: 'timed_simulation' | 'practice_mode';
  createdAt?: string;
}

export interface ActiveExamSession {
  paperId: string;
  version: HskExamVersion;
  level: number;
  mode: 'timed_simulation' | 'practice_mode';
  startedAt: number;
  durationSeconds: number;
  timeLeft: number;
  currentQuestionIndex: number;
  answers: Record<number, number>;
  flaggedQuestionIds: number[];
}

export interface IngestionValidationReport {
  totalProcessed: number;
  totalAccepted: number;
  totalRejected: number;
  rejectionReasons: Array<{ recordId: string | number; reason: string }>;
  verifiedAnswerKeysCount: number;
  coverageByVersion: {
    hsk2: Record<number, { papers: number; questions: number }>;
    hsk3: Record<number, { papers: number; questions: number }>;
  };
}
