import fs from 'node:fs';

const cvdictLines = fs.readFileSync('data/cvdict/CVDICT.u8', 'utf8').split(/\r?\n/);
let ltCount = 0;
let samples = [];

for (const line of cvdictLines) {
  if (!line || line.startsWith('#')) continue;
  if (line.includes('LT:')) {
    ltCount++;
    if (samples.length < 5) samples.push(line);
  }
}

console.log(`Lines with LT: ${ltCount}`);
console.log('Samples with LT:', samples);
