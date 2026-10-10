/**
 * React hook for consuming authoritative Learning Progress & Journey data
 * Real-time reactive updates across all components, tabs, and devices.
 */

import { useState, useEffect } from 'react';
import {
  learningProgressService,
  LearningProgressSnapshot,
} from './learningProgressService.ts';

export function useLearningProgress(): {
  progress: LearningProgressSnapshot;
  markLessonComplete: (level: number, lessonNumber: number, score?: number) => Promise<void>;
  markWordLearned: (word: string) => Promise<void>;
  markHanziMastered: (char: string) => Promise<void>;
  recordExerciseCompleted: (params: {
    type: 'listening' | 'speaking' | 'grammar' | 'reading';
    entityId: string;
    score?: number;
    durationMinutes?: number;
  }) => Promise<void>;
  toggleBookmark: (entityId: string, entityType?: string) => Promise<boolean>;
  isBookmarked: (entityId: string) => boolean;
  addStudyMinutes: (minutes: number, activity?: string) => Promise<void>;
  updateProfile: (updates: {
    displayName?: string;
    schoolEmail?: string;
    targetHskLevel?: number;
    dailyGoalMinutes?: number;
    avatar?: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [progress, setProgress] = useState<LearningProgressSnapshot>(() =>
    learningProgressService.getSnapshot()
  );

  useEffect(() => {
    const unsub = learningProgressService.subscribe((newSnapshot) => {
      setProgress(newSnapshot);
    });
    return () => unsub();
  }, []);

  return {
    progress,
    markLessonComplete: (lvl, num, score) => learningProgressService.markLessonComplete(lvl, num, score),
    markWordLearned: (w) => learningProgressService.markWordLearned(w),
    markHanziMastered: (c) => learningProgressService.markHanziMastered(c),
    recordExerciseCompleted: (p) => learningProgressService.recordExerciseCompleted(p),
    toggleBookmark: (id, t) => learningProgressService.toggleBookmark(id, t),
    isBookmarked: (id) => learningProgressService.isBookmarked(id),
    addStudyMinutes: (m, a) => learningProgressService.addStudyMinutes(m, a),
    updateProfile: (u) => learningProgressService.updateProfile(u),
    refresh: () => learningProgressService.syncWithServer(),
  };
}
