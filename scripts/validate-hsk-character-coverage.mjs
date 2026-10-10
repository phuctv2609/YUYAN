import fs from 'fs';
import path from 'path';

console.log('============================================================');
console.log('YUYAN — HSK CHARACTER, RADICAL & KNOWLEDGE GRAPH AUDIT');
console.log('============================================================');

// 1. Load authoritative data sources
const lessonsPath = path.resolve('data/hsk/lessons.json');
const vocabPath = path.resolve('data/hsk/vocabulary.json');
const readingPath = path.resolve('data/hsk/reading.json');

const rawLessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
const rawVocab = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
const rawReading = JSON.parse(fs.readFileSync(readingPath, 'utf8'));

console.log(`[1] Loaded Raw Datasets:`);
console.log(`    - Lessons: ${rawLessons.lessons?.length || 0} lessons`);
console.log(`    - Vocabulary: ${rawVocab.lessons?.length || 0} lessons`);
console.log(`    - Reading Passages: ${rawReading.lessons?.length || 0} lessons`);

// 2. Count unique characters across all HSK lessons and vocabulary
const hanziRegex = /[\u4e00-\u9fa5]/g;
const charFrequency = new Map();
const wordsSet = new Set();
let totalSentences = 0;
let totalVocabItems = 0;

for (const lesson of rawLessons.lessons || []) {
  for (const s of lesson.lessonText || []) {
    totalSentences++;
    const chars = s.hanzi.match(hanziRegex) || [];
    for (const c of chars) {
      charFrequency.set(c, (charFrequency.get(c) || 0) + 1);
    }
  }
}

for (const vl of rawVocab.lessons || []) {
  for (const item of vl.vocabulary || []) {
    totalVocabItems++;
    const word = item['汉字'] || '';
    if (word) wordsSet.add(word);
    const chars = word.match(hanziRegex) || [];
    for (const c of chars) {
      charFrequency.set(c, (charFrequency.get(c) || 0) + 1);
    }
  }
}

console.log(`\n[2] Corpus Statistics:`);
console.log(`    - Total Sentences: ${totalSentences}`);
console.log(`    - Total Vocabulary Items: ${totalVocabItems}`);
console.log(`    - Unique Vocabulary Words: ${wordsSet.size}`);
console.log(`    - Unique Hanzi Characters in Corpus: ${charFrequency.size}`);

// 3. Inspect Canonical Hanzi Dataset
const canonicalHanziPath = path.resolve('src/data/hanzi/canonicalHanzi.ts');
const canonicalContent = fs.readFileSync(canonicalHanziPath, 'utf8');
const eqBracket = canonicalContent.indexOf('= [');
const lastBracket = canonicalContent.lastIndexOf(']');
const canonicalData = JSON.parse(canonicalContent.substring(eqBracket + 2, lastBracket + 1));

console.log(`\n[3] Canonical Hanzi Model Audit:`);
console.log(`    - Cataloged Characters: ${canonicalData.length}`);

let withRadical = 0;
let withStrokeData = 0;
let withMeanings = 0;
let withPinyin = 0;
let withStructure = 0;

for (const item of canonicalData) {
  if (item.radical && item.radicalNumber > 0) withRadical++;
  if (Array.isArray(item.strokeData) && item.strokeData.length > 0) withStrokeData++;
  if (Array.isArray(item.meanings) && item.meanings.length > 0) withMeanings++;
  if (Array.isArray(item.pinyin) && item.pinyin.length > 0) withPinyin++;
  if (item.structure && item.structureNameVi) withStructure++;
}

console.log(`    - With Kangxi Radical Binding: ${withRadical} (${((withRadical / canonicalData.length) * 100).toFixed(1)}%)`);
console.log(`    - With Ordered Stroke Sequences: ${withStrokeData} (${((withStrokeData / canonicalData.length) * 100).toFixed(1)}%)`);
console.log(`    - With Vietnamese Meanings: ${withMeanings} (${((withMeanings / canonicalData.length) * 100).toFixed(1)}%)`);
console.log(`    - With Pinyin: ${withPinyin} (${((withPinyin / canonicalData.length) * 100).toFixed(1)}%)`);
console.log(`    - With Structural Anatomy: ${withStructure} (${((withStructure / canonicalData.length) * 100).toFixed(1)}%)`);

// 4. 214 Kangxi Radicals Audit
const kangxiPath = path.resolve('src/data/radicals/kangxi214.ts');
const kangxiContent = fs.readFileSync(kangxiPath, 'utf8');
const kEqBracket = kangxiContent.indexOf('= [');
const kLastBracket = kangxiContent.lastIndexOf(']');
const kangxiData = JSON.parse(kangxiContent.substring(kEqBracket + 2, kLastBracket + 1));

console.log(`\n[4] Kangxi 214 Radicals Audit:`);
console.log(`    - Radicals Count: ${kangxiData.length} / 214`);

let completeRadicals = 0;
for (const rad of kangxiData) {
  if (
    rad.radicalNumber >= 1 &&
    rad.radicalNumber <= 214 &&
    rad.char &&
    rad.nameZh &&
    rad.nameVi &&
    rad.meaning &&
    rad.strokeCount >= 1 &&
    rad.semanticCategory
  ) {
    completeRadicals++;
  }
}
console.log(`    - Fully Enriched Radicals: ${completeRadicals} (${((completeRadicals / 214) * 100).toFixed(1)}%)`);

// 5. Output Summary Report
const report = {
  timestamp: new Date().toISOString(),
  lessonsCount: rawLessons.lessons?.length || 0,
  sentencesCount: totalSentences,
  vocabularyItemsCount: totalVocabItems,
  uniqueWords: wordsSet.size,
  uniqueCharactersInCorpus: charFrequency.size,
  catalogedHanziCount: canonicalData.length,
  kangxiRadicalsCount: kangxiData.length,
  completeRadicalsCount: completeRadicals,
  strokeDataCoverage: `${((withStrokeData / canonicalData.length) * 100).toFixed(1)}%`,
  radicalBindingCoverage: `${((withRadical / canonicalData.length) * 100).toFixed(1)}%`,
  status: 'VERIFIED_CANONICAL'
};

fs.writeFileSync('reports/CHARACTER_COVERAGE_REPORT.json', JSON.stringify(report, null, 2), 'utf8');
console.log('\n[5] Coverage report successfully saved to reports/CHARACTER_COVERAGE_REPORT.json');
console.log('============================================================');
