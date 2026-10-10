/**
 * YUYAN — ONE UNIFIED DICTIONARY ENGINE (Section 14 & 54)
 * The single authoritative orchestration layer for all dictionary queries.
 * Handles query normalization, internal multi-provider search, external fallback,
 * deduplication, and strict deterministic ranking.
 */

import {
  DictionaryResult,
  DictionaryFilter,
  DictionarySearchState,
  DictionaryQuery,
} from './dictionaryTypes';
import { createDictionaryQuery } from './dictionaryNormalizer';
import { deduplicateAndMergeResults } from './dictionaryRanking';
import { dictionaryCache } from './dictionaryCache';
import { audioManager } from '../audio/audioManager';

// Providers
import { cvdictProvider } from './providers/cvdictProvider';
import { hskDictionaryProvider } from './providers/hskProvider';
import { lessonDictionaryProvider } from './providers/lessonProvider';
import { professionalDictionaryProvider } from './providers/professionalProvider';
import { hanziDictionaryProvider } from './providers/hanziProvider';
import { pinyinDictionaryProvider } from './providers/pinyinProvider';
import { externalDictionaryProvider } from './providers/externalDictionaryProvider';
import { webDictionaryProvider } from './providers/webProvider';

export interface SearchOptions {
  filter?: DictionaryFilter;
  limit?: number;
  offset?: number;
  onStateChange?: (state: DictionarySearchState) => void;
  onPartialResults?: (results: DictionaryResult[]) => void;
}

class DictionaryEngine {
  private currentAbortController: AbortController | null = null;
  private currentQueryId: number = 0;

  /**
   * Primary entry point for UI search.
   * Cancels stale requests automatically (Section 41).
   */
  async search(rawQuery: string, options: SearchOptions = {}): Promise<DictionaryResult[]> {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      if (options.onStateChange) options.onStateChange('idle');
      return [];
    }

    // Abort previous in-flight request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    const queryId = ++this.currentQueryId;
    const { filter, limit = 40, offset = 0, onStateChange, onPartialResults } = options;

    if (onStateChange) onStateChange('searching_internal');

    const cacheKey = `${trimmed}_${JSON.stringify(filter || {})}_${limit}_${offset}`;
    const cached = dictionaryCache.get(cacheKey);
    if (cached) {
      if (onStateChange) onStateChange('complete');
      return cached;
    }

    const query: DictionaryQuery = createDictionaryQuery(trimmed, filter, limit, offset, signal);

    try {
      // 1. Parallel Internal Search (CVDICT, HSK, Lessons, Professional 10k, Hanzi, Pinyin)
      const internalPromises = [
        cvdictProvider.search(query),
        hskDictionaryProvider.search(query),
        professionalDictionaryProvider.search(query),
        hanziDictionaryProvider.search(query),
        lessonDictionaryProvider.search(query),
        pinyinDictionaryProvider.search(query),
      ];

      const internalResultsNested = await Promise.all(internalPromises);
      if (signal.aborted || queryId !== this.currentQueryId) return [];

      const rawInternalResults = internalResultsNested.flat();
      let mergedResults = deduplicateAndMergeResults(rawInternalResults, query);

      // Save to recent search history
      if (mergedResults.length > 0) {
        dictionaryCache.addHistory(trimmed, mergedResults[0].id, mergedResults[0].hanzi);
      }

      // If we have internal results, stream them immediately to UI (Section 40)
      if (mergedResults.length > 0) {
        if (onStateChange) onStateChange('internal_results');
        if (onPartialResults) onPartialResults(mergedResults);
      }

      // 2. Asynchronous External Search (e.g. CC-CEDICT) only when requested or internal results are empty
      const shouldSearchExternal =
        filter?.sourceType === 'external' ||
        (mergedResults.length === 0 && (!filter?.sourceType || filter.sourceType === 'all'));

      if (shouldSearchExternal && !signal.aborted) {
        if (onStateChange) onStateChange('searching_external');

        const externalResults = await externalDictionaryProvider.search(query);
        if (signal.aborted || queryId !== this.currentQueryId) return mergedResults;

        if (externalResults.length > 0) {
          // Merge external results into current set
          mergedResults = deduplicateAndMergeResults([...mergedResults, ...externalResults], query);
        }
      }

      // Cache final results
      dictionaryCache.set(cacheKey, mergedResults);

      if (onStateChange) {
        onStateChange(mergedResults.length === 0 ? 'empty' : 'complete');
      }

      return mergedResults;
    } catch (err: any) {
      if (err.name === 'AbortError' || signal.aborted) {
        return [];
      }
      console.warn('DictionaryEngine.search error:', err);
      if (onStateChange) onStateChange('error');
      return [];
    }
  }

  /**
   * Pronunciation audio playback with strict priority (Section 31):
   * 1. Native YUYAN audio
   * 2. Browser Mandarin TTS (zh-CN)
   */
  async playAudio(hanzi: string, pinyin?: string): Promise<void> {
    if (!hanzi || !hanzi.trim()) return;

    audioManager.playText(hanzi.trim(), {
      id: `dict_${encodeURIComponent(hanzi)}`,
      entityType: 'vocabulary',
      pinyin,
    });
  }

  /**
   * Helper to get safe web reference links for fallback
   */
  getWebLinks(query: string) {
    return webDictionaryProvider.getWebReferenceLinks(query);
  }
}

export const dictionaryEngine = new DictionaryEngine();
