import fs from 'node:fs';

const cvdictLines = fs.readFileSync('data/cvdict/CVDICT.u8', 'utf8').split(/\r?\n/);

// Let's find lines in CVDICT where the meaning contains English phrases like "to do something", "abbr. for", "see also", etc.
const trueEnglishPhrases = [
  /\bto\s+[a-z]{3,}\b/i,
  /\bsee\s+also\b/i,
  /\babbr\.\s+for\b/i,
  /\b(something|somebody|someone)\b/i,
  /\b(used\s+in|used\s+to|used\s+as)\b/i,
  /\b(kind\s+of|type\s+of)\b/i,
  /\b(in\s+order\s+to)\b/i,
  /\b(as\s+well\s+as)\b/i,
];

let englishLines = 0;
const samples = [];

for (const line of cvdictLines) {
  if (!line || line.startsWith('#')) continue;
  for (const p of trueEnglishPhrases) {
    if (p.test(line)) {
      englishLines++;
      if (samples.length < 15) samples.push(line);
      break;
    }
  }
}

console.log(`Total data lines with true English phrases: ${englishLines} / ${cvdictLines.length}`);
console.log('Samples:', samples);
