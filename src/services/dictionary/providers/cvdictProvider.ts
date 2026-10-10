/**
 * YUYAN — CVDICT Dictionary Provider
 * Primary Chinese-Vietnamese dictionary source (122,595 entries)
 * Derived from ph0ngp/CVDICT (CC BY-SA 4.0)
 * Uses high-speed server-side RPC on Supabase PostgreSQL 17
 */

import { DictionaryProvider, DictionaryQuery, DictionaryResult } from '../dictionaryTypes';
import { getSupabaseClient } from '../../supabase/client';

export interface CVDICTWordDetail {
  entry: {
    id: string;
    source_key: string;
    traditional: string;
    simplified: string;
    pinyin: string;
    pinyin_normalized: string;
    meanings_vi: string[];
    source_name: string;
    source_url: string;
    source_commit: string;
    source_license: string;
    quality_status: string;
    has_english_leakage: boolean;
  };
  hsk_matches: Array<{
    id: string;
    hanzi: string;
    pinyin: string;
    hsk_level: number;
    part_of_speech?: string;
    vietnamese: string;
    collocations?: string;
  }>;
  lesson_occurrences: Array<{
    lesson_id: string;
    level: number;
    lesson_number: number;
    lesson_title: string;
    sentence_index: number;
    hanzi: string;
    pinyin: string;
    vietnamese: string;
  }>;
  hanzi_breakdown: Array<{
    char: string;
    traditional?: string;
    stroke_count: number;
    radical_number: number;
    radical_char?: string;
    radical_name_vi?: string;
    pinyin: string[];
    meanings: string[];
    structure_name_vi?: string;
  }>;
}

export class CvdictProvider implements DictionaryProvider {
  id = 'cvdict';
  name = 'Từ điển CVDICT (122.000+ mục từ · CC BY-SA 4.0)';
  sourceType = 'cvdict' as const;

  isAvailable(): boolean {
    return true;
  }

  async search(query: DictionaryQuery): Promise<DictionaryResult[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { originalQuery, limit = 40, offset = 0 } = query;
    const cleanQ = originalQuery.trim();
    if (!cleanQ) return [];

    try {
      const { data, error } = await (supabase as any).rpc('search_cvdict_entries', {
        p_query: cleanQ,
        p_limit: limit,
        p_offset: offset
      });

      if (error || !data) {
        console.warn('search_cvdict_entries error:', error?.message);
        return [];
      }

      return data.map((item: any) => ({
        id: item.id,
        hanzi: item.simplified,
        simplified: item.simplified,
        traditional: item.traditional,
        pinyin: item.pinyin,
        pinyinTone: item.pinyin,
        vietnamese: Array.isArray(item.meanings_vi) ? item.meanings_vi.join('; ') : String(item.meanings_vi || ''),
        definitions: Array.isArray(item.meanings_vi)
          ? item.meanings_vi.map((def: string) => ({
              definition: def,
              definitionVi: def
            }))
          : [{ definition: String(item.meanings_vi || ''), definitionVi: String(item.meanings_vi || '') }],
        source: {
          type: 'cvdict',
          provider: 'CVDICT',
          label: 'CVDICT · CC BY-SA 4.0',
          url: 'https://github.com/ph0ngp/CVDICT',
          license: 'CC BY-SA 4.0'
        },
        isInternal: true,
        isApproved: true,
        qualityStatus: item.quality_status || 'verified',
        hasEnglishLeakage: Boolean(item.has_english_leakage),
        rankingScore: item.calc_score || item.score || 100,
        metadata: {
          totalCount: Number(item.cnt || item.total_count || 0)
        },
        audio: {
          text: item.simplified,
          lang: 'zh-CN'
        }
      }));
    } catch (err: any) {
      console.warn('CvdictProvider exception:', err?.message);
      return [];
    }
  }

  async getWordDetail(id: string): Promise<CVDICTWordDetail | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await (supabase as any).rpc('get_dictionary_word_detail', {
        p_id: id
      });

      if (error) {
        console.warn('get_dictionary_word_detail error:', error.message);
        return null;
      }

      return data as CVDICTWordDetail;
    } catch (err: any) {
      console.warn('getWordDetail exception:', err?.message);
      return null;
    }
  }
}

export const cvdictProvider = new CvdictProvider();
