/**
 * YUYAN — Pinyin Dictionary Provider
 * Searches the canonical Pinyin syllables and sound charts in Supabase.
 */

import { DictionaryProvider, DictionaryQuery, DictionaryResult } from '../dictionaryTypes';
import { getSupabaseClient } from '../../supabase/client';

export class PinyinDictionaryProvider implements DictionaryProvider {
  id = 'pinyin_database';
  name = 'Cơ sở dữ liệu Pinyin';
  sourceType = 'pinyin' as const;

  async search(query: DictionaryQuery): Promise<DictionaryResult[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { originalQuery, normalizedQuery, queryType, filter, limit = 10, offset = 0 } = query;
    if (!originalQuery) return [];

    if (filter?.sourceType && filter.sourceType !== 'all' && filter.sourceType !== 'pinyin') {
      return [];
    }

    // Only search pinyin if query is not pure Chinese characters
    if (queryType === 'chinese') return [];

    try {
      const { data, error } = await supabase
        .from('pinyin_syllables')
        .select('*')
        .ilike('syllable_plain', `%${normalizedQuery}%`)
        .range(offset, offset + limit - 1);

      if (error || !data || data.length === 0) return [];

      return data.map((item: any) => ({
        id: `pinyin_${item.id || item.syllable_plain}`,
        hanzi: item.characters ? item.characters.slice(0, 5).join(' ') : item.syllable_plain,
        pinyin: item.tones ? Object.values(item.tones).join(' · ') : item.syllable_plain,
        vietnamese: `Âm tiết Pinyin: ${item.syllable_plain}`,
        wordType: 'Âm tiết ngữ âm',
        definitions: [
          {
            definition: `Thanh mẫu: ${item.initial || 'Không có'} | Vận mẫu: ${item.final || ''}`,
            definitionVi: `Bảng phát âm âm tiết tiếng Trung tiêu chuẩn`,
            wordType: 'Ngữ âm',
          },
        ],
        source: {
          type: 'pinyin',
          provider: 'Hệ thống phiên âm ngữ âm YUYAN',
          label: `Pinyin · ${item.syllable_plain}`,
          version: '1.0.0',
        },
        isInternal: true,
        isApproved: true,
        audio: {
          text: item.syllable_plain,
          lang: 'zh-CN',
          isNative: false,
        },
      }));
    } catch (err) {
      console.warn('PinyinDictionaryProvider error:', err);
      return [];
    }
  }
}

export const pinyinDictionaryProvider = new PinyinDictionaryProvider();
