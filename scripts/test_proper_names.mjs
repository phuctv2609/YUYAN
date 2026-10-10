import fs from 'node:fs';

const cvdictLines = fs.readFileSync('data/cvdict/CVDICT.u8', 'utf8').split(/\r?\n/);
const complete = JSON.parse(fs.readFileSync('data/complete-hsk-vocabulary/complete.json', 'utf8'));

const properNamesInHsk = complete.filter(c => Array.isArray(c.pos) && (c.pos.includes('nr') || c.pos.includes('ns') || c.pos.includes('nt') || c.pos.includes('nz')));

console.log(`HSK words with proper name POS (nr/ns/nt/nz): ${properNamesInHsk.length}`);

// Sample 10 proper names
for (const p of properNamesInHsk.slice(0, 10)) {
  const line = cvdictLines.find(l => l.includes(' ' + p.simplified + ' ['));
  console.log(p.simplified, p.pos, '->', line ? line.split('/').slice(1, -1).join('; ') : 'NOT FOUND IN CVDICT');
}
