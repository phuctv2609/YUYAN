/**
 * YUYAN Radical Repository
 * Data access abstraction for the 214 Kangxi Radicals knowledge graph.
 */

import { CanonicalRadical, RadicalFilterOptions } from '../models/radical';
import { KANGXI_214_RADICALS } from '../radicals/kangxi214';

export class RadicalRepository {
  private radicals: CanonicalRadical[] = KANGXI_214_RADICALS;
  private byNumber: Map<number, CanonicalRadical> = new Map();
  private byChar: Map<string, CanonicalRadical> = new Map();

  constructor() {
    for (const r of this.radicals) {
      this.byNumber.set(r.radicalNumber, r);
      this.byChar.set(r.char, r);
      for (const v of r.variants) {
        this.byChar.set(v, r);
      }
    }
  }

  public getAll(): CanonicalRadical[] {
    return [...this.radicals];
  }

  public getByNumber(num: number): CanonicalRadical | undefined {
    return this.byNumber.get(num);
  }

  public getByChar(char: string): CanonicalRadical | undefined {
    return this.byChar.get(char);
  }

  public filterByStroke(strokes: number): CanonicalRadical[] {
    return this.radicals.filter((r) => r.strokeCount === strokes);
  }

  public filterByCategory(category: string): CanonicalRadical[] {
    return this.radicals.filter((r) => r.semanticCategory.toLowerCase().includes(category.toLowerCase()));
  }

  public search(options: RadicalFilterOptions): CanonicalRadical[] {
    const q = (options.query || '').trim().toLowerCase();

    return this.radicals.filter((r) => {
      if (options.strokeCount !== undefined && r.strokeCount !== options.strokeCount) {
        return false;
      }
      if (options.semanticCategory && !r.semanticCategory.includes(options.semanticCategory)) {
        return false;
      }

      if (!q) return true;

      // Match by character
      if (r.char === q) return true;
      if (r.variants.some((v) => v.toLowerCase().includes(q))) return true;

      // Match by radical number
      if (String(r.radicalNumber) === q || `bộ ${r.radicalNumber}` === q) return true;

      // Match by Chinese name, Vietnamese name, or meaning
      if (r.nameZh.toLowerCase().includes(q)) return true;
      if (r.nameVi.toLowerCase().includes(q)) return true;
      if (r.meaning.toLowerCase().includes(q)) return true;
      if (r.mnemonic.toLowerCase().includes(q)) return true;

      return false;
    });
  }
}

export const radicalRepository = new RadicalRepository();
