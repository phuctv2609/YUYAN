import fs from 'node:fs';
import path from 'node:path';

const cvdictPath = path.join(process.cwd(), 'data/cvdict/CVDICT.u8');
const completePath = path.join(process.cwd(), 'data/complete-hsk-vocabulary/complete.json');

const completeData = JSON.parse(fs.readFileSync(completePath, 'utf8'));
const cvdictLines = fs.readFileSync(cvdictPath, 'utf8').split(/\r?\n/);

// Manual high quality Vietnamese definitions for the 31 compound words
const MANUAL_31_WORDS = {
  '不肯': ['không chịu', 'không bằng lòng', 'từ chối'],
  '不利于': ['không có lợi cho', 'bất lợi đối với'],
  '不难': ['không khó', 'dễ dàng'],
  '不如说': ['chi bằng nói', 'đúng hơn là nói'],
  '不太': ['không lắm', 'không quá'],
  '不一会儿': ['một lát sau', 'chẳng bao lâu', 'chốc lát'],
  '不予': ['không cho', 'không giải quyết', 'từ chối đáp ứng'],
  '车上': ['trên xe'],
  '趁着': ['nhân lúc', 'thừa dịp', 'nhân dịp'],
  '城里': ['trong thành phố', 'nội thành'],
  '打篮球': ['chơi bóng rổ'],
  '定为': ['xác định là', 'quy định là', 'định ra là'],
  '放到': ['đặt vào', 'để vào', 'bỏ vào'],
  '飞往': ['bay đến', 'bay tới'],
  '公益性': ['tính công ích', 'tính phúc lợi công cộng'],
  '很难说': ['khó nói', 'thật khó nói'],
  '怀着': ['mang trong lòng', 'ấp ủ', 'mang theo'],
  '见过': ['đã từng gặp', 'đã từng thấy'],
  '难以想象': ['khó mà tưởng tượng nổi', 'không thể tưởng tượng được'],
  '能不能': ['có thể hay không', 'liệu có thể'],
  '纽扣儿': ['cúc áo', 'khuy áo'],
  '说起来': ['nói đến', 'nhắc tới', 'nói ra thì'],
  '送到': ['đưa đến', 'gửi đến', 'chuyển đến'],
  '系领带': ['thắt cà vạt', 'đeo cà vạt'],
  '眼里': ['trong mắt', 'trong lòng'],
  '一番': ['một hồi', 'một phen', 'một lượt'],
  '有劲儿': ['có sức lực', 'khoẻ khoắn', 'tràn đầy năng lượng'],
  '这时候': ['lúc này', 'khi này', 'vào thời điểm này'],
  '着眼于': ['nhắm vào', 'chú trọng vào', 'xuất phát từ'],
  '指着': ['chỉ vào', 'trỏ vào'],
  '致力于': ['dốc sức vào', 'cống hiến cho', 'nỗ lực vì']
};

// Parse CVDICT
const cvdictMap = new Map();

function cleanMeaning(raw) {
  let m = raw.trim();
  // Strip LT tags
  if (/^LT:\s*/i.test(m) || /^CL:\s*/i.test(m)) return null;
  m = m.replace(/;\s*LT:[^;]+/gi, '');
  m = m.replace(/;\s*CL:[^;]+/gi, '');
  // Strip English glosses in parentheses if purely english, like (modal verb), (slang), (idiom) translated to Vietnamese
  // Strip standalone english tokens at start/end
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
    if (c && !cleanedList.includes(c)) {
      cleanedList.push(c);
    }
  }
  if (cleanedList.length === 0) continue;

  if (!cvdictMap.has(simp)) cvdictMap.set(simp, []);
  const list = cvdictMap.get(simp);
  for (const m of cleanedList) {
    if (!list.includes(m)) list.push(m);
  }
}

console.log(`CVDICT loaded: ${cvdictMap.size} headwords.`);

let emptyCount = 0;
let totalSenses = 0;
let minSenses = 999;
let maxSenses = 0;

for (const entry of completeData) {
  const simp = entry.simplified;
  let meaningsVi = [];

  if (MANUAL_31_WORDS[simp]) {
    meaningsVi = MANUAL_31_WORDS[simp];
  } else if (cvdictMap.has(simp)) {
    // take up to 6 most relevant meanings
    meaningsVi = cvdictMap.get(simp).slice(0, 6);
  }

  if (meaningsVi.length === 0) {
    emptyCount++;
    console.log('Empty meanings_vi for:', simp);
  }
  totalSenses += meaningsVi.length;
  if (meaningsVi.length < minSenses) minSenses = meaningsVi.length;
  if (meaningsVi.length > maxSenses) maxSenses = meaningsVi.length;
}

console.log(`Audited all 11,470 words:`);
console.log(`Empty meanings_vi count: ${emptyCount}`);
console.log(`Total Vietnamese senses: ${totalSenses}`);
console.log(`Min senses per word: ${minSenses}`);
console.log(`Max senses per word: ${maxSenses}`);
console.log(`Average senses per word: ${(totalSenses / 11470).toFixed(2)}`);
