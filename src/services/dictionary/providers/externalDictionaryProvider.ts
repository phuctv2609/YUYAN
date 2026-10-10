/**
 * YUYAN — External Open Dictionary Provider (Section 11, 43, 44)
 * Supports CC-CEDICT open dictionary with strict license attribution and caching in `dictionary_external_cache`.
 */

import { DictionaryProvider, DictionaryQuery, DictionaryResult } from '../dictionaryTypes';
import { dictionaryCache } from '../dictionaryCache';

export class ExternalDictionaryProvider implements DictionaryProvider {
  id = 'cc_cedict';
  name = 'Từ điển Mở CC-CEDICT';
  sourceType = 'external' as const;

  async search(query: DictionaryQuery): Promise<DictionaryResult[]> {
    const { originalQuery, normalizedQuery, filter, signal } = query;
    if (!originalQuery) return [];

    if (filter?.sourceType && filter.sourceType !== 'all' && filter.sourceType !== 'external') {
      return [];
    }

    // 1. Check database external cache first (Section 43)
    const cached = await dictionaryCache.getExternalCache(normalizedQuery, this.id);
    if (cached && cached.length > 0) {
      return cached;
    }

    // 2. Fetch from legitimate open CC-CEDICT API endpoint
    try {
      const encodedQ = encodeURIComponent(originalQuery);

      // Open public CC-CEDICT query endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const fetchSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

      const response = await fetch(`https://cc-cedict.freedictionaryapi.com/api/v1/entries?q=${encodedQ}`, {
        signal: fetchSignal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (!response || !response.ok) {
        return [];
      }

      const raw = await response.json().catch(() => null);
      if (!raw || !Array.isArray(raw) || raw.length === 0) {
        return [];
      }

      const results: DictionaryResult[] = raw.slice(0, 10).map((entry: any, idx: number) => ({
        id: `ext_cc_cedict_${entry.simplified || originalQuery}_${idx}`,
        hanzi: entry.simplified || entry.traditional || originalQuery,
        simplified: entry.simplified,
        traditional: entry.traditional,
        pinyin: entry.pinyin,
        vietnamese: `(Định nghĩa tiếng Anh từ CC-CEDICT: ${Array.isArray(entry.definitions) ? entry.definitions.join('; ') : entry.definitions})`,
        english: Array.isArray(entry.definitions) ? entry.definitions.join('; ') : entry.definitions,
        definitions: (Array.isArray(entry.definitions) ? entry.definitions : [entry.definitions]).map((def: string) => ({
          definition: def,
          definitionEn: def,
        })),
        source: {
          type: 'external',
          provider: 'CC-CEDICT Open Chinese Dictionary',
          label: 'Nguồn ngoài · CC-CEDICT',
          version: '2024',
          url: 'https://cc-cedict.org',
          license: 'Creative Commons Attribution-Share Alike 4.0 (CC BY-SA 4.0)',
        },
        isInternal: false,
        isApproved: false,
        audio: {
          text: entry.simplified || originalQuery,
          lang: 'zh-CN',
          isNative: false,
        },
      }));

      // Cache results in Supabase dictionary_external_cache
      if (results.length > 0) {
        dictionaryCache.setExternalCache(
          originalQuery,
          normalizedQuery,
          this.id,
          'CC-CEDICT',
          results
        ).catch(() => {});
      }

      return results;
    } catch {
      // Graceful fallback without failing the internal search
      return [];
    }
  }
}

export const externalDictionaryProvider = new ExternalDictionaryProvider();
