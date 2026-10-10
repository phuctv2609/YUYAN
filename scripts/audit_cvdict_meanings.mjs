import fs from 'node:fs';
import path from 'node:path';

const cvdictPath = path.join(process.cwd(), 'data/cvdict/CVDICT.u8');
const completePath = path.join(process.cwd(), 'data/complete-hsk-vocabulary/complete.json');

const completeData = JSON.parse(fs.readFileSync(completePath, 'utf8'));
const cvdictLines = fs.readFileSync(cvdictPath, 'utf8').split(/\r?\n/);

const cvdictMap = new Map();
for (const line of cvdictLines) {
  if (!line || line.startsWith('#')) continue;
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
}

// Check English leakage patterns
const ENGLISH_WORD_PATTERN = /\b(the|to|and|of|in|for|with|is|a|an|or|by|on|at|from|as|be|that|this|it|also|used|when|about|see|between|under|over|into|after|before|like|than|more|other|some|such|only|can|will|may|have|has|had|not|no|all|any|each|every|both|few|much|many|most|several|one|two|first|second|new|old|good|high|long|great|little|own|other|right|big|even|back|still|way|well|down|now|here|there|how|why|what|which|who|where)\b/i;

let flaggedSenses = 0;
let flaggedWords = 0;
const samples = [];

for (const entry of completeData) {
  const simp = entry.simplified;
  if (!cvdictMap.has(simp)) continue;

  const meanings = cvdictMap.get(simp);
  let wordFlagged = false;
  for (const m of meanings) {
    // ignore classifier tags like CL:个[ge4] or english loanwords like 'CD', 'DVD', 'email'
    const cleaned = m.replace(/CL:[^,;/]+/g, '').replace(/\b(CD|DVD|email|OK|PK|T-shirt|TV|UFO|WIFI|Wi-Fi|DNA|GPS|CEO|APP|app|SIM|VIP|KTV|MP3|MP4|ATM|PDF|Word|Excel|PowerPoint|PPT|Internet)\b/gi, '').trim();
    if (ENGLISH_WORD_PATTERN.test(cleaned)) {
      flaggedSenses++;
      if (!wordFlagged) {
        wordFlagged = true;
        flaggedWords++;
        if (samples.length < 25) {
          samples.push({ simp, meaning: m });
        }
      }
    }
  }
}

console.log(`Audited 11,439 matched words:`);
console.log(`Flagged senses with English words: ${flaggedSenses}`);
console.log(`Flagged words: ${flaggedWords}`);
console.log('Sample flagged senses:', JSON.stringify(samples, null, 2));
