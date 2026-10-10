/**
 * YUYAN — Lesson Occurrence Dictionary Provider
 * Searches the 9,178 HSK lesson sentences in Supabase to provide real contextual occurrences.
 */

import { DictionaryProvider, DictionaryQuery, DictionaryResult } from '../dictionaryTypes';
import { getSupabaseClient } from '../../supabase/client';

export class LessonDictionaryProvider implements DictionaryProvider {
  id = 'lesson_sentences';
  name = 'Câu trong bài khóa';
  sourceType = 'lesson' as const;

  async search(query: DictionaryQuery): Promise<DictionaryResult[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { originalQuery, normalizedQuery, queryType, filter, limit = 15, offset = 0 } = query;
    if (!originalQuery) return [];

    // Only search sentences if 'all', 'hsk', or 'lesson' is selected
    if (
      filter?.sourceType &&
      filter.sourceType !== 'all' &&
      filter.sourceType !== 'hsk' &&
      filter.sourceType !== 'lesson'
    ) {
      return [];
    }

    try {
      let dbQuery = supabase
        .from('lesson_sentences')
        .select('*');

      if (queryType === 'chinese') {
        dbQuery = dbQuery.ilike('hanzi', `%${originalQuery}%`);
      } else if (queryType === 'vietnamese') {
        dbQuery = dbQuery.ilike('vietnamese', `%${originalQuery}%`);
      } else if (queryType === 'pinyin') {
        dbQuery = dbQuery.ilike('pinyin', `%${normalizedQuery}%`);
      } else {
        dbQuery = dbQuery.or(`hanzi.ilike.%${originalQuery}%,pinyin.ilike.%${normalizedQuery}%,vietnamese.ilike.%${originalQuery}%`);
      }

      dbQuery = dbQuery.range(offset, offset + limit - 1);

      const { data, error } = await dbQuery;
      if (error || !data || data.length === 0) return [];

      return data.map((item: any) => {
        const match = (item.lesson_id || '').match(/hsk(\d+).*?(\d+)/i);
        const level = match ? parseInt(match[1], 10) : 1;
        const lessonNumber = match ? parseInt(match[2], 10) : 1;

        return {
          id: `sentence_${item.id}`,
          hanzi: item.hanzi,
          pinyin: item.pinyin,
          vietnamese: item.vietnamese,
          hskLevel: level,
          lessons: [item.lesson_id],
          lessonInfo: { level, lessonNumber, index: item.sentence_index },
          examples: [
            {
              zh: item.hanzi,
              pinyin: item.pinyin,
              vi: item.vietnamese,
            },
          ],
          source: {
            type: 'lesson' as const,
            provider: 'Bài khóa HSK',
            label: `Bài khóa HSK ${level} · Bài ${lessonNumber}`,
            version: '1.0.0',
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
      console.warn('LessonDictionaryProvider error:', err);
      return [];
    }
  }
}

export const lessonDictionaryProvider = new LessonDictionaryProvider();
