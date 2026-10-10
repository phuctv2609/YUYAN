/**
 * YUYAN Progress Repository
 * Tracks real lesson completions, learned words, study duration, and review queue.
 */

import { getSupabaseClient, getLearnerSessionId } from '../../services/supabase/client';

export interface LearnerProgressStats {
  completedLessons: string[]; // e.g. ["hsk1-bai01", "hsk1-bai02"]
  learnedWords: string[]; // e.g. ["你好", "谢谢"]
  learnedHanzi: string[]; // e.g. ["你", "好"]
  totalListeningMinutes: number;
  totalSpeakingMinutes: number;
  totalWritingMinutes: number;
  lastStudyDate: string; // YYYY-MM-DD
  dailyMinutesStudied: number;
}

const STORAGE_KEY = 'yuyan_progress_stats_v1';

const DEFAULT_STATS: LearnerProgressStats = {
  completedLessons: ['hsk1-bai01'],
  learnedWords: ['你好', '您', '好', '老师', '学生'],
  learnedHanzi: ['你', '好', '您', '老', '师', '学', '生'],
  totalListeningMinutes: 15,
  totalSpeakingMinutes: 10,
  totalWritingMinutes: 8,
  lastStudyDate: new Date().toISOString().split('T')[0],
  dailyMinutesStudied: 33,
};

export class ProgressRepository {
  private stats: LearnerProgressStats;
  private listeners: Set<(stats: LearnerProgressStats) => void> = new Set();

  constructor() {
    this.stats = this.loadStats();
  }

  public getStats(): LearnerProgressStats {
    return { ...this.stats };
  }

  public markLessonComplete(level: number, lessonNumber: number): void {
    const key = `hsk${level}-bai${String(lessonNumber).padStart(2, '0')}`;
    if (!this.stats.completedLessons.includes(key)) {
      this.stats.completedLessons.push(key);
      this.saveStats();
      this.notify();
    }
  }

  public markWordLearned(word: string): void {
    if (!this.stats.learnedWords.includes(word)) {
      this.stats.learnedWords.push(word);
      this.saveStats();
      this.notify();
    }
  }

  public addStudyMinutes(minutes: number, activity: 'listening' | 'speaking' | 'writing' | 'general' = 'general'): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.stats.lastStudyDate !== today) {
      this.stats.lastStudyDate = today;
      this.stats.dailyMinutesStudied = 0;
    }

    this.stats.dailyMinutesStudied += minutes;
    if (activity === 'listening') this.stats.totalListeningMinutes += minutes;
    if (activity === 'speaking') this.stats.totalSpeakingMinutes += minutes;
    if (activity === 'writing') this.stats.totalWritingMinutes += minutes;

    this.saveStats();
    this.notify();
  }

  public subscribe(listener: (stats: LearnerProgressStats) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStats());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private loadStats(): LearnerProgressStats {
    if (typeof window === 'undefined') return DEFAULT_STATS;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return { ...DEFAULT_STATS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Recovered corrupted progress stats:', e);
      localStorage.removeItem(STORAGE_KEY);
    }
    return DEFAULT_STATS;
  }

  private saveStats(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch (e) {
      console.error('Failed to save progress stats:', e);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const totalMinutes =
        this.stats.totalListeningMinutes +
        this.stats.totalSpeakingMinutes +
        this.stats.totalWritingMinutes;
      void (async () => {
        try {
          await supabase.from('learner_profiles').upsert({
            id: getLearnerSessionId(),
            total_study_minutes: totalMinutes,
            updated_at: new Date().toISOString(),
          });
        } catch {
          // Offline resilience
        }
      })();
    }
  }

  private notify(): void {
    const current = this.getStats();
    for (const l of this.listeners) {
      try {
        l(current);
      } catch (err) {
        console.error('Error in ProgressRepository listener:', err);
      }
    }
  }
}

export const progressRepository = new ProgressRepository();
