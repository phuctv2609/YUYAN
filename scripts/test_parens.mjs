import fs from 'node:fs';
import path from 'node:path';

const cvdictPath = path.join(process.cwd(), 'data/cvdict/CVDICT.u8');
const completePath = path.join(process.cwd(), 'data/complete-hsk-vocabulary/complete.json');

const completeData = JSON.parse(fs.readFileSync(completePath, 'utf8'));
const cvdictLines = fs.readFileSync(cvdictPath, 'utf8').split(/\r?\n/);

const parenRegex = /\(([^)]+)\)/g;
const englishParens = new Set();

for (const line of cvdictLines) {
  if (!line || line.startsWith('#')) continue;
  let match;
  while ((match = parenRegex.exec(line)) !== null) {
    const inside = match[1];
    // if purely ASCII words
    if (/^[a-zA-Z\s,.-]+$/.test(inside) && inside.length > 2) {
      englishParens.add(inside.trim());
    }
  }
}

console.log(`Total unique English parentheticals: ${englishParens.size}`);
console.log('Sample 30 parentheticals:', Array.from(englishParens).slice(0, 30));
