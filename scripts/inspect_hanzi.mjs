import fs from 'fs';

const text = fs.readFileSync('src/data/hanzi/canonicalHanzi.ts', 'utf8');
const matches = text.match(/"char":\s*"([^"]+)"/g);
console.log('Total char matches in canonicalHanzi.ts:', matches ? matches.length : 0);
