// scripts/generate_hanzi_vietnamese_sql.mjs
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

const d = JSON.parse(fs.readFileSync('scratch/xue_dict.json', 'utf8'));
const dictMap = new Map();
for (const entry of Object.values(d)) {
  if (entry.s && entry.s.length === 1 && !dictMap.has(entry.s)) {
    dictMap.set(entry.s, entry);
  }
}

const manualMap = {
  '鬥': { sv: 'đấu', vi: ['đánh nhau, tranh đấu, đọ sức (dạng phồn thể của 斗, bộ Đấu)'] },
  '艸': { sv: 'thảo', vi: ['cỏ, loài thực vật thân thảo (dạng cổ của 草, bộ Thảo)'] },
  '榘': { sv: 'củ', vi: ['khuôn phép, quy củ (dạng dị thể của 矩)'] },
  '皙': { sv: 'tích', vi: ['da trắng trẻo, trắng nõn nà'] },
  '砦': { sv: 'trại', vi: ['đồn luỹ, hàng rào phòng thủ (dạng dị thể của 寨)'] },
  '琊': { sv: 'gia', vi: ['dùng trong địa danh Lang Gia Sơn (瑯琊山)'] },
  '泶': { sv: 'hạc', vi: ['nước mùa hè cạn, nước chảy ngầm'] },
  '祕': { sv: 'bí', vi: ['bí mật, kín đáo (dạng dị thể của 秘)'] },
  '锍': { sv: 'lưu', vi: ['hợp kim mờ (thuật luyện kim)'] },
  '榍': { sv: 'tiết', vi: ['khoáng vật sphene (khoáng thạch học)'] },
  '舯': { sv: 'trung', vi: ['giữa thân tàu (hàng hải)'] },
  '缍': { sv: 'đoái', vi: ['con thoi se sợi, quấn chỉ'] },
  '袴': { sv: 'khố', vi: ['cái quần (dị thể của 裤)'] },
  '碥': { sv: 'biển', vi: ['ghềnh đá hiểm trở nhô ra ven thác'] },
  '脩': { sv: 'tu', vi: ['thịt khô biếu thầy thời xưa; tu dưỡng'] },
  '藭': { sv: 'cung', vi: ['cây xuyên khung (dược liệu)'] },
  '鷉': { sv: 'đề', vi: ['chim le le, chim lặn (dị thể của 鷈)'] }
};

function escapeSqlStr(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

function escapeSqlArray(arr) {
  if (!arr || arr.length === 0) return "'{}'::text[]";
  const elements = arr.map(s => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',');
  return "'{" + elements.replace(/'/g, "''") + "}'::text[]";
}

async function buildSql() {
  console.log('Fetching all 6,500 canonical_hanzi rows...');
  let allChars = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('canonical_hanzi')
      .select('char, han_viet, meanings')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allChars.push(...data);
    page++;
  }
  console.log(`Fetched ${allChars.length} characters.`);

  const rows = [];
  for (const c of allChars) {
    let newMeanings = null;
    let newHanViet = c.han_viet;

    if (manualMap[c.char]) {
      const manual = manualMap[c.char];
      newMeanings = manual.vi;
      if (!newHanViet) newHanViet = manual.sv;
    } else {
      const entry = dictMap.get(c.char);
      if (entry && entry.vi && entry.vi.trim().length > 0) {
        const splitMeanings = entry.vi
          .split(/[/;]/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        if (splitMeanings.length > 0) {
          newMeanings = splitMeanings;
        }
      }
      if ((!newHanViet || newHanViet.trim() === '') && entry && entry.sv && entry.sv.trim().length > 0) {
        newHanViet = entry.sv.trim().toLowerCase();
      }
    }

    if (!newMeanings) newMeanings = c.meanings;

    rows.push({
      char: c.char,
      han_viet: newHanViet,
      meanings: newMeanings
    });
  }

  console.log(`Generating SQL for ${rows.length} characters...`);
  // Split into files of 2000 rows each
  const chunkSize = 2000;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const valueTuples = chunk.map(r => 
      `(${escapeSqlStr(r.char)}, ${escapeSqlStr(r.han_viet)}, ${escapeSqlArray(r.meanings)})`
    ).join(',\n');

    const sql = `
UPDATE public.canonical_hanzi AS h
SET 
  meanings = v.meanings,
  han_viet = COALESCE(v.han_viet, h.han_viet)
FROM (VALUES
${valueTuples}
) AS v(char, han_viet, meanings)
WHERE h.char = v.char;
`;
    const filename = `supabase/batch_hanzi_vi_${i / chunkSize}.sql`;
    fs.writeFileSync(filename, sql, 'utf8');
    console.log(`Wrote ${filename} (${chunk.length} rows)`);
  }
}

buildSql();
