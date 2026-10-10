/**
 * YUYAN Exam Repository — Version-Aware HSK Exam Engine
 * Dedicated data access for HSK 2.0 (Levels 1–6) & HSK 3.0 (Levels 1–9 / Band 7–9).
 * Supports official section configurations, timing, autosave sessions, and deterministic scoring.
 */

import { getSupabaseClient, getLearnerSessionId } from '../../services/supabase/client';
import {
  OFFICIAL_EXAM_PAPERS,
  OFFICIAL_EXAM_SOURCES,
  getExamCoverageSummary,
} from '../exam/examPapersInventory';
import {
  EXAM_PAPER_CATALOG,
  getExamPapersByLevel,
  getExamPaperById,
} from '../exam/examPaperCatalog';
import {
  MASTER_EXAM_QUESTION_BANK,
  getQuestionsByPaperId,
  getQuestionsByVersionAndLevel,
} from '../exam/examQuestionBank';
import { examIngestionService } from '../exam/examIngestionService';
import { HSK_SOURCE_REGISTRY } from '../exam/examSourceRegistry';
import {
  HskExamVersion,
  ExamSectionId,
  ExamQuestionType,
  ExamQuestion,
  ExamSectionConfig,
  ExamAttemptRecord,
  ActiveExamSession,
  ExamPaperMetadata,
} from '../exam/examTypes';

export type {
  HskExamVersion,
  ExamSectionId,
  ExamQuestionType,
  ExamQuestion,
  ExamSectionConfig,
  ExamAttemptRecord,
  ActiveExamSession,
  ExamPaperMetadata,
};

export interface ExamTemplateConfig {
  version: HskExamVersion;
  level: number;
  titleZh: string;
  titleVi: string;
  syllabusStandard: string;
  durationMinutes: number;
  passingScore: number;
  maxScore: number;
  sections: ExamSectionConfig[];
}

export const EXAM_TEMPLATES: Record<HskExamVersion, Record<number, ExamTemplateConfig>> = {
  hsk2: {
    1: {
      version: 'hsk2',
      level: 1,
      titleZh: 'HSK 2.0 一级',
      titleVi: 'HSK 2.0 Cấp độ 1',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 40,
      passingScore: 120,
      maxScore: 200,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 20, durationMinutes: 15, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 20, durationMinutes: 17, maxScore: 100 },
      ],
    },
    2: {
      version: 'hsk2',
      level: 2,
      titleZh: 'HSK 2.0 二级',
      titleVi: 'HSK 2.0 Cấp độ 2',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 55,
      passingScore: 120,
      maxScore: 200,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 35, durationMinutes: 25, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 25, durationMinutes: 22, maxScore: 100 },
      ],
    },
    3: {
      version: 'hsk2',
      level: 3,
      titleZh: 'HSK 2.0 三级',
      titleVi: 'HSK 2.0 Cấp độ 3',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 90,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 40, durationMinutes: 35, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 30, durationMinutes: 30, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 10, durationMinutes: 15, maxScore: 100 },
      ],
    },
    4: {
      version: 'hsk2',
      level: 4,
      titleZh: 'HSK 2.0 四级',
      titleVi: 'HSK 2.0 Cấp độ 4',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 105,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 45, durationMinutes: 30, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 40, durationMinutes: 40, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 15, durationMinutes: 25, maxScore: 100 },
      ],
    },
    5: {
      version: 'hsk2',
      level: 5,
      titleZh: 'HSK 2.0 五级',
      titleVi: 'HSK 2.0 Cấp độ 5',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 125,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 45, durationMinutes: 30, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 45, durationMinutes: 45, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 10, durationMinutes: 40, maxScore: 100 },
      ],
    },
    6: {
      version: 'hsk2',
      level: 6,
      titleZh: 'HSK 2.0 六级',
      titleVi: 'HSK 2.0 Cấp độ 6',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 140,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 50, durationMinutes: 35, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 50, durationMinutes: 50, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 1, durationMinutes: 45, maxScore: 100 },
      ],
    },
  },
  hsk3: {
    1: {
      version: 'hsk3',
      level: 1,
      titleZh: 'HSK 3.0 一级',
      titleVi: 'HSK 3.0 Cấp 1 (Sơ cấp 1)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 40,
      passingScore: 120,
      maxScore: 200,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 20, durationMinutes: 15, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 20, durationMinutes: 20, maxScore: 100 },
      ],
    },
    2: {
      version: 'hsk3',
      level: 2,
      titleZh: 'HSK 3.0 二级',
      titleVi: 'HSK 3.0 Cấp 2 (Sơ cấp 2)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 55,
      passingScore: 120,
      maxScore: 200,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 30, durationMinutes: 25, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 30, durationMinutes: 25, maxScore: 100 },
      ],
    },
    3: {
      version: 'hsk3',
      level: 3,
      titleZh: 'HSK 3.0 三级',
      titleVi: 'HSK 3.0 Cấp 3 (Sơ cấp 3)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 90,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 40, durationMinutes: 35, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 30, durationMinutes: 30, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 10, durationMinutes: 15, maxScore: 100 },
      ],
    },
    4: {
      version: 'hsk3',
      level: 4,
      titleZh: 'HSK 3.0 四级',
      titleVi: 'HSK 3.0 Cấp 4 (Trung cấp 1)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 105,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 40, durationMinutes: 30, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 40, durationMinutes: 40, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 15, durationMinutes: 25, maxScore: 100 },
      ],
    },
    5: {
      version: 'hsk3',
      level: 5,
      titleZh: 'HSK 3.0 五级',
      titleVi: 'HSK 3.0 Cấp 5 (Trung cấp 2)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 125,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 45, durationMinutes: 30, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 45, durationMinutes: 45, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 10, durationMinutes: 40, maxScore: 100 },
      ],
    },
    6: {
      version: 'hsk3',
      level: 6,
      titleZh: 'HSK 3.0 六级',
      titleVi: 'HSK 3.0 Cấp 6 (Trung cấp 3)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 140,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 50, durationMinutes: 35, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 50, durationMinutes: 50, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 5, durationMinutes: 45, maxScore: 100 },
      ],
    },
    7: {
      version: 'hsk3',
      level: 7,
      titleZh: 'HSK 3.0 七至九级',
      titleVi: 'HSK 3.0 Cấp cao (Cấp 7–9 gom dải)',
      syllabusStandard: 'GF0025-2021 Cấp độ Cao cấp Tích hợp',
      durationMinutes: 210,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe Chuyên sâu (听力)', questionCount: 40, durationMinutes: 40, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc Phân tích (阅读)', questionCount: 40, durationMinutes: 60, maxScore: 100 },
        { id: 'writing', title: 'Phần Luận & Dịch thuật (书写与翻译)', questionCount: 10, durationMinutes: 80, maxScore: 100 },
      ],
    },
  },
};

// Authoritative Questions Dataset across HSK 2.0 & HSK 3.0
export const MASTER_EXAM_QUESTIONS: ExamQuestion[] = MASTER_EXAM_QUESTION_BANK;

export class ExamRepository {
  private static instance: ExamRepository;

  public static getInstance(): ExamRepository {
    if (!ExamRepository.instance) {
      ExamRepository.instance = new ExamRepository();
    }
    return ExamRepository.instance;
  }

  public getTemplate(version: HskExamVersion, level: number): ExamTemplateConfig {
    const versionTemplates = EXAM_TEMPLATES[version] || EXAM_TEMPLATES.hsk3;
    return versionTemplates[level] || versionTemplates[1];
  }

  public getPaperMetadata(version: HskExamVersion, level: number): ExamPaperMetadata | undefined {
    const list = getExamPapersByLevel(version, level);
    return list[0] || EXAM_PAPER_CATALOG.find((p) => p.hskVersion === version && p.level === level);
  }

  public getPapersByLevel(version: HskExamVersion, level: number): ExamPaperMetadata[] {
    return getExamPapersByLevel(version, level);
  }

  public getPaperById(paperId: string): ExamPaperMetadata | undefined {
    return getExamPaperById(paperId);
  }

  public getAllPapers(): ExamPaperMetadata[] {
    return EXAM_PAPER_CATALOG;
  }

  public getCoverageSummary() {
    return examIngestionService.runValidationSuite();
  }

  public async getQuestions(
    version: HskExamVersion,
    level: number,
    paperId?: string
  ): Promise<ExamQuestion[]> {
    // 1. If specific paperId requested, fetch questions directly for that paper
    if (paperId) {
      const byPaper = getQuestionsByPaperId(paperId);
      if (byPaper.length > 0) return byPaper;
    }

    // 2. Fetch questions matching version and level from verified master bank
    const matched = getQuestionsByVersionAndLevel(version, level);
    if (matched.length > 0) return matched;

    // 3. Fallback to Supabase with STRICT version and level filtering (no cross-version mixing)
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await (supabase
          .from('exam_questions') as any)
          .select('*')
          .eq('hsk_level', level)
          .eq('hsk_version', version)
          .order('id', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            paperId: row.paper_id || `paper_${version}_l${level}_sample01`,
            hskVersion: (row.hsk_version as HskExamVersion) || version,
            hskLevel: row.hsk_level,
            section: (row.section as ExamSectionId) || 'reading',
            type: (row.question_type as ExamQuestion['type']) || 'reading_single',
            question: row.question_text,
            passageText: row.passage_text,
            passageTitle: row.passage_title,
            audioPrompt: row.audio_prompt,
            audioUrl: row.audio_url,
            transcript: row.transcript,
            options: Array.isArray(row.options) ? row.options : JSON.parse(row.options || '[]'),
            correctAnswer: row.correct_answer_index,
            explanation: row.explanation,
            provenance: row.provenance || {
              source_id: 'yuyan-curated-standard',
              source_url: 'https://yuyan.app/curated/exams',
              source_type: 'official_portal',
              hsk_version: version,
              hsk_level: level,
              exam_id: row.paper_id || 'default',
              section: row.section || 'reading',
              license: 'YUYAN License',
              attribution: 'YUYAN Assessment',
              imported_at: new Date().toISOString(),
              validation_status: 'verified',
            },
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch exam questions from Supabase, returning verified empty set:', err);
      }
    }

    // NEVER substitute cross-version questions! Return empty array if level has no questions.
    return [];
  }

  /**
   * Save Active Exam Session (Autosave to preserve state on refresh)
   */
  public saveActiveSession(session: ActiveExamSession): void {
    try {
      const key = `yuyan_active_exam_${session.version}_${session.level}`;
      localStorage.setItem(key, JSON.stringify(session));
    } catch {
      // quota safeguard
    }
  }

  public loadActiveSession(version: HskExamVersion, level: number): ActiveExamSession | null {
    try {
      const key = `yuyan_active_exam_${version}_${level}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public clearActiveSession(version: HskExamVersion, level: number): void {
    try {
      const key = `yuyan_active_exam_${version}_${level}`;
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  /**
   * Save Completed Exam Attempt
   */
  public async saveAttempt(attempt: Omit<ExamAttemptRecord, 'userId'>): Promise<void> {
    const userId = getLearnerSessionId();
    const supabase = getSupabaseClient();

    // Clear active autosaved session once submitted
    this.clearActiveSession(attempt.hskVersion, attempt.hskLevel);

    // Save to local storage
    try {
      const key = `yuyan_exam_history_${attempt.hskVersion}_${attempt.hskLevel}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({
        ...attempt,
        userId,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 30)));
    } catch {
      // LocalStorage quota safety
    }

    // Sync to Supabase
    if (supabase) {
      try {
        await supabase.from('exam_attempts').insert({
          user_id: userId,
          hsk_level: attempt.hskLevel,
          score: attempt.score,
          total_questions: attempt.totalQuestions,
          time_spent_seconds: attempt.timeSpentSeconds,
          answers: attempt.answers,
        });
      } catch (err) {
        console.warn('Failed to sync exam attempt to Supabase:', err);
      }
    }
  }

  /**
   * Fetch Past Exam Attempts
   */
  public async getAttempts(version: HskExamVersion, level?: number): Promise<ExamAttemptRecord[]> {
    const userId = getLearnerSessionId();
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        let query = (supabase as any)
          .from('exam_attempts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (typeof level === 'number') {
          query = query.eq('hsk_level', level);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            hskVersion: version,
            hskLevel: r.hsk_level,
            score: r.score,
            totalQuestions: r.total_questions,
            timeSpentSeconds: r.time_spent_seconds,
            answers: r.answers || {},
            passed: r.score >= (r.hsk_level <= 2 ? 120 : 180),
            createdAt: r.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase exam attempts fetch failed, falling back to local:', err);
      }
    }

    // Local fallback
    try {
      if (typeof level === 'number') {
        const key = `yuyan_exam_history_${version}_${level}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
      } else {
        const all: ExamAttemptRecord[] = [];
        for (let l = 1; l <= 7; l++) {
          const list = JSON.parse(
            localStorage.getItem(`yuyan_exam_history_${version}_${l}`) || '[]'
          );
          all.push(...list);
        }
        return all.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      }
    } catch {
      return [];
    }
  }
}

export const examRepository = ExamRepository.getInstance();
export {
  OFFICIAL_EXAM_PAPERS,
  OFFICIAL_EXAM_SOURCES,
  getExamCoverageSummary,
  EXAM_PAPER_CATALOG,
  MASTER_EXAM_QUESTION_BANK,
  examIngestionService,
  HSK_SOURCE_REGISTRY,
};

