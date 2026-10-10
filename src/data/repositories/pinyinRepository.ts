/**
 * YUYAN Pinyin Repository
 * Structured data access for canonical initials, simple finals, compound finals, nasals, retroflex, and mouth classifications.
 */

import { PinyinItem, PinyinMouthCategory, PinyinUnitType } from '../models/pinyin';
import {
  ALL_PINYIN_ITEMS,
  SIMPLE_FINALS_DATA,
  COMPOUND_FINALS_DATA,
  NASAL_FINALS_DATA,
  RETROFLEX_AND_SPECIAL_DATA,
  INITIALS_DATA,
} from '../pinyin/pinyinData';

export class PinyinRepository {
  private items: PinyinItem[] = ALL_PINYIN_ITEMS;
  private bySymbol: Map<string, PinyinItem> = new Map();

  constructor() {
    for (const item of this.items) {
      this.bySymbol.set(item.symbol.toLowerCase(), item);
    }
  }

  public getAll(): PinyinItem[] {
    return [...this.items];
  }

  public getBySymbol(symbol: string): PinyinItem | undefined {
    return this.bySymbol.get(symbol.trim().toLowerCase());
  }

  public getSimpleFinals(): PinyinItem[] {
    return SIMPLE_FINALS_DATA;
  }

  public getCompoundFinals(): PinyinItem[] {
    return COMPOUND_FINALS_DATA;
  }

  public getNasalFinals(filter?: 'front' | 'back'): PinyinItem[] {
    if (filter === 'front') {
      return NASAL_FINALS_DATA.filter((i) => i.type === 'nasal_front');
    }
    if (filter === 'back') {
      return NASAL_FINALS_DATA.filter((i) => i.type === 'nasal_back');
    }
    return NASAL_FINALS_DATA;
  }

  public getRetroflexAndSpecial(): PinyinItem[] {
    return RETROFLEX_AND_SPECIAL_DATA;
  }

  public getInitials(): PinyinItem[] {
    return INITIALS_DATA;
  }

  public getByMouthCategory(category: PinyinMouthCategory): PinyinItem[] {
    return this.items.filter((i) => i.mouthCategory === category);
  }

  public getByType(type: PinyinUnitType): PinyinItem[] {
    return this.items.filter((i) => i.type === type);
  }
}

export const pinyinRepository = new PinyinRepository();
