/**
 * YUYAN Progress Repository
 * Unified proxy to authoritative LearningProgressService.
 * Maintains backward compatibility while guaranteeing real-time persistence and synchronization.
 */

import {
  learningProgressService,
  LearningProgressSnapshot,
  getTodayDateString,
} from '../../services/progress/learningProgressService.ts';

export interface LearnerProgressStats {
  completedLessons: string[]; // e.g. ["hsk1-bai01", "hsk1-bai02"]
  learnedWords: string[]; // e.g. ["你好", "谢谢"]
  learnedHanzi: string[]; // e.g. ["你", "好"]
  totalListeningMinutes: number;
  totalSpeakingMinutes: number;
  totalWritingMinutes: number;
  lastStudyDate: string; // YYYY-MM-DD
  dailyMinutesStudied: number;
  // Enhanced telemetry
  journeyStartDate: string | null;
  journeyDay: number;
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  totalCompletedLessons: number;
  totalLessons: number;
  overallPercent: number;
}

export class ProgressRepository {
  private mapSnapshotToStats(snapshot: LearningProgressSnapshot): LearnerProgressStats {
    const totalMins = snapshot.totalStudyMinutes;
    return {
      completedLessons: [...snapshot.completedLessons],
      learnedWords: [...snapshot.learnedWords],
      learnedHanzi: [...snapshot.learnedHanzi],
      totalListeningMinutes: Math.round(totalMins * 0.4),
      totalSpeakingMinutes: Math.round(totalMins * 0.3),
      totalWritingMinutes: Math.round(totalMins * 0.3),
      lastStudyDate: snapshot.lastStudyDate || getTodayDateString(),
      dailyMinutesStudied: snapshot.dailyMinutesStudied,
      journeyStartDate: snapshot.journeyStartDate,
      journeyDay: snapshot.journeyDay,
      currentStreak: snapshot.currentStreak,
      longestStreak: snapshot.longestStreak,
      totalActiveDays: snapshot.totalActiveDays,
      totalCompletedLessons: snapshot.totalCompletedLessons,
      totalLessons: snapshot.totalLessons,
      overallPercent: snapshot.overallPercent,
    };
  }

  public getStats(): LearnerProgressStats {
    return this.mapSnapshotToStats(learningProgressService.getSnapshot());
  }

  public getSnapshot(): LearningProgressSnapshot {
    return learningProgressService.getSnapshot();
  }

  public markLessonComplete(level: number, lessonNumber: number, score: number = 100): void {
    void learningProgressService.markLessonComplete(level, lessonNumber, score);
  }

  public markWordLearned(word: string): void {
    void learningProgressService.markWordLearned(word);
  }

  public markHanziMastered(char: string): void {
    void learningProgressService.markHanziMastered(char);
  }

  public addStudyMinutes(minutes: number, activity: 'listening' | 'speaking' | 'writing' | 'general' = 'general'): void {
    void learningProgressService.addStudyMinutes(minutes, activity);
  }

  public toggleBookmark(entityId: string, entityType: string = 'bookmark'): Promise<boolean> {
    return learningProgressService.toggleBookmark(entityId, entityType);
  }

  public isBookmarked(entityId: string): boolean {
    return learningProgressService.isBookmarked(entityId);
  }

  public subscribe(listener: (stats: LearnerProgressStats) => void): () => void {
    return learningProgressService.subscribe((snapshot) => {
      listener(this.mapSnapshotToStats(snapshot));
    });
  }
}

export const progressRepository = new ProgressRepository();
