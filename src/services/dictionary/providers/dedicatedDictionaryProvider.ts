/**
 * YUYAN — Dedicated Dictionary Provider (Section 10 & 47)
 * Modular architecture for an independent, dedicated Chinese dictionary dataset.
 * INVARIANT: If no dedicated licensed dictionary dataset is installed in the database,
 * reports provider status as unavailable and returns empty array, strictly avoiding fake data.
 */

import { DictionaryProvider, DictionaryQuery, DictionaryResult } from '../dictionaryTypes';
import { getSupabaseClient } from '../../supabase/client';

export class DedicatedDictionaryProvider implements DictionaryProvider {
  id = 'dedicated_dictionary';
  name = 'Từ điển Chuyên biệt YUYAN (Độc lập)';
  sourceType = 'dedicated_dictionary' as const;

  isAvailable(): boolean {
    // Currently awaiting installation of independent dedicated dictionary dataset
    return false;
  }

  async search(query: DictionaryQuery): Promise<DictionaryResult[]> {
    const { filter } = query;
    if (filter?.sourceType && filter.sourceType !== 'all' && filter.sourceType !== 'dedicated') {
      return [];
    }

    // Check if dedicated table exists dynamically in Supabase
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
      // Future-proof table query when dedicated dictionary dataset is loaded
      const { data, error } = await (supabase as any)
        .from('dedicated_dictionary')
        .select('*')
        .limit(1);

      if (error || !data) {
        // Table does not exist yet; gracefully report unavailable without throwing or generating mock data
        return [];
      }

      // If dedicated table is populated in the future, query it here:
      return [];
    } catch {
      return [];
    }
  }
}

export const dedicatedDictionaryProvider = new DedicatedDictionaryProvider();
