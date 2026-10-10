/**
 * YUYAN — HSK Dictionary Provider
 * Searches the 8,456 authoritative HSK 1–6 vocabulary items in Supabase.
 */

import { DictionaryProvider, DictionaryQuery, DictionaryResult } from '../dictionaryTypes';
import { getSupabaseClient } from '../../supabase/client';

export class HSKDictionaryProvider implements DictionaryProvider {
  id = 'hsk_curriculum';
  name = 'Từ điển HSK 1–6';
  sourceType = 'hsk' as const;

  async search(query: DictionaryQuery): Promise<DictionaryResult[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { originalQuery, normalizedQuery, queryType, filter, limit = 30, offset = 0 } = query;
    if (!originalQuery) return [];

    // Check filter applicability
    if (filter?.sourceType && filter.sourceType !== 'all' && filter.sourceType !== 'hsk') {
      return [];
    }

    try {
      let dbQuery = supabase
        .from('hsk_vocabulary')
        .select('*');

      if (filter?.hskLevel) {
        dbQuery = dbQuery.eq('hsk_level', filter.hskLevel);
      }

      // Build search condition based on query type
      if (queryType === 'chinese') {
        dbQuery = dbQuery.or(`hanzi.eq.${originalQuery},hanzi.ilike.%${originalQuery}%,collocations.ilike.%${originalQuery}%`);
      } else if (queryType === 'pinyin') {
        dbQuery = dbQuery.or(`pinyin.ilike.%${originalQuery}%,pinyin.ilike.%${normalizedQuery}%`);
      } else if (queryType === 'vietnamese') {
        dbQuery = dbQuery.or(`vietnamese.ilike.%${originalQuery}%,collocations.ilike.%${originalQuery}%`);
      } else {
        // Mixed / general text
        dbQuery = dbQuery.or(`hanzi.ilike.%${originalQuery}%,pinyin.ilike.%${normalizedQuery}%,vietnamese.ilike.%${originalQuery}%,collocations.ilike.%${originalQuery}%`);
      }

      dbQuery = dbQuery.range(offset, offset + limit - 1);

      let data: any[] = [];
      const { data: directData, error } = await dbQuery;
      if (!error && directData && directData.length > 0) {
        data = directData;
      } else {
        const { data: rpcData } = await supabase.rpc('search_dictionary', {
          p_query: originalQuery,
          p_limit: limit,
          p_offset: offset,
        });
        if (rpcData && Array.isArray(rpcData)) {
          const hskIds = rpcData.filter((r: any) => r.source_type === 'hsk').map((r: any) => r.id);
          if (hskIds.length > 0) {
            const { data: enrichedData } = await supabase
              .from('hsk_vocabulary')
              .select('*')
              .in('id', hskIds);
            if (enrichedData) data = enrichedData;
          }
        }
      }

      if (data.length === 0) return [];

      return data.map((item: any) => ({
        id: `hsk_${item.id}`,
        hanzi: item.hanzi,
        simplified: item.hanzi,
        traditional: item.traditional || undefined,
        pinyin: item.pinyin,
        vietnamese: item.vietnamese,
        hanViet: item.han_viet || undefined,
        wordType: item.part_of_speech || undefined,
        hskLevels: [item.hsk_level],
        hskLevel: item.hsk_level,
        lessons: item.lesson_id ? [item.lesson_id] : [],
        lessonInfo: item.lesson_id
          ? {
              level: item.hsk_level,
              lessonNumber: parseInt((item.lesson_id.match(/\d+$/) || ['1'])[0], 10),
            }
          : undefined,
        definitions: [
          {
            definition: item.vietnamese,
            definitionVi: item.vietnamese,
            wordType: item.word_type,
          },
        ],
        source: {
          type: 'hsk',
          provider: 'YUYAN Giáo trình HSK',
          label: `HSK ${item.hsk_level}${item.lesson_id ? ` · ${item.lesson_id}` : ''}`,
          version: '1.0.0',
        },
        isInternal: true,
        isApproved: true,
        audio: {
          text: item.hanzi,
          lang: 'zh-CN',
          isNative: true,
        },
      }));
    } catch (err) {
      console.warn('HSKDictionaryProvider error:', err);
      return [];
    }
  }
}

export const hskDictionaryProvider = new HSKDictionaryProvider();
