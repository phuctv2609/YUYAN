/**
 * YUYAN Student Profile Repository
 * Single Source of Truth for student profile, goals, study streak, and preferences.
 * Safe fallback against corrupted localStorage schemas.
 */

import { getSupabaseClient, getLearnerSessionId } from '../../services/supabase/client.ts';

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

export const PRESET_AVATARS = [
  { id: 'none', label: 'Viết tắt (Tên)', url: '' },
  { id: 'avatar_panda', label: 'Gấu Trúc', url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=128&auto=format&fit=crop&q=80' },
  { id: 'avatar_scholar', label: 'Học Giả', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80' },
  { id: 'avatar_student', label: 'Du Học Sinh', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=128&auto=format&fit=crop&q=80' },
];

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
  } else if (data.displayName.trim().length > 60) {
    errors.displayName = 'Tên hiển thị không được vượt quá 60 ký tự';
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

  /**
   * Asynchronously updates the student profile, syncing to local storage,
   * Supabase `learner_profiles` table, and Supabase Auth if session exists.
   */
  public async updateProfileAsync(updates: Partial<StudentProfile>): Promise<{
    success: boolean;
    profile: StudentProfile;
    error?: string;
    emailConfirmationPending?: boolean;
  }> {
    const validation = validateStudentProfile({
      displayName: updates.displayName,
      schoolEmail: updates.schoolEmail,
      dailyGoalMinutes: updates.dailyGoalMinutes,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || 'Thông tin hồ sơ không hợp lệ';
      return {
        success: false,
        profile: this.getProfile(),
        error: firstError,
      };
    }

    // 1. Immediately update in-memory and local storage for instant reactive UI
    const updated = this.updateProfile(updates);
    let emailConfirmationPending = false;

    // 2. Synchronize to Supabase (Database + Auth)
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        // A. Check for authenticated user in Supabase Auth
        try {
          const { data: authUserRes } = await supabase.auth.getUser();
          const user = authUserRes?.user;
          if (user) {
            const authPayload: { data?: { display_name?: string; full_name?: string }; email?: string } = {};
            if (updates.displayName) {
              authPayload.data = {
                display_name: updated.displayName,
                full_name: updated.displayName,
              };
            }
            if (updates.schoolEmail && updates.schoolEmail.toLowerCase() !== user.email?.toLowerCase()) {
              authPayload.email = updates.schoolEmail;
            }

            if (Object.keys(authPayload).length > 0) {
              const { data: updateAuthRes, error: updateAuthErr } = await supabase.auth.updateUser(authPayload);
              if (updateAuthErr) {
                console.warn('Supabase Auth update notice:', updateAuthErr.message);
              } else if (updateAuthRes?.user?.new_email) {
                emailConfirmationPending = true;
              }
            }
          }
        } catch (authErr) {
          console.warn('Supabase Auth sync check skipped (non-fatal):', authErr);
        }

        // B. Upsert into learner_profiles table
        const profileId = updated.id || getLearnerSessionId();
        await supabase.from('learner_profiles').upsert({
          id: profileId,
          display_name: updated.displayName,
          daily_goal_minutes: updated.dailyGoalMinutes,
          target_hsk_level: updated.targetHskLevel,
          streak_days: updated.studyStreakDays,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn('Supabase profile persistence notice (offline-resilient):', dbErr);
    }

    return {
      success: true,
      profile: updated,
      emailConfirmationPending,
    };
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
