/**
 * YUYAN — Professional Vocabulary Dictionary Provider
 * Searches the authoritative 10,000 professional Chinese terms in Supabase (`specialized_vocabulary`).
 * Fully dynamic across all 26 real industries with zero hardcoded domain limitations.
 */

import { DictionaryProvider, DictionaryQuery, DictionaryResult } from '../dictionaryTypes';
import { getSupabaseClient } from '../../supabase/client';

export class ProfessionalDictionaryProvider implements DictionaryProvider {
  id = 'professional_vocabulary';
  name = 'Từ vựng Chuyên ngành (10,000 từ)';
  sourceType = 'professional' as const;

  async search(query: DictionaryQuery): Promise<DictionaryResult[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { originalQuery, normalizedQuery, queryType, filter, limit = 30, offset = 0 } = query;
    if (!originalQuery) return [];

    if (filter?.sourceType && filter.sourceType !== 'all' && filter.sourceType !== 'professional') {
      return [];
    }

    try {
      let dbQuery = supabase
        .from('specialized_vocabulary')
        .select('*')
        .in('duplicate_action', ['unique', 'keep_primary']);

      // Domain / Industry filter
      if (filter?.professionalDomain && filter.professionalDomain !== 'all') {
        dbQuery = dbQuery.or(`domain_id.eq.${filter.professionalDomain},industry.eq.${filter.professionalDomain}`);
      }
      if (filter?.professionalCategory && filter.professionalCategory !== 'all') {
        dbQuery = dbQuery.or(`subcategory.eq.${filter.professionalCategory},category_id.eq.${filter.professionalCategory}`);
      }

      // Search matches
      if (queryType === 'chinese') {
        dbQuery = dbQuery.or(`hanzi.eq.${originalQuery},hanzi.ilike.%${originalQuery}%`);
      } else if (queryType === 'pinyin') {
        dbQuery = dbQuery.or(`pinyin.ilike.%${originalQuery}%,pinyin.ilike.%${normalizedQuery}%`);
      } else if (queryType === 'vietnamese') {
        dbQuery = dbQuery.or(`vietnamese.ilike.%${originalQuery}%,definition_vi.ilike.%${originalQuery}%,han_viet.ilike.%${originalQuery}%`);
      } else {
        dbQuery = dbQuery.or(`hanzi.ilike.%${originalQuery}%,pinyin.ilike.%${normalizedQuery}%,vietnamese.ilike.%${originalQuery}%,han_viet.ilike.%${originalQuery}%`);
      }

      dbQuery = dbQuery.range(offset, offset + limit - 1);

      let data: any[] = [];
      const { data: directData, error } = await dbQuery;
      if (!error && directData && directData.length > 0) {
        data = directData;
      } else {
        // Fallback to RPC search_dictionary
        const { data: rpcData } = await supabase.rpc('search_dictionary', {
          p_query: originalQuery,
          p_limit: limit,
          p_offset: offset,
        });
        if (rpcData && Array.isArray(rpcData)) {
          const profIds = rpcData.filter((r: any) => r.source_type === 'professional').map((r: any) => r.id);
          if (profIds.length > 0) {
            const { data: enrichedData } = await supabase
              .from('specialized_vocabulary')
              .select('*')
              .in('id', profIds);
            if (enrichedData) data = enrichedData;
          }
        }
      }

      if (data.length === 0) return [];

      return data.map((item: any) => {
        const domainLabel = item.industry || item.domain_id;
        const examples = [];
        if (item.example_sentence || item.sample_sentence_zh) {
          examples.push({
            zh: item.example_sentence || item.sample_sentence_zh,
            pinyin: item.example_pinyin || item.sample_sentence_pinyin || undefined,
            vi: item.example_vietnamese || item.sample_sentence_vi || undefined,
          });
        }

        return {
          id: `prof_${item.id}`,
          hanzi: item.hanzi,
          simplified: item.hanzi,
          traditional: item.canonical_hanzi || item.traditional || undefined,
          pinyin: item.pinyin,
          vietnamese: item.vietnamese,
          hanViet: item.han_viet || undefined,
          wordType: item.part_of_speech || '专业词组',
          professionalDomains: [item.domain_id],
          professionalCategories: [item.category_id],
          subcategory: item.subcategory || undefined,
          definitions: [
            {
              definition: item.vietnamese,
              definitionVi: item.vietnamese,
              wordType: item.part_of_speech || '专业词组',
              examples,
            },
          ],
          examples,
          collocations: Array.isArray(item.collocations) ? item.collocations : [],
          synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
          antonyms: Array.isArray(item.antonyms) ? item.antonyms : [],
          relatedTerms: Array.isArray(item.related_terms) ? item.related_terms : [],
          source: {
            type: 'professional',
            provider: 'YUYAN Từ vựng chuyên ngành 10.000 từ',
            label: `Chuyên ngành · ${domainLabel}`,
            version: '2.0.0',
          },
          isInternal: true,
          isApproved: true,
          audio: {
            text: item.hanzi,
            lang: 'zh-CN',
            isNative: true,
          },
        };
      });
    } catch (err) {
      console.warn('ProfessionalDictionaryProvider error:', err);
      return [];
    }
  }
}

export const professionalDictionaryProvider = new ProfessionalDictionaryProvider();
