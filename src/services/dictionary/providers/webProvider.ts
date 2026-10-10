/**
 * YUYAN — Web Reference Provider (Section 12)
 * Controlled fallback for reference lookup when words are absent from internal databases.
 * INVARIANT: Never scrapes arbitrary websites from React; never exposes API secrets.
 */

import { DictionaryProvider, DictionaryQuery, DictionaryResult } from '../dictionaryTypes';

export class WebDictionaryProvider implements DictionaryProvider {
  id = 'web_reference';
  name = 'Nguồn tham khảo Web';
  sourceType = 'web' as const;

  async search(query: DictionaryQuery): Promise<DictionaryResult[]> {
    const { originalQuery, filter } = query;
    if (!originalQuery || originalQuery.length > 50) return [];

    // Web provider only triggers when explicitly enabled or as a last-resort link
    if (filter?.sourceType && filter.sourceType !== 'all') {
      return [];
    }

    return [];
  }

  /**
   * Generates safe web reference links for user reference
   */
  getWebReferenceLinks(query: string): Array<{ name: string; url: string }> {
    const q = encodeURIComponent(query.trim());
    return [
      {
        name: 'Tra từ trên Baidu Baike (百度百科)',
        url: `https://baike.baidu.com/item/${q}`,
      },
      {
        name: 'Tra chữ trên HanziCraft',
        url: `https://hanzicraft.com/character/${q}`,
      },
      {
        name: 'Tra câu mẫu trên Tatoeba',
        url: `https://tatoeba.org/vi/sentences/search?query=${q}&from=cmn&to=vie`,
      },
    ];
  }
}

export const webDictionaryProvider = new WebDictionaryProvider();
