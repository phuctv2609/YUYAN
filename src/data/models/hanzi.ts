/**
 * Canonical Hanzi (汉字) Model
 * Unified Chinese Character entity connected to Radicals, Vocabulary, HSK, and Stroke Order.
 */

export interface StrokePath {
  index: number;
  type: string; // e.g. "横 (Héng)", "竖 (Shù)", "撇 (Piě)", "捺 (Nà)", "折 (Zhé)", "点 (Diǎn)"
  nameVi: string; // e.g. "Nét Ngang", "Nét Sổ", "Nét Phẩy", "Nét Mác", "Nét Gập", "Nét Chấm"
  pathData?: string; // SVG path data (d="M...")
}

export interface CanonicalHanzi {
  char: string; // e.g. "学"
  traditional: string; // e.g. "學"
  pinyin: string[]; // e.g. ["xué"]
  pinyinNumbers: string[]; // e.g. ["xue2"]
  hanViet?: string; // e.g. "Học"
  meanings: string[]; // e.g. ["Học", "Học tập", "Trường học"]
  strokeCount: number; // e.g. 8
  radical: string; // e.g. "子"
  radicalNumber: number; // e.g. 39
  components: string[]; // e.g. ["⺍", "冖", "子"]
  decomposition: string; // e.g. "⿳⺍冖子"
  structure: 'single' | 'left-right' | 'top-bottom' | 'surround' | 'semi-surround' | 'other' | string;
  structureNameVi: string; // e.g. "Kết cấu Trên - Dưới"
  strokeData: StrokePath[]; // Real stroke sequence breakdown
  hskLevels: number[]; // e.g. [1]
  vocabularyIds: string[]; // Connected HSK vocabulary words (e.g. ["学习", "学生", "大学"])
  exampleIds: string[]; // Connected sentence IDs
  mnemonic?: string; // Memory aid
}

export interface HanziFilterOptions {
  query?: string;
  radicalNumber?: number;
  strokeCount?: number;
  minStrokes?: number;
  maxStrokes?: number;
  hskLevel?: number;
  limit?: number;
  offset?: number;
}
