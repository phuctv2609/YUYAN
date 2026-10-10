import hsk3Data from './hsk3GrammarData.json';
import hsk2Data from './hsk2GrammarData.json';
import { NormalizedGrammarPoint, HskVersion } from './types';

export * from './types';

export const HSK3_GRAMMAR_CATALOG: NormalizedGrammarPoint[] = hsk3Data as any;
export const HSK2_GRAMMAR_CATALOG: NormalizedGrammarPoint[] = hsk2Data as any;

export const COMBINED_GRAMMAR_CATALOG: NormalizedGrammarPoint[] = [
  ...HSK3_GRAMMAR_CATALOG,
  ...HSK2_GRAMMAR_CATALOG,
];

export function getGrammarByVersionAndLevel(
  version: HskVersion,
  level?: number | 'all'
): NormalizedGrammarPoint[] {
  const catalog = version === 'hsk3' ? HSK3_GRAMMAR_CATALOG : HSK2_GRAMMAR_CATALOG;
  if (!level || level === 'all') return catalog;
  return catalog.filter((g) => g.normalizedLevel === level);
}
