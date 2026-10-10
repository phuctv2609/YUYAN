/**
 * YUYAN — Dictionary Ranking & Deduplication Pipeline
 * Strictly enforces ranking priorities (Section 17) and merges multiple source occurrences into one unified card (Section 18).
 */

import { DictionaryResult, DictionaryQuery } from './dictionaryTypes';
import { stripPinyinTones } from './dictionaryNormalizer';

/**
 * Computes deterministic score based on match precision and source authority
 * Lower score = higher priority in search results.
 */
export function calculateRankScore(result: DictionaryResult, query: DictionaryQuery): number {
  const rawQ = query.originalQuery.toLowerCase();
  const normQ = query.normalizedQuery.toLowerCase();
  const resHanzi = (result.hanzi || '').toLowerCase();
  const resPinyin = stripPinyinTones(result.pinyin || '');
  const resVi = (result.vietnamese || '').toLowerCase();
  const resEn = (result.english || '').toLowerCase();

  const isExactHanzi = resHanzi === rawQ;
  const isExactPinyin = resPinyin === normQ;
  const isExactVi = resVi === rawQ;
  const isExactEn = resEn === rawQ;

  // 1. Exact Match Priority Hierarchy
  if (isExactHanzi) {
    if (result.source.type === 'lesson') return 10;
    if (result.source.type === 'hsk') return 20;
    if (result.source.type === 'cvdict') return 25;
    if (result.source.type === 'professional') return 30;
    if (result.source.type === 'dedicated_dictionary') return 40;
    if (result.source.type === 'hanzi') return 50;
    if (result.source.type === 'external') return 80;
    return 90;
  }

  // 2. Exact Pinyin Match
  if (isExactPinyin) {
    if (result.source.type === 'hsk') return 100;
    if (result.source.type === 'cvdict') return 105;
    if (result.source.type === 'professional') return 110;
    if (result.source.type === 'hanzi') return 120;
    if (result.source.type === 'pinyin') return 130;
    if (result.source.type === 'external') return 140;
    return 150;
  }

  // 3. Exact Vietnamese Meaning Match
  if (isExactVi) {
    if (result.source.type === 'hsk') return 200;
    if (result.source.type === 'cvdict') return 205;
    if (result.source.type === 'professional') return 210;
    return 220;
  }

  // 4. Exact English Meaning Match
  if (isExactEn) {
    return 250;
  }

  // 5. Prefix / Starts-with match
  if (resHanzi.startsWith(rawQ)) return 300 + resHanzi.length;
  if (resPinyin.startsWith(normQ)) return 400 + resPinyin.length;
  if (resVi.startsWith(rawQ)) return 500 + resVi.length;

  // 6. Substring match
  if (resHanzi.includes(rawQ)) return 600 + resHanzi.length;
  if (resPinyin.includes(normQ)) return 700 + resPinyin.length;
  if (resVi.includes(rawQ)) return 800 + resVi.length;

  // 7. Web reference fallback
  if (result.source.type === 'web') return 1000;

  return 999;
}

/**
 * Deduplicates results by canonical Hanzi and merges source provenance
 */
export function deduplicateAndMergeResults(
  results: DictionaryResult[],
  query: DictionaryQuery
): DictionaryResult[] {
  const map = new Map<string, DictionaryResult>();

  for (const item of results) {
    const key = (item.hanzi || item.id).trim();

    if (!map.has(key)) {
      const copy: DictionaryResult = {
        ...item,
        mergedSources: [item.source],
      };
      copy.rankingScore = calculateRankScore(copy, query);
      map.set(key, copy);
    } else {
      const existing = map.get(key)!;

      // Merge sources array if not already present
      if (!existing.mergedSources) {
        existing.mergedSources = [existing.source];
      }
      const alreadyHas = existing.mergedSources.some(
        s => s.type === item.source.type && s.provider === item.source.provider
      );
      if (!alreadyHas) {
        existing.mergedSources.push(item.source);
      }

      // If incoming item has higher authority / richer data, promote metadata
      if (item.source.type === 'hsk' && existing.source.type !== 'lesson') {
        if (!existing.hskLevels && item.hskLevels) existing.hskLevels = item.hskLevels;
        if (!existing.lessons && item.lessons) existing.lessons = item.lessons;
      }

      if (item.source.type === 'professional') {
        if (!existing.professionalDomains && item.professionalDomains) {
          existing.professionalDomains = item.professionalDomains;
        }
        if (!existing.subcategory && item.subcategory) {
          existing.subcategory = item.subcategory;
        }
      }

      // Merge examples
      if (item.examples && item.examples.length > 0) {
        if (!existing.examples) existing.examples = [];
        for (const ex of item.examples) {
          if (!existing.examples.some(e => e.zh === ex.zh)) {
            existing.examples.push(ex);
          }
        }
      }

      // Re-evaluate rank score with merged sources
      const existingScore = existing.rankingScore ?? calculateRankScore(existing, query);
      const incomingScore = calculateRankScore(item, query);
      existing.rankingScore = Math.min(existingScore, incomingScore);
    }
  }

  // Convert to array and sort by ranking score ascending
  const mergedList = Array.from(map.values());
  mergedList.sort((a, b) => {
    const scoreA = a.rankingScore ?? 999;
    const scoreB = b.rankingScore ?? 999;
    if (scoreA !== scoreB) return scoreA - scoreB;
    // Secondary sort: shorter Hanzi first
    return (a.hanzi?.length || 0) - (b.hanzi?.length || 0);
  });

  return mergedList;
}
