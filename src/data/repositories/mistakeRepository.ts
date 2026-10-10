/**
 * YUYAN Mistake Book Repository (Sổ tay câu sai)
 * Tracks actual user mistakes across quizzes, practices, and exams.
 * Allows retry, review, and resolution upon mastery.
 */

import { getSupabaseClient, getLearnerSessionId } from '../../services/supabase/client';

export interface LearnerMistake {
  id: string;
  category: 'vocabulary' | 'hanzi' | 'grammar' | 'listening' | 'reading' | 'speaking' | 'writing' | 'exam';
  prompt: string;
  contextText?: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  lessonKey?: string;
  word?: string;
  character?: string;
  timestamp: number;
  reviewCount: number;
  resolved: boolean;
}

const STORAGE_KEY = 'yuyan_mistakes_v1';

export class MistakeRepository {
  private mistakes: LearnerMistake[] = [];
  private listeners: Set<(mistakes: LearnerMistake[]) => void> = new Set();

  constructor() {
    this.mistakes = this.loadMistakes();
  }

  public getAll(): LearnerMistake[] {
    return [...this.mistakes];
  }

  public getUnresolved(): LearnerMistake[] {
    return this.mistakes.filter((m) => !m.resolved);
  }

  public getByCategory(category: LearnerMistake['category']): LearnerMistake[] {
    return this.mistakes.filter((m) => m.category === category && !m.resolved);
  }

  public addMistake(entry: Omit<LearnerMistake, 'id' | 'timestamp' | 'reviewCount' | 'resolved'>): LearnerMistake {
    // Avoid exact duplicates within the same day
    const existing = this.mistakes.find(
      (m) => m.prompt === entry.prompt && m.correctAnswer === entry.correctAnswer && !m.resolved
    );

    if (existing) {
      existing.reviewCount++;
      existing.userAnswer = entry.userAnswer;
      existing.timestamp = Date.now();
      this.saveMistakes();
      this.notify();
      return existing;
    }

    const newMistake: LearnerMistake = {
      ...entry,
      id: `mistake_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      reviewCount: 1,
      resolved: false,
    };

    this.mistakes.unshift(newMistake);
    this.saveMistakes();
    this.notify();

    // Sync to Supabase in background
    const supabase = getSupabaseClient();
    if (supabase) {
      void (async () => {
        try {
          await supabase.from('learner_mistakes').upsert({
            id: newMistake.id,
            user_id: getLearnerSessionId(),
            category: newMistake.category,
            prompt: newMistake.prompt,
            selected_answer: newMistake.userAnswer,
            correct_answer: newMistake.correctAnswer,
            explanation: newMistake.explanation,
            resolved: false,
          });
        } catch (err) {
          console.warn('Failed to sync mistake to Supabase:', err);
        }
      })();
    }

    return newMistake;
  }

  public resolveMistake(id: string): void {
    const item = this.mistakes.find((m) => m.id === id);
    if (item) {
      item.resolved = true;
      this.saveMistakes();
      this.notify();

      const supabase = getSupabaseClient();
      if (supabase) {
        void (async () => {
          try {
            await supabase
              .from('learner_mistakes')
              .update({ resolved: true })
              .eq('id', id);
          } catch {
            // Offline resilience
          }
        })();
      }
    }
  }

  public clearResolved(): void {
    this.mistakes = this.mistakes.filter((m) => !m.resolved);
    this.saveMistakes();
    this.notify();
  }

  public subscribe(listener: (mistakes: LearnerMistake[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAll());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private loadMistakes(): LearnerMistake[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Recovered corrupted mistake book:', e);
      localStorage.removeItem(STORAGE_KEY);
    }
    return [];
  }

  private saveMistakes(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.mistakes));
    } catch (e) {
      console.error('Failed to save mistakes:', e);
    }
  }

  private notify(): void {
    const current = this.getAll();
    for (const l of this.listeners) {
      try {
        l(current);
      } catch (err) {
        console.error('Error in MistakeRepository listener:', err);
      }
    }
  }
}

export const mistakeRepository = new MistakeRepository();
