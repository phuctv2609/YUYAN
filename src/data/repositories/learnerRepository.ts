/**
 * YUYAN Student Profile Repository
 * Single Source of Truth for student profile, goals, study streak, and preferences.
 * Safe fallback against corrupted localStorage schemas.
 */

export interface StudentProfile {
  id: string;
  displayName: string;
  /** Backward compatibility alias for displayName */
  name?: string;
  schoolEmail: string;
  avatar?: string;
  targetHskLevel: number;
  dailyGoalMinutes: number;
  studyStreakDays: number;
  levelAssessment: string;
  createdAt: string;
  updatedAt: string;
  lastStudiedLesson?: {
    level: number;
    lessonNumber: number;
    timestamp: number;
  };
}

export type LearnerProfile = StudentProfile;

const STORAGE_KEY = 'yuyan_learner_profile_v2';
const LEGACY_STORAGE_KEY = 'yuyan_learner_profile_v1';

const DEFAULT_PROFILE: StudentProfile = {
  id: 'yuyan_std_001',
  displayName: 'Minh Anh',
  name: 'Minh Anh',
  schoolEmail: 'minhanh@yuyan.edu.vn',
  targetHskLevel: 2,
  dailyGoalMinutes: 30,
  studyStreakDays: 320,
  levelAssessment: 'Sơ cấp (HSK 2)',
  createdAt: '2025-11-15T08:00:00.000Z',
  updatedAt: new Date().toISOString(),
  lastStudiedLesson: {
    level: 1,
    lessonNumber: 1,
    timestamp: Date.now(),
  },
};

export interface ProfileValidationResult {
  isValid: boolean;
  errors: {
    displayName?: string;
    schoolEmail?: string;
    dailyGoalMinutes?: string;
  };
}

export function validateStudentProfile(data: {
  displayName?: string;
  schoolEmail?: string;
  dailyGoalMinutes?: number;
}): ProfileValidationResult {
  const errors: ProfileValidationResult['errors'] = {};

  if (!data.displayName || data.displayName.trim().length === 0) {
    errors.displayName = 'Tên hiển thị không được để trống';
  } else if (data.displayName.trim().length < 2) {
    errors.displayName = 'Tên hiển thị phải có ít nhất 2 ký tự';
  }

  if (!data.schoolEmail || data.schoolEmail.trim().length === 0) {
    errors.schoolEmail = 'Email không được để trống';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.schoolEmail.trim())) {
      errors.schoolEmail = 'Email không đúng định dạng hợp lệ (vd: ten@example.com)';
    }
  }

  if (data.dailyGoalMinutes !== undefined && (data.dailyGoalMinutes < 5 || data.dailyGoalMinutes > 300)) {
    errors.dailyGoalMinutes = 'Mục tiêu học tập hàng ngày từ 5 đến 300 phút';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export class LearnerRepository {
  private profile: StudentProfile;
  private listeners: Set<(profile: StudentProfile) => void> = new Set();

  constructor() {
    this.profile = this.loadProfile();
  }

  public getProfile(): StudentProfile {
    return { ...this.profile };
  }

  public updateProfile(updates: Partial<StudentProfile>): StudentProfile {
    const displayName = updates.displayName?.trim() || updates.name?.trim() || this.profile.displayName;
    const schoolEmail = updates.schoolEmail?.trim() || this.profile.schoolEmail;

    this.profile = {
      ...this.profile,
      ...updates,
      displayName,
      name: displayName,
      schoolEmail,
      updatedAt: new Date().toISOString(),
    };
    this.saveProfile();
    this.notify();
    return this.getProfile();
  }

  public subscribe(listener: (profile: StudentProfile) => void): () => void {
    this.listeners.add(listener);
    listener(this.getProfile());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private loadProfile(): StudentProfile {
    if (typeof window === 'undefined') return DEFAULT_PROFILE;
    try {
      const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        const displayName = parsed.displayName?.trim() || parsed.name?.trim() || DEFAULT_PROFILE.displayName;
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          id: parsed.id || DEFAULT_PROFILE.id,
          displayName,
          name: displayName,
          schoolEmail: parsed.schoolEmail?.trim() || DEFAULT_PROFILE.schoolEmail,
          studyStreakDays: typeof parsed.studyStreakDays === 'number' ? parsed.studyStreakDays : DEFAULT_PROFILE.studyStreakDays,
          targetHskLevel: typeof parsed.targetHskLevel === 'number' ? parsed.targetHskLevel : DEFAULT_PROFILE.targetHskLevel,
        };
      }
    } catch (e) {
      console.warn('Recovering corrupted student profile gracefully:', e);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    return DEFAULT_PROFILE;
  }

  private saveProfile(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch (e) {
      console.error('Failed to persist student profile:', e);
    }
  }

  private notify(): void {
    const current = this.getProfile();
    for (const l of this.listeners) {
      try {
        l(current);
      } catch (err) {
        console.error('Error in StudentProfile listener:', err);
      }
    }
  }
}

export const learnerRepository = new LearnerRepository();
