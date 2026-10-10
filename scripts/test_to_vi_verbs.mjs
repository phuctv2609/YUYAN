import fs from 'node:fs';
import path from 'node:path';

const cvdictPath = path.join(process.cwd(), 'data/cvdict/CVDICT.u8');
const completePath = path.join(process.cwd(), 'data/complete-hsk-vocabulary/complete.json');

const completeData = JSON.parse(fs.readFileSync(completePath, 'utf8'));
const cvdictLines = fs.readFileSync(cvdictPath, 'utf8').split(/\r?\n/);

const cvdictMap = new Map();
function cleanMeaning(raw) {
  let m = raw.trim();
  if (/^LT:\s*/i.test(m) || /^CL:\s*/i.test(m)) return null;
  m = m.replace(/;\s*LT:[^;]+/gi, '');
  m = m.replace(/;\s*CL:[^;]+/gi, '');
  m = m.trim();
  if (!m) return null;
  return m;
}

for (const line of cvdictLines) {
  if (!line || line.startsWith('#')) continue;
  const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
  if (!match) continue;
  const [, trad, simp, pinyin, rawMeanings] = match;
  const rawList = rawMeanings.split('/');
  const cleanedList = [];
  for (const r of rawList) {
    const c = cleanMeaning(r);
    if (c && !cleanedList.includes(c)) cleanedList.push(c);
  }
  if (cleanedList.length === 0) continue;
  if (!cvdictMap.has(simp)) cvdictMap.set(simp, []);
  const list = cvdictMap.get(simp);
  for (const m of cleanedList) {
    if (!list.includes(m)) list.push(m);
  }
}

// Find meanings that start with "to <vietnamese verb>" like "to làm", "to trở thành", "to cho"
const toVietnameseRegex = /^to\s+(làm|cho|trở|đạt|mang|đi|đến|lấy|muốn|biết|nói|nghĩ|thấy|giữ|đặt|tìm|gặp|giúp|dùng|học|ăn|uống|mở|đóng|viết|đọc)/i;

const toViList = [];
for (const entry of completeData) {
  const simp = entry.simplified;
  const meanings = cvdictMap.get(simp) || [];
  for (const m of meanings) {
    if (toVietnameseRegex.test(m)) {
      toViList.push({ simp, m });
    }
  }
}

console.log(`Found ${toViList.length} items starting with "to <Vietnamese verb>":`);
console.log(toViList);
