import fs from 'node:fs';

const cvdictLines = fs.readFileSync('data/cvdict/CVDICT.u8', 'utf8').split(/\r?\n/);

let clCount = 0;
let seeCount = 0;
let sampleTags = [];

for (const line of cvdictLines) {
  if (!line || line.startsWith('#')) continue;
  if (line.includes('CL:')) {
    clCount++;
    if (sampleTags.length < 5) sampleTags.push(line);
  }
}

console.log(`Lines with CL: ${clCount}`);
console.log('Samples with CL:', sampleTags);
