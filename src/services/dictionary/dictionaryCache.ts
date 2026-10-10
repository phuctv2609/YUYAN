/**
 * YUYAN — Dictionary Caching & User Local State
 * - In-memory LRU query cache (5-minute TTL)
 * - Lightweight Search History (Section 34)
 * - Lightweight Favorites by ID (Section 33)
 * - Remote external cache integration (Section 43)
 */

import { DictionaryResult } from './dictionaryTypes';
import { getSupabaseClient } from '../supabase/client';

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultId?: string;
  hanzi?: string;
}

const MEMORY_CACHE = new Map<string, { timestamp: number; results: DictionaryResult[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_MEMORY_ITEMS = 100;

const STORAGE_KEY_HISTORY = 'yuyan_dict_history';
const STORAGE_KEY_FAVORITES = 'yuyan_dict_favorites';
const MAX_HISTORY_ITEMS = 20;

export const dictionaryCache = {
  // 1. In-memory query caching
  get(cacheKey: string): DictionaryResult[] | null {
    const entry = MEMORY_CACHE.get(cacheKey);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      MEMORY_CACHE.delete(cacheKey);
      return null;
    }
    return entry.results;
  },

  set(cacheKey: string, results: DictionaryResult[]): void {
    if (MEMORY_CACHE.size >= MAX_MEMORY_ITEMS) {
      const oldestKey = MEMORY_CACHE.keys().next().value;
      if (oldestKey) MEMORY_CACHE.delete(oldestKey);
    }
    MEMORY_CACHE.set(cacheKey, { timestamp: Date.now(), results });
  },

  clear(): void {
    MEMORY_CACHE.clear();
  },

  // 2. Search History (Section 34: lightweight, max 20)
  getHistory(): SearchHistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_ITEMS) : [];
    } catch {
      return [];
    }
  },

  addHistory(query: string, resultId?: string, hanzi?: string): void {
    if (!query || !query.trim()) return;
    try {
      const history = this.getHistory().filter(h => h.query.toLowerCase() !== query.trim().toLowerCase());
      history.unshift({
        query: query.trim(),
        timestamp: Date.now(),
        resultId,
        hanzi,
      });
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
    } catch (e) {
      console.warn('Failed to save search history:', e);
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {}
  },

  // 3. Favorites / Saved Words (Section 33: store IDs and lightweight item snapshot)
  getFavorites(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  isFavorite(id: string): boolean {
    return this.getFavorites().includes(id);
  },

  toggleFavorite(id: string): boolean {
    try {
      const favs = new Set(this.getFavorites());
      let newState = false;
      if (favs.has(id)) {
        favs.delete(id);
        newState = false;
      } else {
        favs.add(id);
        newState = true;
      }
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(Array.from(favs)));
      return newState;
    } catch {
      return false;
    }
  },

  toggleFavoriteItem(item: DictionaryResult): boolean {
    try {
      const favs = new Set(this.getFavorites());
      let newState = false;
      let items = this.getFavoriteItems();

      if (favs.has(item.id)) {
        favs.delete(item.id);
        items = items.filter(i => i.id !== item.id);
        newState = false;
      } else {
        favs.add(item.id);
        items = [item, ...items.filter(i => i.id !== item.id)];
        newState = true;
      }

      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(Array.from(favs)));
      localStorage.setItem('yuyan_dict_favorite_items', JSON.stringify(items.slice(0, 100)));
      return newState;
    } catch {
      return false;
    }
  },

  getFavoriteItems(): DictionaryResult[] {
    try {
      const raw = localStorage.getItem('yuyan_dict_favorite_items');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  // 4. Remote External Cache Lookup (Section 43)
  async getExternalCache(normalizedQuery: string, provider: string): Promise<DictionaryResult[] | null> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('dictionary_external_cache')
        .select('*')
        .eq('normalized_query', normalizedQuery)
        .eq('provider', provider)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !data) return null;

      // Check if expired
      if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
        return null;
      }

      if (Array.isArray(data.response_json)) {
        return data.response_json as unknown as DictionaryResult[];
      }
      return null;
    } catch {
      return null;
    }
  },

  async setExternalCache(
    query: string,
    normalizedQuery: string,
    provider: string,
    source: string,
    results: DictionaryResult[],
    ttlDays: number = 7
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
      const id = `${provider}_${normalizedQuery}`.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

      await supabase.from('dictionary_external_cache').upsert({
        id,
        query,
        normalized_query: normalizedQuery,
        provider,
        source,
        response_json: results as any,
        expires_at: expiresAt,
        status: 'active',
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to save to dictionary_external_cache:', e);
    }
  },
};
