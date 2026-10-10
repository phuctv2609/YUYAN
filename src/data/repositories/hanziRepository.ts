/**
 * YUYAN Hanzi Repository
 * Data access abstraction for Canonical Chinese Characters (汉字).
 * Supports both high-speed offline in-memory cache and server-side RPC (search_hanzi_master)
 * backed by Supabase with >= 6,000 characters.
 */

import { CanonicalHanzi, HanziFilterOptions } from '../models/hanzi';
import { CANONICAL_HANZI_DATA } from '../hanzi/canonicalHanzi';
import { getSupabaseClient } from '../../services/supabase/client';
import { radicalRepository } from './radicalRepository';

export interface HanziServerSearchResult {
  total: number;
  characters: CanonicalHanzi[];
}

export class HanziRepository {
  private characters: CanonicalHanzi[] = CANONICAL_HANZI_DATA;
  private byChar: Map<string, CanonicalHanzi> = new Map();
  private byRadical: Map<number, CanonicalHanzi[]> = new Map();

  constructor() {
    for (const h of this.characters) {
      this.byChar.set(h.char, h);
      if (!this.byRadical.has(h.radicalNumber)) {
        this.byRadical.set(h.radicalNumber, []);
      }
      this.byRadical.get(h.radicalNumber)!.push(h);
    }
  }

  public getAll(): CanonicalHanzi[] {
    return [...this.characters];
  }

  public getByChar(char: string): CanonicalHanzi | undefined {
    return this.byChar.get(char);
  }

  public async fetchByChar(char: string): Promise<CanonicalHanzi | undefined> {
    if (this.byChar.has(char)) {
      return this.byChar.get(char);
    }

    const supabase = getSupabaseClient();
    if (!supabase) return undefined;

    try {
      const { data, error } = await supabase
        .from('canonical_hanzi')
        .select('*')
        .eq('char', char)
        .maybeSingle();

      if (error || !data) return undefined;

      const mapped = this.mapDatabaseRowToModel(data);
      this.byChar.set(char, mapped);
      return mapped;
    } catch {
      return undefined;
    }
  }

  public getByRadical(radicalNumber: number): CanonicalHanzi[] {
    return this.byRadical.get(radicalNumber) || [];
  }

  public getByLevel(hskLevel: number): CanonicalHanzi[] {
    return this.characters.filter((c) => c.hskLevels.includes(hskLevel));
  }

  /**
   * High-performance Server-Side Search RPC against 6,500+ characters.
   */
  public async searchServer(options: HanziFilterOptions): Promise<HanziServerSearchResult> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // Fallback to local memory filter
      const localResults = this.search(options);
      const offset = options.offset || 0;
      const limit = options.limit || 48;
      return {
        total: localResults.length,
        characters: localResults.slice(offset, offset + limit),
      };
    }

    try {
      const { data, error } = await (supabase as any).rpc('search_hanzi_master', {
        p_query: options.query || '',
        p_radical: options.radicalNumber || null,
        p_hsk_level: options.hskLevel || null,
        p_min_strokes: options.minStrokes || null,
        p_max_strokes: options.maxStrokes || null,
        p_limit: options.limit || 48,
        p_offset: options.offset || 0,
      });

      if (error || !data) {
        console.warn('search_hanzi_master RPC error, falling back to local search:', error);
        const localResults = this.search(options);
        return {
          total: localResults.length,
          characters: localResults.slice(options.offset || 0, (options.offset || 0) + (options.limit || 48)),
        };
      }

      const resObj = data as unknown as { total: number; characters: any[] };
      const rawRows = resObj.characters || [];
      const total = Number(resObj.total) || 0;

      const characters = rawRows.map((r: any) => {
        const item = this.mapDatabaseRowToModel(r);
        this.byChar.set(item.char, item);
        return item;
      });

      return { total, characters };
    } catch (err) {
      console.warn('searchServer exception:', err);
      const localResults = this.search(options);
      return {
        total: localResults.length,
        characters: localResults.slice(options.offset || 0, (options.offset || 0) + (options.limit || 48)),
      };
    }
  }

  public search(options: HanziFilterOptions): CanonicalHanzi[] {
    const q = (options.query || '').trim().toLowerCase();

    return this.characters.filter((c) => {
      if (options.hskLevel !== undefined && !c.hskLevels.includes(options.hskLevel)) {
        return false;
      }
      if (options.radicalNumber !== undefined && c.radicalNumber !== options.radicalNumber) {
        return false;
      }
      if (options.strokeCount !== undefined && c.strokeCount !== options.strokeCount) {
        return false;
      }
      if (options.minStrokes !== undefined && c.strokeCount < options.minStrokes) {
        return false;
      }
      if (options.maxStrokes !== undefined && c.strokeCount > options.maxStrokes) {
        return false;
      }

      if (!q) return true;

      if (c.char === q) return true;
      if (c.traditional === q) return true;
      if (c.hanViet && c.hanViet.toLowerCase().includes(q)) return true;
      if (c.pinyin.some((p) => p.toLowerCase().includes(q))) return true;
      if (c.meanings.some((m) => m.toLowerCase().includes(q))) return true;
      if (c.vocabularyIds.some((v) => v.toLowerCase().includes(q))) return true;

      return false;
    });
  }

  private mapDatabaseRowToModel(row: any): CanonicalHanzi {
    const radNum = Number(row.radical_number) || 1;
    const radObj = radicalRepository.getByNumber(radNum);

    return {
      char: row.char,
      traditional: row.traditional || row.char,
      pinyin: Array.isArray(row.pinyin) ? row.pinyin : [row.pinyin || ''],
      pinyinNumbers: Array.isArray(row.pinyin) ? row.pinyin : [row.pinyin || ''],
      hanViet: row.han_viet || undefined,
      meanings: Array.isArray(row.meanings) ? row.meanings : [row.meanings || ''],
      strokeCount: Number(row.stroke_count) || 1,
      radical: radObj?.char || row.radical || '一',
      radicalNumber: radNum,
      components: Array.isArray(row.components) ? row.components : [row.char],
      decomposition: row.decomposition || 'Chữ đơn thể',
      structure: row.structure || 'single',
      structureNameVi: row.structure_name_vi || 'Chữ đơn thể',
      strokeData: Array.isArray(row.stroke_data) ? row.stroke_data : [],
      hskLevels: Array.isArray(row.hsk_levels) ? row.hsk_levels : [],
      vocabularyIds: Array.isArray(row.vocabulary_ids) ? row.vocabulary_ids : [],
      exampleIds: [],
      mnemonic: row.mnemonic || undefined,
    };
  }
}

export const hanziRepository = new HanziRepository();
