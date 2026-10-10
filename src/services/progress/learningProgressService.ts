/**
 * YUYAN — Authoritative Real-Time Learning Progress & Journey Service
 * Unified Single Source of Truth across all HSK levels, modules, devices, and tabs.
 * Backed by Supabase PostgreSQL with local caching, BroadcastChannel, and Supabase Realtime.
 */

import { getSupabaseClient, getLearnerSessionId } from '../supabase/client.ts';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface LevelProgressStat {
  level: number;
  total: number;
  completed: number;
  percent: number;
  color: string;
}

export interface LearningProgressSnapshot {
  userId: string;
  displayName: string;
  schoolEmail: string;
  avatar: string;
  targetHskLevel: number;
  dailyGoalMinutes: number;
  // Journey telemetry
  journeyStartDate: string | null; // YYYY-MM-DD
  journeyDay: number; // 0 if not started, 1 on start date, 2 next day, etc.
  currentStreak: number; // Consecutive active calendar days
  longestStreak: number; // Historical max streak
  totalActiveDays: number; // Distinct active calendar dates
  dailyMinutesStudied: number; // Minutes studied today
  totalStudyMinutes: number; // Aggregated minutes
  lastStudyDate: string | null; // YYYY-MM-DD
  // Learning items
  completedLessons: string[]; // e.g. ["hsk1-bai01", "hsk1-bai02"]
  inProgressLessons: string[];
  learnedWords: string[]; // Chinese vocabulary words mastered
  learnedHanzi: string[]; // Characters mastered
  bookmarkedIds: string[]; // Bookmarked sentences, words, etc.
  // Aggregated progress
  levelStats: LevelProgressStat[];
  totalCompletedLessons: number;
  totalLessons: number;
  overallPercent: number;
  lastStudiedLesson: {
    level: number;
    lessonNumber: number;
    timestamp: number;
  } | null;
  recentActivityDates: string[]; // Recent active calendar dates (YYYY-MM-DD)
  isLoading: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;
}

const STORAGE_KEY = 'yuyan_unified_progress_v2';
const BROADCAST_CHANNEL_NAME = 'yuyan_progress_sync_v2';

const LEVEL_COLORS: Record<number, string> = {
  1: '#FF758F',
  2: '#F5A623',
  3: '#4A90E2',
  4: '#50B5FF',
  5: '#845EC2',
  6: '#B042C9',
};

// Date Math Utilities
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPreviousDayString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calendarDaysBetween(fromDateStr: string, toDateStr: string): number {
  const [y1, m1, d1] = fromDateStr.split('-').map(Number);
  const [y2, m2, d2] = toDateStr.split('-').map(Number);
  const dFrom = new Date(y1, m1 - 1, d1);
  const dTo = new Date(y2, m2 - 1, d2);
  const ms = dTo.getTime() - dFrom.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function calculateJourneyDay(journeyStartDateStr: string | null | undefined): number {
  if (!journeyStartDateStr) return 0;
  const today = getTodayDateString();
  const diff = calendarDaysBetween(journeyStartDateStr, today);
  if (diff < 0) return 1;
  return diff + 1; // Start date is Day 1
}

export function calculateStreakTelemetry(activeDates: string[]): {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
} {
  const uniqueDates = Array.from(new Set(activeDates.filter(Boolean))).sort();
  const totalActiveDays = uniqueDates.length;
  if (totalActiveDays === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  }

  const today = getTodayDateString();
  const yesterday = getPreviousDayString(today);
  const dateSet = new Set(uniqueDates);

  // 1. Current Streak
  let currentStreak = 0;
  let checkDate: string | null = null;

  if (dateSet.has(today)) {
    checkDate = today;
  } else if (dateSet.has(yesterday)) {
    checkDate = yesterday;
  }

  if (checkDate) {
    let curr = checkDate;
    while (dateSet.has(curr)) {
      currentStreak++;
      curr = getPreviousDayString(curr);
    }
  }

  // 2. Longest Streak
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: string | null = null;

  for (const date of uniqueDates) {
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diff = calendarDaysBetween(lastDate, date);
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        tempStreak = 1;
      }
    }
    lastDate = date;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return { currentStreak, longestStreak, totalActiveDays };
}

class LearningProgressService {
  private snapshot: LearningProgressSnapshot;
  private listeners: Set<(snapshot: LearningProgressSnapshot) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private realtimeChannel: RealtimeChannel | null = null;

  constructor() {
    this.snapshot = this.loadLocalSnapshot();
    this.initBroadcastChannel();
    this.initNetworkListeners();
    // Non-blocking server synchronization
    void this.syncWithServer();
  }

  public getSnapshot(): LearningProgressSnapshot {
    return { ...this.snapshot };
  }

  public subscribe(listener: (snapshot: LearningProgressSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Returns authenticated user ID or persistent learner session UUID
   */
  public async getEffectiveUserId(): Promise<string> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          return data.user.id;
        }
      } catch {
        // Fallback to session UUID
      }
    }
    return getLearnerSessionId();
  }

  // --------------------------------------------------------------------------
  // CORE RECORDING ACTIONS
  // --------------------------------------------------------------------------

  /**
   * Registers a qualifying learning activity, ensuring journey start date is initialized
   * and updating streak and total active study days.
   */
  public async recordQualifyingActivity(params: {
    activityType: 'lesson_quiz' | 'vocab_review' | 'sentence_ordering' | 'writing_stroke' | 'listening_practice' | 'speaking_practice' | 'reading_pass' | 'exam_attempt';
    entityId?: string;
    score?: number;
    durationSeconds?: number;
  }): Promise<void> {
    const today = getTodayDateString();
    const effectiveUserId = await this.getEffectiveUserId();

    // 1. Initialize journeyStartDate if this is the first meaningful activity
    let journeyStartDate = this.snapshot.journeyStartDate;
    if (!journeyStartDate) {
      journeyStartDate = today;
    }

    // 2. Add activity date to recent activity dates
    const activityDates = Array.from(new Set([...this.snapshot.recentActivityDates, today]));
    const { currentStreak, longestStreak, totalActiveDays } = calculateStreakTelemetry(activityDates);
    const journeyDay = calculateJourneyDay(journeyStartDate);

    // 3. Update study duration
    const minutesToAdd = Math.max(1, Math.round((params.durationSeconds || 60) / 60));
    const dailyMinutes = this.snapshot.lastStudyDate === today
      ? this.snapshot.dailyMinutesStudied + minutesToAdd
      : minutesToAdd;
    const totalMinutes = this.snapshot.totalStudyMinutes + minutesToAdd;

    // 4. Mutate in-memory snapshot immediately
    this.updateSnapshotLocally({
      journeyStartDate,
      journeyDay,
      currentStreak,
      longestStreak,
      totalActiveDays,
      dailyMinutesStudied: dailyMinutes,
      totalStudyMinutes: totalMinutes,
      lastStudyDate: today,
      recentActivityDates: activityDates,
    });

    // 5. Persist to Supabase in background
    void (async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        // A. Insert into study_activity_logs
        await (supabase as any).from('study_activity_logs').insert({
          user_id: effectiveUserId,
          activity_type: params.activityType,
          entity_id: params.entityId || null,
          score: params.score !== undefined ? params.score : null,
          duration_seconds: params.durationSeconds || 60,
          activity_date: today,
        });

        // B. Update learner_profiles
        await (supabase as any).from('learner_profiles').upsert({
          id: effectiveUserId,
          display_name: this.snapshot.displayName,
          journey_start_date: journeyStartDate,
          streak_days: currentStreak,
          longest_streak: longestStreak,
          total_active_days: totalActiveDays,
          last_study_date: today,
          total_study_minutes: totalMinutes,
          target_hsk_level: this.snapshot.targetHskLevel,
          daily_goal_minutes: this.snapshot.dailyGoalMinutes,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to sync qualifying activity to Supabase:', err);
      }
    })();
  }

  /**
   * Confirms lesson completion and recalculates level & overall progress
   */
  public async markLessonComplete(level: number, lessonNumber: number, score: number = 100): Promise<void> {
    const lessonKey = `hsk${level}-bai${String(lessonNumber).padStart(2, '0')}`;
    const effectiveUserId = await this.getEffectiveUserId();

    // Avoid duplicate completion work if already completed
    const wasAlreadyCompleted = this.snapshot.completedLessons.includes(lessonKey);
    const completedLessons = wasAlreadyCompleted
      ? this.snapshot.completedLessons
      : [...this.snapshot.completedLessons, lessonKey];

    const inProgressLessons = this.snapshot.inProgressLessons.filter((k) => k !== lessonKey);
    const levelStats = this.computeLevelStats(completedLessons);
    const totalCompletedLessons = completedLessons.length;
    const totalLessons = 146;
    const overallPercent = Math.round((totalCompletedLessons / totalLessons) * 100);

    const lastStudiedLesson = {
      level,
      lessonNumber,
      timestamp: Date.now(),
    };

    // Update locally
    this.updateSnapshotLocally({
      completedLessons,
      inProgressLessons,
      levelStats,
      totalCompletedLessons,
      totalLessons,
      overallPercent,
      lastStudiedLesson,
    });

    // Record qualifying learning activity
    await this.recordQualifyingActivity({
      activityType: 'lesson_quiz',
      entityId: lessonKey,
      score,
      durationSeconds: 180,
    });

    // Sync learner_progress record
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await (supabase as any).from('learner_progress').upsert({
          id: `progress_${effectiveUserId}_${lessonKey}`,
          user_id: effectiveUserId,
          entity_type: 'lesson',
          entity_id: lessonKey,
          status: 'completed',
          score,
          review_count: 1,
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Failed to sync lesson completion to Supabase:', err);
      }
    }
  }

  /**
   * Records word learned
   */
  public async markWordLearned(word: string): Promise<void> {
    if (!word || this.snapshot.learnedWords.includes(word)) return;
    const learnedWords = [...this.snapshot.learnedWords, word];
    const effectiveUserId = await this.getEffectiveUserId();

    this.updateSnapshotLocally({ learnedWords });

    await this.recordQualifyingActivity({
      activityType: 'vocab_review',
      entityId: word,
      durationSeconds: 45,
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await (supabase as any).from('learner_progress').upsert({
          id: `progress_${effectiveUserId}_vocab_${word}`,
          user_id: effectiveUserId,
          entity_type: 'vocab',
          entity_id: word,
          status: 'completed',
          review_count: 1,
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Failed to sync word learned to Supabase:', err);
      }
    }
  }

  /**
   * Records character mastered from Hanzi stroke writing
   */
  public async markHanziMastered(char: string): Promise<void> {
    if (!char || this.snapshot.learnedHanzi.includes(char)) return;
    const learnedHanzi = [...this.snapshot.learnedHanzi, char];
    const effectiveUserId = await this.getEffectiveUserId();

    this.updateSnapshotLocally({ learnedHanzi });

    await this.recordQualifyingActivity({
      activityType: 'writing_stroke',
      entityId: char,
      durationSeconds: 60,
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await (supabase as any).from('learner_progress').upsert({
          id: `progress_${effectiveUserId}_hanzi_${char}`,
          user_id: effectiveUserId,
          entity_type: 'hanzi',
          entity_id: char,
          status: 'mastered',
          review_count: 1,
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Failed to sync hanzi mastered to Supabase:', err);
      }
    }
  }

  /**
   * Records completed exercise for listening, speaking, sentence ordering, or reading
   */
  public async recordExerciseCompleted(params: {
    type: 'listening' | 'speaking' | 'grammar' | 'reading';
    entityId: string;
    score?: number;
    durationMinutes?: number;
  }): Promise<void> {
    const effectiveUserId = await this.getEffectiveUserId();
    const durationSeconds = Math.max(30, (params.durationMinutes || 1) * 60);

    const activityMap: Record<string, 'listening_practice' | 'speaking_practice' | 'sentence_ordering' | 'reading_pass'> = {
      listening: 'listening_practice',
      speaking: 'speaking_practice',
      grammar: 'sentence_ordering',
      reading: 'reading_pass',
    };

    await this.recordQualifyingActivity({
      activityType: activityMap[params.type] || 'sentence_ordering',
      entityId: params.entityId,
      score: params.score,
      durationSeconds,
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await (supabase as any).from('learner_progress').upsert({
          id: `progress_${effectiveUserId}_${params.type}_${params.entityId}`,
          user_id: effectiveUserId,
          entity_type: params.type,
          entity_id: params.entityId,
          status: 'completed',
          score: params.score !== undefined ? params.score : null,
          review_count: 1,
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Failed to sync exercise progress to Supabase:', err);
      }
    }
  }

  /**
   * Toggles bookmark / favorite on sentences, vocabulary, or terms
   */
  public async toggleBookmark(entityId: string, entityType: string = 'bookmark'): Promise<boolean> {
    const set = new Set(this.snapshot.bookmarkedIds);
    let isBookmarked = false;
    if (set.has(entityId)) {
      set.delete(entityId);
      isBookmarked = false;
    } else {
      set.add(entityId);
      isBookmarked = true;
    }

    const bookmarkedIds = Array.from(set);
    this.updateSnapshotLocally({ bookmarkedIds });

    const effectiveUserId = await this.getEffectiveUserId();
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        if (isBookmarked) {
          await (supabase as any).from('learner_progress').upsert({
            id: `progress_${effectiveUserId}_bm_${entityId}`,
            user_id: effectiveUserId,
            entity_type: entityType,
            entity_id: entityId,
            status: 'bookmarked',
            last_reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        } else {
          await (supabase as any).from('learner_progress').delete()
            .eq('id', `progress_${effectiveUserId}_bm_${entityId}`);
        }
      } catch (err) {
        console.warn('Failed to sync bookmark to Supabase:', err);
      }
    }

    return isBookmarked;
  }

  public isBookmarked(entityId: string): boolean {
    return this.snapshot.bookmarkedIds.includes(entityId);
  }

  /**
   * Adds study duration minutes
   */
  public async addStudyMinutes(minutes: number, activity: string = 'general'): Promise<void> {
    if (minutes <= 0) return;
    await this.recordQualifyingActivity({
      activityType: activity === 'listening' ? 'listening_practice' : activity === 'speaking' ? 'speaking_practice' : 'sentence_ordering',
      durationSeconds: minutes * 60,
    });
  }

  /**
   * Updates student profile fields without altering journey or streak calculations
   */
  public async updateProfile(updates: {
    displayName?: string;
    schoolEmail?: string;
    targetHskLevel?: number;
    dailyGoalMinutes?: number;
    avatar?: string;
  }): Promise<void> {
    const effectiveUserId = await this.getEffectiveUserId();
    const nextDisplayName = updates.displayName?.trim() || this.snapshot.displayName;
    const nextSchoolEmail = updates.schoolEmail?.trim() || this.snapshot.schoolEmail;
    const nextTargetLevel = updates.targetHskLevel || this.snapshot.targetHskLevel;
    const nextDailyGoal = updates.dailyGoalMinutes || this.snapshot.dailyGoalMinutes;
    const nextAvatar = updates.avatar !== undefined ? updates.avatar : this.snapshot.avatar;

    this.updateSnapshotLocally({
      displayName: nextDisplayName,
      schoolEmail: nextSchoolEmail,
      targetHskLevel: nextTargetLevel,
      dailyGoalMinutes: nextDailyGoal,
      avatar: nextAvatar,
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await (supabase as any).from('learner_profiles').upsert({
          id: effectiveUserId,
          display_name: nextDisplayName,
          school_email: nextSchoolEmail,
          target_hsk_level: nextTargetLevel,
          daily_goal_minutes: nextDailyGoal,
          avatar_url: nextAvatar,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to sync updated profile to Supabase:', err);
      }
    }
  }

  // --------------------------------------------------------------------------
  // SERVER RECONCILIATION & SUPABASE REALTIME
  // --------------------------------------------------------------------------

  public async syncWithServer(): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      this.updateSnapshotLocally({ isLoading: false, isOnline: false });
      return;
    }

    try {
      const effectiveUserId = await this.getEffectiveUserId();

      // 1. Fetch learner_profiles
      const { data: profileData } = await (supabase as any)
        .from('learner_profiles')
        .select('*')
        .eq('id', effectiveUserId)
        .single();

      // 2. Fetch study_activity_logs (to compute true streak, longest streak, and total active days)
      const { data: activityLogs } = await (supabase as any)
        .from('study_activity_logs')
        .select('activity_date')
        .eq('user_id', effectiveUserId)
        .order('activity_date', { ascending: false });

      const activityDates: string[] = (activityLogs || []).map((l: any) => l.activity_date);
      const { currentStreak, longestStreak, totalActiveDays } = calculateStreakTelemetry(activityDates);

      // 3. Fetch learner_progress (lessons, vocab, bookmarks)
      const { data: progressRows } = await (supabase as any)
        .from('learner_progress')
        .select('*')
        .eq('user_id', effectiveUserId);

      const completedLessons: string[] = [];
      const inProgressLessons: string[] = [];
      const learnedWords: string[] = [];
      const learnedHanzi: string[] = [];
      const bookmarkedIds: string[] = [];

      for (const row of progressRows || []) {
        if (row.entity_type === 'lesson') {
          if (row.status === 'completed') completedLessons.push(row.entity_id);
          else if (row.status === 'in_progress') inProgressLessons.push(row.entity_id);
        } else if (row.entity_type === 'vocab' && (row.status === 'completed' || row.status === 'mastered')) {
          learnedWords.push(row.entity_id);
        } else if (row.entity_type === 'hanzi' && (row.status === 'completed' || row.status === 'mastered')) {
          learnedHanzi.push(row.entity_id);
        } else if (row.entity_type === 'bookmark' && row.status === 'bookmarked') {
          bookmarkedIds.push(row.entity_id);
        }
      }

      // 4. Merge server & local completedLessons (union to prevent data loss)
      const mergedCompletedLessons = Array.from(new Set([
        ...this.snapshot.completedLessons,
        ...completedLessons,
      ]));

      const levelStats = this.computeLevelStats(mergedCompletedLessons);
      const totalCompletedLessons = mergedCompletedLessons.length;
      const totalLessons = 146;
      const overallPercent = Math.round((totalCompletedLessons / totalLessons) * 100);

      // 5. Journey start date reconciliation
      const journeyStartDate = profileData?.journey_start_date || this.snapshot.journeyStartDate || null;
      const journeyDay = calculateJourneyDay(journeyStartDate);

      // 6. Update snapshot
      this.updateSnapshotLocally({
        userId: effectiveUserId,
        displayName: profileData?.display_name || this.snapshot.displayName,
        schoolEmail: profileData?.school_email || this.snapshot.schoolEmail,
        targetHskLevel: profileData?.target_hsk_level || this.snapshot.targetHskLevel,
        dailyGoalMinutes: profileData?.daily_goal_minutes || this.snapshot.dailyGoalMinutes,
        avatar: profileData?.avatar_url || this.snapshot.avatar,
        journeyStartDate,
        journeyDay,
        currentStreak: Math.max(currentStreak, profileData?.streak_days || 0),
        longestStreak: Math.max(longestStreak, profileData?.longest_streak || 0),
        totalActiveDays: Math.max(totalActiveDays, profileData?.total_active_days || 0),
        lastStudyDate: profileData?.last_study_date || this.snapshot.lastStudyDate,
        totalStudyMinutes: profileData?.total_study_minutes || this.snapshot.totalStudyMinutes,
        completedLessons: mergedCompletedLessons,
        inProgressLessons,
        learnedWords: Array.from(new Set([...this.snapshot.learnedWords, ...learnedWords])),
        learnedHanzi: Array.from(new Set([...this.snapshot.learnedHanzi, ...learnedHanzi])),
        bookmarkedIds: Array.from(new Set([...this.snapshot.bookmarkedIds, ...bookmarkedIds])),
        levelStats,
        totalCompletedLessons,
        totalLessons,
        overallPercent,
        recentActivityDates: activityDates,
        isLoading: false,
        isOnline: true,
        lastSyncedAt: new Date().toISOString(),
      });

      // 7. Subscribe to Supabase Realtime channel
      this.setupRealtimeSubscription(effectiveUserId);
    } catch (err) {
      console.warn('Server sync notice (offline fallback active):', err);
      this.updateSnapshotLocally({ isLoading: false, isOnline: false });
    }
  }

  private setupRealtimeSubscription(userId: string): void {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (this.realtimeChannel) {
      void supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    try {
      this.realtimeChannel = supabase
        .channel(`realtime:learning_progress:${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'learner_profiles', filter: `id=eq.${userId}` },
          (payload) => {
            if (payload.new && typeof payload.new === 'object') {
              const row: any = payload.new;
              const journeyStartDate = row.journey_start_date || this.snapshot.journeyStartDate;
              this.updateSnapshotLocally({
                displayName: row.display_name || this.snapshot.displayName,
                targetHskLevel: row.target_hsk_level || this.snapshot.targetHskLevel,
                dailyGoalMinutes: row.daily_goal_minutes || this.snapshot.dailyGoalMinutes,
                journeyStartDate,
                journeyDay: calculateJourneyDay(journeyStartDate),
                currentStreak: row.streak_days !== undefined ? row.streak_days : this.snapshot.currentStreak,
                longestStreak: row.longest_streak !== undefined ? row.longest_streak : this.snapshot.longestStreak,
                totalActiveDays: row.total_active_days !== undefined ? row.total_active_days : this.snapshot.totalActiveDays,
                totalStudyMinutes: row.total_study_minutes !== undefined ? row.total_study_minutes : this.snapshot.totalStudyMinutes,
                avatar: row.avatar_url || this.snapshot.avatar,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'learner_progress', filter: `user_id=eq.${userId}` },
          (payload) => {
            const row: any = payload.new;
            if (!row) return;

            if (row.entity_type === 'lesson' && row.status === 'completed') {
              if (!this.snapshot.completedLessons.includes(row.entity_id)) {
                const completedLessons = [...this.snapshot.completedLessons, row.entity_id];
                const levelStats = this.computeLevelStats(completedLessons);
                this.updateSnapshotLocally({
                  completedLessons,
                  levelStats,
                  totalCompletedLessons: completedLessons.length,
                  overallPercent: Math.round((completedLessons.length / 146) * 100),
                });
              }
            } else if (row.entity_type === 'vocab') {
              if (!this.snapshot.learnedWords.includes(row.entity_id)) {
                this.updateSnapshotLocally({
                  learnedWords: [...this.snapshot.learnedWords, row.entity_id],
                });
              }
            } else if (row.entity_type === 'hanzi') {
              if (!this.snapshot.learnedHanzi.includes(row.entity_id)) {
                this.updateSnapshotLocally({
                  learnedHanzi: [...this.snapshot.learnedHanzi, row.entity_id],
                });
              }
            } else if (row.entity_type === 'bookmark') {
              const set = new Set(this.snapshot.bookmarkedIds);
              if (row.status === 'bookmarked') set.add(row.entity_id);
              else set.delete(row.entity_id);
              this.updateSnapshotLocally({
                bookmarkedIds: Array.from(set),
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.updateSnapshotLocally({ isOnline: true });
          } else if (status === 'CHANNEL_ERROR') {
            this.updateSnapshotLocally({ isOnline: false });
          }
        });
    } catch (err) {
      console.warn('Realtime subscription skipped:', err);
    }
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS & CACHE
  // --------------------------------------------------------------------------

  private computeLevelStats(completedLessonKeys: string[]): LevelProgressStat[] {
    const levelCounts: Record<number, number> = { 1: 15, 2: 15, 3: 20, 4: 20, 5: 36, 6: 40 };
    const completedByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    for (const key of completedLessonKeys) {
      const match = key.match(/hsk([1-6])/i);
      if (match) {
        const lvl = parseInt(match[1], 10);
        if (completedByLevel[lvl] !== undefined) {
          completedByLevel[lvl]++;
        }
      }
    }

    const stats: LevelProgressStat[] = [];
    for (let lvl = 1; lvl <= 6; lvl++) {
      const total = levelCounts[lvl];
      const completed = Math.min(total, completedByLevel[lvl]);
      const percent = Math.round((completed / total) * 100);
      stats.push({
        level: lvl,
        total,
        completed,
        percent,
        color: LEVEL_COLORS[lvl] || '#4A90E2',
      });
    }
    return stats;
  }

  private loadLocalSnapshot(): LearningProgressSnapshot {
    const totalLessons = 146;
    const initialCompleted: string[] = [];
    const levelStats = this.computeLevelStats(initialCompleted);

    const defaultState: LearningProgressSnapshot = {
      userId: getLearnerSessionId(),
      displayName: 'Minh Anh',
      schoolEmail: 'minhanh@yuyan.edu.vn',
      avatar: '',
      targetHskLevel: 2,
      dailyGoalMinutes: 30,
      journeyStartDate: null,
      journeyDay: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      dailyMinutesStudied: 0,
      totalStudyMinutes: 0,
      lastStudyDate: null,
      completedLessons: initialCompleted,
      inProgressLessons: [],
      learnedWords: [],
      learnedHanzi: [],
      bookmarkedIds: [],
      levelStats,
      totalCompletedLessons: 0,
      totalLessons,
      overallPercent: 0,
      lastStudiedLesson: {
        level: 1,
        lessonNumber: 1,
        timestamp: Date.now(),
      },
      recentActivityDates: [],
      isLoading: true,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastSyncedAt: null,
    };

    if (typeof window === 'undefined') return defaultState;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const completed = Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [];
        const journeyStartDate = parsed.journeyStartDate || null;
        return {
          ...defaultState,
          ...parsed,
          journeyStartDate,
          journeyDay: calculateJourneyDay(journeyStartDate),
          completedLessons: completed,
          levelStats: this.computeLevelStats(completed),
          totalCompletedLessons: completed.length,
          overallPercent: Math.round((completed.length / totalLessons) * 100),
          isLoading: false,
        };
      }
    } catch (e) {
      console.warn('Recovered corrupted learning progress storage:', e);
    }

    return defaultState;
  }

  private updateSnapshotLocally(updates: Partial<LearningProgressSnapshot>, broadcast: boolean = true): void {
    this.snapshot = {
      ...this.snapshot,
      ...updates,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
      } catch (err) {
        console.error('Failed to write progress to localStorage:', err);
      }
    }

    if (broadcast && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'PROGRESS_UPDATE',
          payload: this.snapshot,
        });
      } catch {
        // Broadcast safety
      }
    }

    this.notify();
  }

  private initBroadcastChannel(): void {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    try {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'PROGRESS_UPDATE' && event.data.payload) {
          // Reconcile cross-tab update without re-broadcasting
          this.updateSnapshotLocally(event.data.payload, false);
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel initialization skipped:', err);
    }
  }

  private initNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.updateSnapshotLocally({ isOnline: true });
      void this.syncWithServer();
    });

    window.addEventListener('offline', () => {
      this.updateSnapshotLocally({ isOnline: false });
    });

    window.addEventListener('focus', () => {
      // Re-validate when returning to tab
      void this.syncWithServer();
    });
  }

  private notify(): void {
    const current = this.getSnapshot();
    for (const listener of this.listeners) {
      try {
        listener(current);
      } catch (err) {
        console.error('Error in learning progress listener:', err);
      }
    }
  }
}

export const learningProgressService = new LearningProgressService();
