/**
 * Canonical Pinyin (拼音) Model
 * Standardized phonetics model adhering to official HSK curriculum.
 */

export type PinyinUnitType =
  | 'simple_final'    // Vận mẫu đơn (a, o, e, i, u, ü)
  | 'compound_final'  // Vận mẫu phức (ai, ei, ao, ou, ia, ua, ie, uo, üe, iao, iou, uai, uei)
  | 'nasal_front'     // Vận mẫu mũi trước (an, ian, uan, üan, en, in, uen, ün)
  | 'nasal_back'      // Vận mẫu mũi sau (ang, iang, uang, eng, ing, ueng, ong, iong)
  | 'retroflex'       // Âm cong lưỡi (er)
  | 'nasal_ending'    // Đuôi âm mũi ng
  | 'initial';        // Thanh mẫu (b, p, m, f, d, t, n, l, g, k, h, j, q, x, zh, ch, sh, r, z, c, s)

export type PinyinMouthCategory =
  | 'open'            // Âm mở miệng (开口呼)
  | 'even_teeth'      // Âm đều răng (齐齿呼)
  | 'closed'          // Âm ngậm miệng (合口呼)
  | 'rounded';        // Âm chụm miệng (撮口呼)

export interface PinyinExampleWord {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

export interface PinyinItem {
  id: string;
  symbol: string;
  type: PinyinUnitType;
  category: string;
  mouthCategory?: PinyinMouthCategory;
  mouthCategoryNameVi?: string;
  ipa: string;
  pronunciationGuide: string;
  mouthGuide: string;
  tongueGuide: string;
  audioTarget: string; // Strictly the sound itself (e.g. 'e', 'ai', 'ang', 'b') - NEVER an example word!
  exampleSyllables?: string[];
  exampleWords?: PinyinExampleWord[];
  notes?: string;
}
