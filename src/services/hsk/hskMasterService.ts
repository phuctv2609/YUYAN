import { getSupabaseClient, getLearnerSessionId } from '../supabase/client';

export type HskFramework = 'hsk2' | 'hsk3';
export type HskListType = 'exclusive' | 'inclusive';
export type HskLearnerStatus = 'all' | 'new' | 'learning' | 'learned' | 'review';

export interface HskLevelMembership {
  framework: HskFramework;
  level_code: string;
  level_number: number;
  is_exclusive: boolean;
  is_inclusive?: boolean;
}

export interface HskMasterEntry {
  id: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  pinyin_numeric?: string;
  radical: string | null;
  frequency: number | null;
  pos: string[] | null;
  pos_vi: string[] | null;
  classifiers: string[] | null;
  meanings_en: string[];
  meanings_vi: string[];
  confidence: number;
  review_status: 'verified' | 'review_required';
  levels_summary: HskLevelMembership[];
  learner_status: 'new' | 'learning' | 'learned' | 'review';
  total_count: number;
}

export interface LessonSentenceOccurrence {
  lesson_id: string;
  lesson_title: string;
  level: number;
  lesson_number: number;
  sentence_index: number;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}

export interface CvdictMatch {
  id: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  meanings_vi: string[];
  source_license: string;
}

export interface HanziCharBreakdown {
  char: string;
  traditional: string;
  stroke_count: number;
  radical_number: number;
  radical_char: string;
  radical_name_vi: string;
  pinyin: string;
  meanings: string[];
  structure_name_vi: string;
}

export interface HskWordMasterDetail {
  entry: HskMasterEntry;
  memberships: HskLevelMembership[];
  learner_status: 'new' | 'learning' | 'learned' | 'review';
  lesson_occurrences: LessonSentenceOccurrence[];
  cvdict_matches: CvdictMatch[];
  hanzi_breakdown: HanziCharBreakdown[];
}

export interface LevelConfig {
  code: string;
  level: number;
  label: string;
  shortLabel: string;
  exclusiveCount: number;
  cumulativeCount: number;
}

export const HSK2_LEVELS: LevelConfig[] = [
  { code: 'old-1', level: 1, label: 'HSK 2.0 Cấp 1', shortLabel: 'Cấp 1', exclusiveCount: 150, cumulativeCount: 150 },
  { code: 'old-2', level: 2, label: 'HSK 2.0 Cấp 2', shortLabel: 'Cấp 2', exclusiveCount: 147, cumulativeCount: 297 },
  { code: 'old-3', level: 3, label: 'HSK 2.0 Cấp 3', shortLabel: 'Cấp 3', exclusiveCount: 298, cumulativeCount: 595 },
  { code: 'old-4', level: 4, label: 'HSK 2.0 Cấp 4', shortLabel: 'Cấp 4', exclusiveCount: 598, cumulativeCount: 1193 },
  { code: 'old-5', level: 5, label: 'HSK 2.0 Cấp 5', shortLabel: 'Cấp 5', exclusiveCount: 1298, cumulativeCount: 2491 },
  { code: 'old-6', level: 6, label: 'HSK 2.0 Cấp 6', shortLabel: 'Cấp 6', exclusiveCount: 2500, cumulativeCount: 4991 },
];

export const HSK3_LEVELS: LevelConfig[] = [
  { code: 'new-1', level: 1, label: 'HSK 3.0 Cấp 1', shortLabel: 'Cấp 1', exclusiveCount: 506, cumulativeCount: 506 },
  { code: 'new-2', level: 2, label: 'HSK 3.0 Cấp 2', shortLabel: 'Cấp 2', exclusiveCount: 750, cumulativeCount: 1256 },
  { code: 'new-3', level: 3, label: 'HSK 3.0 Cấp 3', shortLabel: 'Cấp 3', exclusiveCount: 953, cumulativeCount: 2209 },
  { code: 'new-4', level: 4, label: 'HSK 3.0 Cấp 4', shortLabel: 'Cấp 4', exclusiveCount: 972, cumulativeCount: 3181 },
  { code: 'new-5', level: 5, label: 'HSK 3.0 Cấp 5', shortLabel: 'Cấp 5', exclusiveCount: 1059, cumulativeCount: 4240 },
  { code: 'new-6', level: 6, label: 'HSK 3.0 Cấp 6', shortLabel: 'Cấp 6', exclusiveCount: 1123, cumulativeCount: 5363 },
  { code: 'new-7', level: 7, label: 'HSK 3.0 Cấp 7–9 (Cao cấp)', shortLabel: 'Cấp 7–9', exclusiveCount: 5606, cumulativeCount: 10969 },
];

export const COMMON_POS_OPTIONS = [
  { code: 'all', label: 'Tất cả từ loại' },
  { code: 'n', label: 'Danh từ (n)' },
  { code: 'v', label: 'Động từ (v)' },
  { code: 'a', label: 'Tính từ (adj)' },
  { code: 'd', label: 'Phó từ (adv)' },
  { code: 'r', label: 'Đại từ (pron)' },
  { code: 'm', label: 'Số từ (num)' },
  { code: 'q', label: 'Lượng từ (clf)' },
  { code: 'p', label: 'Giới từ (prep)' },
  { code: 'c', label: 'Liên từ (conj)' },
  { code: 'u', label: 'Trợ từ (part)' },
];

class HskMasterService {
  async searchWords(params: {
    framework: HskFramework;
    levelCode?: string | null;
    listType: HskListType;
    query?: string;
    pos?: string | null;
    radical?: string | null;
    learnerId?: string;
    status?: HskLearnerStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: HskMasterEntry[]; totalCount: number }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client is unavailable');
      return { items: [], totalCount: 0 };
    }

    const learnerId = params.learnerId || getLearnerSessionId();
    const query = (params.query || '').trim();
    const pos = params.pos && params.pos !== 'all' ? params.pos : 'all';
    const radical = params.radical && params.radical !== 'all' ? params.radical : 'all';
    const levelCode = params.levelCode && params.levelCode !== 'all' ? params.levelCode : 'all';
    const listType = levelCode === 'all' ? 'all' : params.listType;
    const status = params.status || 'all';
    const limit = params.limit ?? 24;
    const offset = params.offset ?? 0;

    const { data, error } = await supabase.rpc('search_hsk_master_words' as any, {
      p_framework: params.framework,
      p_level_code: levelCode,
      p_list_type: listType,
      p_query: query,
      p_pos: pos,
      p_radical: radical,
      p_learner_id: learnerId,
      p_status: status,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error querying search_hsk_master_words:', error);
      throw error;
    }

    const items = (data || []) as HskMasterEntry[];
    const totalCount = items.length > 0 ? Number(items[0].total_count) : 0;

    return { items, totalCount };
  }

  async getWordDetail(entryId: string, learnerId?: string): Promise<HskWordMasterDetail | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const effectiveLearnerId = learnerId || getLearnerSessionId();

    const { data, error } = await supabase.rpc('get_hsk_word_master_detail' as any, {
      p_entry_id: entryId,
      p_learner_id: effectiveLearnerId,
    });

    if (error) {
      console.error('Error calling get_hsk_word_master_detail:', error);
      return null;
    }

    return data as HskWordMasterDetail;
  }

  async updateLearnerStatus(
    entryId: string,
    simplified: string,
    status: 'new' | 'learning' | 'learned' | 'review',
    notes?: string,
    learnerId?: string
  ): Promise<{ success: boolean; status: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, status };

    const effectiveLearnerId = learnerId || getLearnerSessionId();

    const { data, error } = await supabase.rpc('set_hsk_learner_word_status' as any, {
      p_learner_id: effectiveLearnerId,
      p_entry_id: entryId,
      p_simplified: simplified,
      p_status: status,
      p_notes: notes || null,
    });

    if (error) {
      console.error('Error setting learner word status:', error);
      throw error;
    }

    return data as { success: boolean; status: string };
  }
}

export const hskMasterService = new HskMasterService();
