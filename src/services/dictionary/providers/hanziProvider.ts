/**
 * YUYAN — Canonical Hanzi Dictionary Provider
 * Searches the 6,500+ canonical Chinese characters and 214 Kangxi radicals in Supabase.
 */

import { DictionaryProvider, DictionaryQuery, DictionaryResult } from '../dictionaryTypes';
import { getSupabaseClient } from '../../supabase/client';

export class HanziDictionaryProvider implements DictionaryProvider {
  id = 'canonical_hanzi';
  name = 'Cơ sở dữ liệu Hán tự chuẩn';
  sourceType = 'hanzi' as const;

  async search(query: DictionaryQuery): Promise<DictionaryResult[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { originalQuery, filter, limit = 20, offset = 0 } = query;
    if (!originalQuery) return [];

    if (filter?.sourceType && filter.sourceType !== 'all' && filter.sourceType !== 'hanzi') {
      return [];
    }

    try {
      const q = originalQuery.trim();

      // Use search_hanzi_master RPC for unified, fast, tone-tolerant searching
      const { data, error } = await (supabase as any).rpc('search_hanzi_master', {
        p_query: q,
        p_radical: (filter as any)?.radicalNumber || null,
        p_hsk_level: filter?.hskLevel || null,
        p_limit: limit,
        p_offset: offset,
      });

      if (error || !data) {
        console.warn('HanziDictionaryProvider RPC error:', error);
        return [];
      }

      const rows = (data as { characters?: any[] }).characters || [];
      if (!Array.isArray(rows) || rows.length === 0) return [];

      return rows.map((item: any) => ({
        id: `hanzi_${item.char}`,
        hanzi: item.char,
        simplified: item.char,
        traditional: item.traditional || undefined,
        pinyin: Array.isArray(item.pinyin) ? item.pinyin.join(', ') : item.pinyin,
        hanViet: item.han_viet || undefined,
        vietnamese: Array.isArray(item.meanings) ? item.meanings.join(', ') : item.meanings,
        wordType: 'Chữ Hán đơn',
        hskLevel: item.hsk_levels && item.hsk_levels.length > 0 ? item.hsk_levels[0] : undefined,
        hskLevels: Array.isArray(item.hsk_levels) ? item.hsk_levels : [],
        definitions: [
          {
            definition: Array.isArray(item.meanings) ? item.meanings.join(', ') : item.meanings || '',
            definitionVi: Array.isArray(item.meanings) ? item.meanings.join(', ') : item.meanings || '',
            wordType: 'Hán tự',
          },
        ],
        metadata: {
          strokeCount: item.stroke_count,
          radicalNumber: item.radical_number,
          decomposition: item.decomposition,
          structure: item.structure,
          structureNameVi: item.structure_name_vi,
          mnemonic: item.mnemonic,
        },
        source: {
          type: 'hanzi',
          provider: 'Cơ sở dữ liệu Hán tự YUYAN',
          label: `Hán tự (${item.stroke_count} nét, Bộ ${item.radical_number})`,
          version: '2.0.0',
        },
        isInternal: true,
        isApproved: true,
        audio: {
          text: item.char,
          lang: 'zh-CN',
          isNative: true,
        },
      }));
    } catch (err) {
      console.warn('HanziDictionaryProvider error:', err);
      return [];
    }
  }
}

export const hanziDictionaryProvider = new HanziDictionaryProvider();
