import fs from 'node:fs';
import path from 'node:path';

const cvdictPath = path.join(process.cwd(), 'data/cvdict/CVDICT.u8');
const completePath = path.join(process.cwd(), 'data/complete-hsk-vocabulary/complete.json');

const completeData = JSON.parse(fs.readFileSync(completePath, 'utf8'));
console.log(`Loaded ${completeData.length} HSK entries from complete.json.`);

const cvdictLines = fs.readFileSync(cvdictPath, 'utf8').split(/\r?\n/);
console.log(`Loaded ${cvdictLines.length} lines from CVDICT.u8.`);

// Build CVDICT map: simplified -> array of vietnamese meanings
// Also map: traditional -> array of vietnamese meanings
const cvdictMap = new Map();

for (const line of cvdictLines) {
  if (!line || line.startsWith('#')) continue;
  // Format: trad simp [pinyin] /meaning1/meaning2/.../
  const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
  if (!match) continue;
  const [, trad, simp, pinyin, rawMeanings] = match;
  const meanings = rawMeanings.split('/').map(m => m.trim()).filter(Boolean);

  if (!cvdictMap.has(simp)) {
    cvdictMap.set(simp, []);
  }
  const list = cvdictMap.get(simp);
  for (const m of meanings) {
    if (!list.includes(m)) list.push(m);
  }

  // Also support traditional lookup
  if (trad !== simp) {
    if (!cvdictMap.has(trad)) {
      cvdictMap.set(trad, []);
    }
    const tList = cvdictMap.get(trad);
    for (const m of meanings) {
      if (!tList.includes(m)) tList.push(m);
    }
  }
}

console.log(`Parsed ${cvdictMap.size} distinct headwords from CVDICT.`);

// Test against complete.json
const matched = [];
const missing = [];

for (const entry of completeData) {
  const simp = entry.simplified;
  if (cvdictMap.has(simp)) {
    matched.push({ simp, meanings: cvdictMap.get(simp) });
  } else {
    missing.push(simp);
  }
}

console.log(`Direct matched: ${matched.length} / ${completeData.length} (${(matched.length / completeData.length * 100).toFixed(2)}%)`);
console.log(`Missing count: ${missing.length}`);
console.log('Missing words:', JSON.stringify(missing));
