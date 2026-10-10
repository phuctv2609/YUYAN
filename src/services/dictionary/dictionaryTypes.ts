/**
 * YUYAN — Unified Dictionary Engine Types
 * Clean abstraction for Global Chinese Dictionary supporting multi-source retrieval,
 * deduplication, strict ranking, and source licensing.
 */

export interface DictionarySense {
  id?: string;
  definition: string;
  definitionVi?: string;
  definitionEn?: string;
  wordType?: string;
  examples?: DictionaryExample[];
}

export interface DictionaryExample {
  zh: string;
  pinyin?: string;
  vi?: string;
  en?: string;
}

export interface DictionaryAudio {
  url?: string;
  text: string;
  lang: string;
  isNative?: boolean;
}

export type DictionarySourceType =
  | 'cvdict'
  | 'lesson'
  | 'hsk'
  | 'professional'
  | 'hanzi'
  | 'pinyin'
  | 'dedicated_dictionary'
  | 'external'
  | 'web';

export interface DictionarySourceInfo {
  type: DictionarySourceType;
  provider: string;
  label: string;
  version?: string;
  url?: string;
  license?: string;
}

export interface DictionaryResult {
  id: string;
  hanzi: string;
  simplified?: string;
  traditional?: string;
  pinyin?: string;
  pinyinTone?: string;
  vietnamese?: string;
  hanViet?: string;
  english?: string;
  wordType?: string;
  definitions?: DictionarySense[];
  examples?: DictionaryExample[];
  collocations?: string[];
  synonyms?: string[];
  antonyms?: string[];
  relatedTerms?: string[];
  hskLevels?: number[];
  hskLevel?: number;
  lessons?: string[];
  lessonInfo?: { level: number; lessonNumber: number; title?: string; index?: number };
  professionalDomains?: string[];
  professionalCategories?: string[];
  subcategory?: string;
  source: DictionarySourceInfo;
  mergedSources?: DictionarySourceInfo[];
  isInternal: boolean;
  isApproved: boolean;
  qualityStatus?: string;
  hasEnglishLeakage?: boolean;
  audio?: DictionaryAudio;
  metadata?: Record<string, unknown>;
  rankingScore?: number;
}

export type QueryType = 'chinese' | 'pinyin' | 'vietnamese' | 'english' | 'mixed';

export interface DictionaryFilter {
  sourceType?: 'all' | 'cvdict' | 'hsk' | 'professional' | 'lesson' | 'hanzi' | 'pinyin' | 'dedicated' | 'external';
  hskLevel?: number;
  professionalDomain?: string;
  professionalCategory?: string;
}

export interface DictionaryQuery {
  originalQuery: string;
  normalizedQuery: string;
  queryType: QueryType;
  filter?: DictionaryFilter;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

export type DictionarySearchState =
  | 'idle'
  | 'searching_internal'
  | 'internal_results'
  | 'searching_external'
  | 'complete'
  | 'empty'
  | 'error';

export interface DictionaryProvider {
  id: string;
  name: string;
  sourceType: DictionarySourceType;
  search(query: DictionaryQuery): Promise<DictionaryResult[]>;
  isAvailable?(): boolean;
}
