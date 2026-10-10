/**
 * Canonical Radical (部首) Model
 * Standard 214 Kangxi Radicals relational schema.
 */

export interface CanonicalRadical {
  id: string; // e.g. "rad_85"
  char: string; // e.g. "水"
  radicalNumber: number; // 1 to 214
  nameZh: string; // e.g. "水字底 / 三点水"
  nameVi: string; // e.g. "Bộ Thủy (Nước)"
  meaning: string; // Meaning in Vietnamese / English
  strokeCount: number; // 1 to 17
  variants: string[]; // e.g. ["氵", "氺"]
  semanticCategory: string; // Nature, Human, Animal, Tool, etc.
  mnemonic: string; // Meaningful memory hook
  characterIds: string[]; // Real Hanzi characters belonging to this radical
  vocabularyIds: string[]; // Real vocabulary items containing these characters
}

export interface RadicalFilterOptions {
  query?: string;
  strokeCount?: number;
  semanticCategory?: string;
  hskLevel?: number;
}
