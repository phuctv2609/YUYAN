import fs from 'fs';
import path from 'path';

// Parse CSV with quotes support
function parseCSV(content) {
  // Strip BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      if (currentRow.length > 1 || currentRow[0] !== '') {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1 || currentRow[0] !== '') {
      rows.push(currentRow);
    }
  }

  return rows;
}

const csvPath = 'C:/Users/Loan/Downloads/yuyan_10000_tu_chuyen_nganh.csv';
console.log('Loading CSV from:', csvPath);
const raw = fs.readFileSync(csvPath, 'utf8');
const allRows = parseCSV(raw);

const headers = allRows[0];
const dataRows = allRows.slice(1);

console.log('Headers:', headers);
console.log('Total data rows:', dataRows.length);

const colIdx = {};
headers.forEach((h, i) => {
  colIdx[h.trim()] = i;
});

// Audit containers
const industryCounts = {};
const subcatCounts = {};
const industryToSubcats = {};
const ids = new Set();
const duplicateIds = [];
const hanziSet = new Set();
const duplicateHanzis = [];
const wordTypes = {};
const levels = {};
const entryTypes = {};

let missingFields = {
  hanzi: 0,
  pinyin: 0,
  vietnamese: 0,
  industry: 0,
  subcategory: 0,
  example_sentence: 0,
};

let withCollocations = 0;
let withSynonyms = 0;
let withAntonyms = 0;
let withRelatedTerms = 0;
let withAudio = 0;

dataRows.forEach((row, rowIndex) => {
  const getCol = (name) => (row[colIdx[name]] !== undefined ? row[colIdx[name]].trim() : '');

  const id = getCol('id');
  const hanzi = getCol('hanzi');
  const pinyin = getCol('pinyin');
  const word_type = getCol('word_type');
  const vietnamese = getCol('vietnamese');
  const industry = getCol('industry');
  const subcategory = getCol('subcategory');
  const level = getCol('level');
  const entry_type = getCol('entry_type');
  const example_sentence = getCol('example_sentence');
  const collocations = getCol('collocations');
  const synonyms = getCol('synonyms');
  const antonyms = getCol('antonyms');
  const related_terms = getCol('related_terms');
  const audio = getCol('audio');

  // ID uniqueness
  if (ids.has(id)) {
    duplicateIds.push(id);
  } else {
    ids.add(id);
  }

  // Hanzi duplicates
  if (hanziSet.has(hanzi)) {
    duplicateHanzis.push({ id, hanzi, industry, subcategory });
  } else {
    hanziSet.add(hanzi);
  }

  // Industry counts
  industryCounts[industry] = (industryCounts[industry] || 0) + 1;

  // Subcategory counts
  const subcatKey = `${industry} -> ${subcategory}`;
  subcatCounts[subcatKey] = (subcatCounts[subcatKey] || 0) + 1;

  if (!industryToSubcats[industry]) {
    industryToSubcats[industry] = new Set();
  }
  if (subcategory) {
    industryToSubcats[industry].add(subcategory);
  }

  // Metadata distributions
  wordTypes[word_type] = (wordTypes[word_type] || 0) + 1;
  levels[level] = (levels[level] || 0) + 1;
  entryTypes[entry_type] = (entryTypes[entry_type] || 0) + 1;

  // Missing fields
  if (!hanzi) missingFields.hanzi++;
  if (!pinyin) missingFields.pinyin++;
  if (!vietnamese) missingFields.vietnamese++;
  if (!industry) missingFields.industry++;
  if (!subcategory) missingFields.subcategory++;
  if (!example_sentence) missingFields.example_sentence++;

  // Feature coverage
  if (collocations) withCollocations++;
  if (synonyms) withSynonyms++;
  if (antonyms) withAntonyms++;
  if (related_terms) withRelatedTerms++;
  if (audio) withAudio++;
});

console.log('\n======================================================');
console.log('1. DATASET VOLUME & INTEGRITY');
console.log('======================================================');
console.log('Total records:', dataRows.length);
console.log('Distinct IDs:', ids.size);
console.log('Duplicate IDs:', duplicateIds.length);
console.log('Distinct Hanzi:', hanziSet.size);
console.log('Duplicate Hanzi occurrences:', duplicateHanzis.length);

console.log('\n======================================================');
console.log('2. 26 INDUSTRIES DISTRIBUTION (EXACT COUNT PER INDUSTRY)');
console.log('======================================================');
const sortedIndustries = Object.keys(industryCounts).sort();
sortedIndustries.forEach((ind, idx) => {
  const subcatCount = industryToSubcats[ind] ? industryToSubcats[ind].size : 0;
  console.log(
    `${String(idx + 1).padStart(2, '0')}. [${ind}]: ${industryCounts[ind]} records (${subcatCount} subcategories)`
  );
});

console.log('\n======================================================');
console.log('3. SUBCATEGORIES BREAKDOWN');
console.log('======================================================');
console.log('Total unique subcategory pairs:', Object.keys(subcatCounts).length);
sortedIndustries.forEach((ind) => {
  const subcats = Array.from(industryToSubcats[ind] || []);
  console.log(`\n• ${ind} (${subcats.length} subcats):`);
  subcats.forEach((s) => {
    console.log(`   - ${s}: ${subcatCounts[`${ind} -> ${s}`]} records`);
  });
});

console.log('\n======================================================');
console.log('4. METADATA DISTRIBUTIONS');
console.log('======================================================');
console.log('Word Types:', wordTypes);
console.log('Levels:', levels);
console.log('Entry Types:', entryTypes);
console.log('Missing fields:', missingFields);
console.log('Coverage:');
console.log(` - Collocations: ${withCollocations} (${((withCollocations / dataRows.length) * 100).toFixed(1)}%)`);
console.log(` - Synonyms: ${withSynonyms} (${((withSynonyms / dataRows.length) * 100).toFixed(1)}%)`);
console.log(` - Antonyms: ${withAntonyms} (${((withAntonyms / dataRows.length) * 100).toFixed(1)}%)`);
console.log(` - Related Terms: ${withRelatedTerms} (${((withRelatedTerms / dataRows.length) * 100).toFixed(1)}%)`);
console.log(` - Audio field present: ${withAudio} (${((withAudio / dataRows.length) * 100).toFixed(1)}%)`);

// Save audit result to JSON
const reportData = {
  totalRecords: dataRows.length,
  distinctIds: ids.size,
  duplicateIds,
  distinctHanzi: hanziSet.size,
  duplicateHanziCount: duplicateHanzis.length,
  industryCounts,
  industryToSubcats: Object.fromEntries(
    Object.entries(industryToSubcats).map(([k, v]) => [k, Array.from(v)])
  ),
  subcatCounts,
  wordTypes,
  levels,
  entryTypes,
  missingFields,
  coverage: {
    collocations: withCollocations,
    synonyms: withSynonyms,
    antonyms: withAntonyms,
    related_terms: withRelatedTerms,
    audio: withAudio,
  },
};

fs.writeFileSync(
  path.join('reports', 'csv_taxonomy_audit_report.json'),
  JSON.stringify(reportData, null, 2)
);
console.log('\nAudit report written to reports/csv_taxonomy_audit_report.json');
