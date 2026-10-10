/**
 * YUYAN — Supabase Client & Connection Manager
 * Integrates real-time persistence with offline-first fallback.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

const env =
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? (import.meta as any).env
    : typeof globalThis !== 'undefined' && (globalThis as any).process
    ? (globalThis as any).process.env
    : {};
const supabaseUrl = env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || '';

let clientInstance: SupabaseClient<Database> | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
}

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return clientInstance;
}

/**
 * Generates or retrieves an anonymous learner UUID.
 * Ensures learners can study and persist progress without mandatory authentication.
 */
export function getLearnerSessionId(): string {
  const STORAGE_KEY = 'yuyan_learner_uuid';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    // Generate RFC4122 v4 UUID
    sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}
